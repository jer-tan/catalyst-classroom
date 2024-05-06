import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { initializeDb } from "@/app/lib/database";
import { and, eq } from "drizzle-orm";
import s3 from "@/app/lib/s3";
import OpenAI from "openai";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import fs from "fs";
import { ai_materials } from "../../../../db/schema";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
const assistanceId = process.env.OPENAI_ASSISTANCE_ID || "";
const jwtSecret = process.env.JWT_SECRET;

interface jwtResponse {
  user_id: number;
  name: string;
  email: string;
  created_at: string;
  iat: number;
  exp: number;
}

export async function POST(req: NextRequest) {
  try {
    const token = cookies().get("jwt");
    if (!token?.value) {
      return NextResponse.json({
        status: 401,
        message: "Unauthorized",
      });
    }

    const tokenInfo = (await jwt.verify(
      String(token.value),
      jwtSecret!
    )) as jwtResponse;
    if (!tokenInfo) {
      return NextResponse.json({
        status: 401,
        message: "Unauthorized",
      });
    }

    const data = await req.formData();

    if (!data.has("key")) {
      return NextResponse.json({
        status: 400,
        message: "Missing required fields",
      });
    }

    const key = data.get("key") as string;
    const filePath = (await key.split("/").pop()) as string;

    const database = await initializeDb();

    const responseQuery = await database
      .select()
      .from(ai_materials)
      .where(eq(ai_materials.document_key, key));

    if (responseQuery.length > 0) {
      return NextResponse.json({
        status: 200,
        response: responseQuery[0].response,
        document_name: filePath,
      });
    }

    // OPENAI
    const command = new GetObjectCommand({
      Bucket: "jerome-catalyst",
      Key: data.get("key") as string,
    });

    const response: any = await s3.send(command);

    const writeStream = fs.createWriteStream(filePath); // Create write stream
    response.Body.pipe(writeStream); // Pipe response body to write stream

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    }); // Wait for download completion

    const readStream = fs.createReadStream(filePath);

    const resource = await openai.files.create({
      file: readStream,
      purpose: "assistants",
    });

    // let vectorStore = await openai.beta.vectorStores.create({
    //   name: data.get("key") as string,
    // });

    // let vectorFiles = await openai.beta.vectorStores.fileBatches.uploadAndPoll(
    //   vectorStore.id,
    //   { files: [readStream] } // Pass the Readable stream as an array
    // );

    // const threadId = (await openai.beta.threads.create({})).id;

    // const fileId = (
    //   await openai.files.create({
    //     file: await fetch(url),
    //     purpose: "assistants",
    //   })
    // ).id;

    const thread = await openai.beta.threads.create();

    const message = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content:
        "Please summarize the document and extract its key points, then create questions with the correct answers to assess user comprehension based on the document's content. Do not provide multiple choice questions, only a set of questions with their correct answers. You can only use bold and next line formatting and do not use citation",
      // Attach the new file to the message.
      attachments: [{ file_id: resource.id, tools: [{ type: "file_search" }] }],
    });

    let run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistanceId,
    });

    let res = "";
    let ans = "";
    if (run.status === "completed") {
      const messages = await openai.beta.threads.messages.list(run.thread_id);
      for (const message of messages.data.reverse()) {
        if (message.content[0].type === "text") {
          console.log(
            `${message.role} > ${JSON.stringify(message.content[0])}`
          );
          res = res + `${message.role} > ${JSON.stringify(message.content[0])}`;

          if (message.role === "assistant") {
            ans = JSON.stringify(message.content[0].text.value).slice(1, -1);
          }
        }
      }
    } else {
      console.log(run.status);
    }

    await openai.files.del(resource.id);
    await fs.unlinkSync(filePath);

    await database.insert(ai_materials).values({
      document_key: key,
      response: ans,
    });

    return NextResponse.json({
      status: 200,
      response: ans,
      document_name: filePath,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      status: 500,
      message: "An error occured when running AI assistance",
    });
  }
}
