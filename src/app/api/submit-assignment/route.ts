import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { initializeDb } from "@/app/lib/database";
import { and, eq } from "drizzle-orm";
import {
  assignment_submissions,
  assignments,
  classroom_roles,
} from "../../../../db/schema";
import s3 from "@/app/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

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

    if (!data.has("assignmentId")) {
      return NextResponse.json({
        status: 400,
        message: "Missing required fields",
      });
    }

    const database = await initializeDb();

    const assignmentResponse = await database
      .select()
      .from(assignments)
      .where(eq(assignments.id, Number(data.get("assignmentId"))))
      .limit(1);

    const userResponse = await database
      .select()
      .from(classroom_roles)
      .where(
        and(
          and(
            eq(classroom_roles.user_id, tokenInfo.user_id),
            eq(
              classroom_roles.classroom_id,
              String(assignmentResponse[0].classroom_id)
            )
          ),
          eq(classroom_roles.role, "Student")
        )
      )
      .limit(1);

    if (userResponse.length == 0) {
      return NextResponse.json({
        status: 401,
        message: "You are not authorized to submit assignments",
      });
    }

    const res = await database.insert(assignment_submissions).values({
      assignment_id: Number(assignmentResponse[0].id),
      user_id: tokenInfo.user_id,
      submitted_at: new Date(),
    });

    let i = 0;
    let file;
    while ((file = data.get(`files[${i}]`) as Blob | null)) {
      let file1 = data.get(`files[${i}]`) as any;
      const buffer = Buffer.from(await file.arrayBuffer());
      const params = {
        Bucket: "jerome-catalyst",
        Key: `assignment-submissions/${res[0].insertId}/${file1["name"]}`, // Access the insertId property correctly
        Body: buffer,
      };
      s3.send(new PutObjectCommand(params));
      i++;
    }

    return NextResponse.json({ status: 200, message: "Assignment submitted" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      status: 500,
      message: "An error occured when submitting an assignment",
    });
  }
}
