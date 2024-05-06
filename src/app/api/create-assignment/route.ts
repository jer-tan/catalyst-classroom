import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { initializeDb } from "@/app/lib/database";
import { and, eq } from "drizzle-orm";
import { assignments, classroom_roles } from "../../../../db/schema";
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

    if (
      !data.has("classroomId") ||
      !data.has("assignmentName") ||
      !data.has("assignmentDescription") ||
      !data.has("possibleMarks") ||
      !data.has("dueDate")
    ) {
      return NextResponse.json({
        status: 400,
        message: "Missing required fields",
      });
    }

    const database = await initializeDb();

    const userResponse = await database
      .select()
      .from(classroom_roles)
      .where(
        and(
          and(
            eq(classroom_roles.user_id, tokenInfo.user_id),
            eq(classroom_roles.classroom_id, String(data.get("classroomId")))
          ),
          eq(classroom_roles.role, "Instructor")
        )
      )
      .limit(1);

    if (userResponse.length == 0) {
      return NextResponse.json({
        status: 401,
        message: "You are not authorized to create assignments",
      });
    }

    const res = await database.insert(assignments).values({
      classroom_id: String(data.get("classroomId")), // Convert the value to a number
      name: String(data.get("assignmentName")),
      description: String(data.get("assignmentDescription")),
      possible_marks: Number(data.get("possibleMarks")), // Convert the value to a number
      due_at: new Date(String(data.get("dueDate"))), // Changed due_date to due_at
    });

    let i = 0;
    let file;
    while ((file = data.get(`files[${i}]`) as Blob | null)) {
      let file1 = data.get(`files[${i}]`) as any;
      const buffer = Buffer.from(await file.arrayBuffer());
      const params = {
        Bucket: "jerome-catalyst",
        Key: `assignments/${res[0].insertId}/${file1["name"]}`, // Access the insertId property correctly
        Body: buffer,
      };
      s3.send(new PutObjectCommand(params));
      i++;
    }

    return NextResponse.json({ status: 200, message: "Assignment created" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      status: 500,
      message: "An error occured when creating an assignment",
    });
  }
}
