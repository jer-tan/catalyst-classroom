import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { initializeDb } from "@/app/lib/database";
import { and, eq } from "drizzle-orm";
import {
  assignment_submissions,
  assignments,
  classroom_roles,
  classrooms,
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

    if (!data.has("classroomId")) {
      return NextResponse.json({
        status: 400,
        message: "Missing required fields",
      });
    }

    if (!data.has("files[0]")) {
      return NextResponse.json({
        status: 400,
        message: "No files uploaded",
      });
    }

    const database = await initializeDb();

    const classroomResponse = await database
      .select()
      .from(classrooms)
      .where(eq(classrooms.id, String(data.get("classroomId"))));

    if (classroomResponse.length == 0) {
      return NextResponse.json({
        status: 404,
        message: "Classroom not found",
      });
    }

    const userResponse = await database
      .select()
      .from(classroom_roles)
      .where(
        and(
          and(
            eq(classroom_roles.user_id, tokenInfo.user_id),
            eq(classroom_roles.classroom_id, String(classroomResponse[0].id))
          ),
          eq(classroom_roles.role, "Instructor")
        )
      )
      .limit(1);

    if (userResponse.length == 0) {
      return NextResponse.json({
        status: 401,
        message: "You are not authorized to upload materials",
      });
    }

    let i = 0;
    let file;
    while ((file = data.get(`files[${i}]`) as Blob | null)) {
      let file1 = data.get(`files[${i}]`) as any;
      console.log(file1["name"]);
      const buffer = Buffer.from(await file.arrayBuffer());
      const params = {
        Bucket: "jerome-catalyst",
        Key: `classroom-materials/${data.get("classroomId")}/${file1["name"]}`,
        Body: buffer,
      };
      try {
        await s3.send(new PutObjectCommand(params));
      } catch (err) {
        console.log(err);
        return NextResponse.json({
          status: 500,
          message: "An error occured when uploading material",
        });
      }
      i++;
    }

    return NextResponse.json({ status: 200, message: "Material uploaded" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      status: 500,
      message: "An error occured when uploading material",
    });
  }
}
