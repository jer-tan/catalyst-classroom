"use server";
import jwt from "jsonwebtoken";
import { initializeDb } from "./database";
import { classroom_roles, classrooms, users } from "../../../db/schema";
import { count, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";

const jwtSecret = process.env.JWT_SECRET;

interface jwtResponse {
  user_id: number;
  name: string;
  email: string;
  created_at: string;
  iat: number;
  exp: number;
}

export async function sendMessage(classroomId: string, message: string) {
  if (!classroomId) {
    return await JSON.stringify({
      status: 400,
      message: "Bad Request",
    });
  }

  try {
    const database = await initializeDb();
    const idCheckResponse = await database
      .select({ count: count() })
      .from(classrooms)
      .where(eq(classrooms.id, classroomId));

    if (idCheckResponse[0].count == 0) {
      return await JSON.stringify({
        status: 404,
        message: "Classroom not found",
      });
    }

    // got classroom, now send message
    

    return await JSON.stringify({
      status: 200,
      message: "Classroom found",
    });

  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while sending message",
    });
  }
}

export async function createClassroom(
  classroomId: string,
  classroomName: string,
  classroomDescription: string
) {
  if (!classroomId || !classroomName || !classroomDescription) {
    return await JSON.stringify({
      status: 400,
      message: "Bad Request",
    });
  }

  if (classroomId.length < 3) {
    return await JSON.stringify({
      status: 400,
      message: "Classroom ID must be at least 3 characters long",
    });
  }

  try {
    const token = cookies().get("jwt");
    if (!token?.value) {
      return await JSON.stringify({
        status: 401,
        message: "Unauthorized",
      });
    }

    const tokenInfo = (await jwt.verify(
      String(token.value),
      jwtSecret!
    )) as jwtResponse;
    if (!tokenInfo) {
      return await JSON.stringify({
        status: 401,
        message: "Unauthorized",
      });
    }

    const database = await initializeDb();
    const idCheckResponse = await database
      .select({ count: count() })
      .from(classrooms)
      .where(eq(classrooms.id, classroomId));

    if (idCheckResponse[0].count > 0) {
      return await JSON.stringify({
        status: 400,
        message: "Classroom ID already exists",
      });
    }

    const insertTransaction = await database.transaction(async (tx) => {
      await tx.insert(classrooms).values({
        id: classroomId,
        name: classroomName,
        description: classroomDescription,
        created_by: tokenInfo.user_id,
      });

      await tx.insert(classroom_roles).values({
        classroom_id: classroomId,
        user_id: tokenInfo.user_id,
        role: "Instructor",
      });
    });

    return await JSON.stringify({
      status: 200,
      message: "Classroom created successfully",
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while creating the classroom",
    });
  }
}

export async function getClassrooms() {
  try {
    const token = cookies().get("jwt");
    if (!token?.value) {
      return await JSON.stringify({
        status: 401,
        message: "Unauthorized",
      });
    }

    const tokenInfo = (await jwt.verify(
      String(token.value),
      jwtSecret!
    )) as jwtResponse;
    if (!tokenInfo) {
      return await JSON.stringify({
        status: 401,
        message: "Unauthorized",
      });
    }
    const database = await initializeDb();
    const classroomResponse = await database
      .select({
        classroom_id: classrooms.id,
        classroom_name: classrooms.name,
        classroom_description: classrooms.description,
      })
      .from(classrooms)
      .innerJoin(
        classroom_roles,
        eq(classroom_roles.classroom_id, classrooms.id)
      )
      .where(eq(classroom_roles.user_id, tokenInfo.user_id)); // Filter by student ID

    const instructorResponse = await database
      .select({
        classroom_id: classroom_roles.classroom_id,
        instructor: users.name,
      })
      .from(classroom_roles)
      .innerJoin(
        users,
        eq(users.id, classroom_roles.user_id) &&
          eq(classroom_roles.role, "Instructor")
      )
      .where(
        inArray(
          classroom_roles.classroom_id,
          classroomResponse.map((c) => c.classroom_id)
        )
      );

    const combinedReponse = classroomResponse.map((c) => {
      const instructor = instructorResponse.find(
        (i) => i.classroom_id === c.classroom_id
      );
      return { ...c, instructor: instructor?.instructor };
    });
    // .select({
    //   id: classrooms.id,
    //   name: classrooms.name,
    //   description: classrooms.description,
    //   instructor: users.name,
    // })
    // .from(classroom_roles)
    // .innerJoin(classrooms, eq(classroom_roles.classroom_id, classrooms.id))
    // .innerJoin(users, eq(classroom_roles.user_id, users.id))
    // .where(
    //   eq(classroom_roles.user_id, tokenInfo.user_id) &&
    //     eq(classroom_roles.role, "Instructor")
    // );

    return await JSON.stringify(combinedReponse);
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while getting classrooms",
    });
  }
}
