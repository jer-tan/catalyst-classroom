"use server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { initializeDb } from "./database";
import {
  assignment_submissions,
  assignments,
  classroom_invites,
  classroom_roles,
  classrooms,
  users,
} from "../../../db/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import crypto from "crypto";
import s3 from "@/app/lib/s3";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const jwtSecret = process.env.JWT_SECRET;

interface jwtResponse {
  user_id: number;
  name: string;
  email: string;
  created_at: string;
  iat: number;
  exp: number;
}

export async function checkClassroomId(classroomId: string) {
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

    return await JSON.stringify({
      status: 200,
      message: "Classroom found",
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while checking classroom ID",
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

    const codeLength = Math.floor(Math.random() * (10 - 5)) + 5;
    const code = crypto.randomBytes(codeLength).toString("hex").toUpperCase();

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

      await tx.insert(classroom_invites).values({
        classroom_id: classroomId,
        code: code,
        created_by: tokenInfo.user_id,
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

    if (classroomResponse.length == 0) {
      return await JSON.stringify({
        status: 200,
        message: "No classrooms found",
      });
    }
    let instructorResponse: any[] = [];
    if (classroomResponse.length > 0) {
      instructorResponse = await database
        .select({
          classroom_id: classroom_roles.classroom_id,
          instructor: users.name,
        })
        .from(classroom_roles)
        .innerJoin(users, eq(users.id, classroom_roles.user_id))
        .where(
          and(
            inArray(
              classroom_roles.classroom_id,
              classroomResponse.map((c) => c.classroom_id)
            ),
            eq(classroom_roles.role, "Instructor")
          )
        );
    }
    const combinedReponse = classroomResponse.map((c) => {
      const instructor = instructorResponse.find(
        (i) => i.classroom_id === c.classroom_id
      );
      return { ...c, instructor: instructor?.instructor };
    });

    return await JSON.stringify(combinedReponse);
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while getting classrooms",
    });
  }
}

export async function getOwnedClassrooms() {
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
      })
      .from(classrooms)
      .innerJoin(
        classroom_roles,
        eq(classroom_roles.classroom_id, classrooms.id)
      )
      .where(
        and(
          eq(classroom_roles.user_id, tokenInfo.user_id),
          eq(classroom_roles.role, "Instructor")
        )
      ); // Filter by student ID

    if (classroomResponse.length == 0) {
      return await JSON.stringify({
        status: 404,
        message: "No classrooms found",
      });
    }

    return await JSON.stringify({
      status: 200,
      data: classroomResponse,
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while getting classrooms",
    });
  }
}

export async function userInformation() {
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
    const userResponse = await database
      .select({
        username: users.username,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, tokenInfo.user_id));

    if (userResponse.length == 0) {
      return await JSON.stringify({
        status: 404,
        message: "User not found",
      });
    }
    return await JSON.stringify(userResponse);
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while fetching user information",
    });
  }
}

export async function updateAccountInformation(name: string, email: string) {
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
    const updateUserResponse = await database
      .update(users)
      .set({ name: name, email: email })
      .where(eq(users.id, tokenInfo.user_id));

    if (!updateUserResponse) {
      return await JSON.stringify({
        status: 500,
        message: "An error occurred while updating user information",
      });
    }

    return await JSON.stringify({
      status: 200,
      message: "Account information updated successfully",
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while fetching user information",
    });
  }
}

export async function updateAccountPassword(
  oldpassword: string,
  newpassword: string
) {
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
    const userResponse = await database
      .select({ password_hash: users.password_hash })
      .from(users)
      .where(eq(users.id, tokenInfo.user_id));

    if (userResponse.length == 0) {
      return await JSON.stringify({
        status: 404,
        message: "User not found",
      });
    }

    const passwordMatch = await bcrypt.compare(
      oldpassword,
      userResponse[0].password_hash || ""
    );
    if (!passwordMatch) {
      return await JSON.stringify({
        status: 400,
        message: "Incorrect password",
      });
    }

    const hashedNewPassword = await bcrypt.hashSync(newpassword, 12);
    const updateUserResponse = await database
      .update(users)
      .set({ password_hash: hashedNewPassword })
      .where(eq(users.id, tokenInfo.user_id));

    if (!updateUserResponse) {
      return await JSON.stringify({
        status: 500,
        message: "An error occurred while updating user information",
      });
    }

    return await JSON.stringify({
      status: 200,
      message: "Account information updated successfully",
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while fetching user information",
    });
  }
}

export async function joinClassroom(inviteCode: string) {
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
      .select()
      .from(classroom_invites)
      .leftJoin(classrooms, eq(classroom_invites.classroom_id, classrooms.id))
      .where(eq(classroom_invites.code, inviteCode))
      .limit(1);

    if (classroomResponse.length == 0) {
      return await JSON.stringify({
        status: 404,
        message: "Invalid invite code",
      });
    }

    const insertClassroomRole = await database.insert(classroom_roles).values({
      classroom_id: classroomResponse[0]?.classrooms?.id,
      user_id: tokenInfo.user_id,
      role: "Student",
    });

    if (!insertClassroomRole) {
      return await JSON.stringify({
        status: 500,
        message: "An error occurred while joining classroom",
      });
    }

    return await JSON.stringify({
      status: 200,
      message:
        "Successfully joined " +
        classroomResponse[0].classrooms?.name +
        " classroom",
    });
  } catch (error: any) {
    console.log(error);
    if (error.code && error?.code === "ER_DUP_ENTRY") {
      return await JSON.stringify({
        status: 400,
        message: "You are already a member of this classroom",
      });
    }
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while joining classroom",
    });
  }
}

export async function getClassroomInformation(classroomId: string) {
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
        classroom_instructor: classrooms.created_by,
        user_role: classroom_roles.role,
        invite_code: classroom_invites.code,
      })
      .from(classrooms)
      .innerJoin(
        classroom_roles,
        eq(classroom_roles.classroom_id, classrooms.id)
      )
      .innerJoin(
        classroom_invites,
        eq(classroom_invites.classroom_id, classrooms.id)
      )
      .where(
        and(
          eq(classroom_roles.user_id, tokenInfo.user_id),
          eq(classrooms.id, classroomId)
        )
      )
      .limit(1); // Filter by student ID

    if (classroomResponse.length == 0) {
      return await JSON.stringify({
        status: 404,
        message: "Classroom not found",
      });
    }

    const assignmentResponse = await database
      .select()
      .from(assignments)
      .where(eq(assignments.classroom_id, classroomId));

    const command = new ListObjectsV2Command({
      Bucket: "jerome-catalyst",
      Prefix: `classroom-materials/${classroomId}/`,
      // The default and maximum number of keys returned is 1000. This limits it to
      // one for demonstration purposes.
      MaxKeys: 1000,
    });

    let isTruncated = true;

    let referenceFiles: {
      fileName: string | undefined;
      url: string;
      key: string | undefined;
    }[] = []; // Initialize an array to store contents

    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } = await s3.send(
        command
      );

      if (!Contents) {
        console.log("No reference files found");
        break;
      }

      await Promise.all(
        Contents.map(async (content) => {
          const getObjectParams = {
            Bucket: "jerome-catalyst",
            Key: content.Key,
          };

          const command = new GetObjectCommand(getObjectParams);
          const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL expires in 1 hour
          referenceFiles.push({
            fileName: await content.Key?.split("/").pop(),
            url: url,
            key: await content.Key,
          });
        })
      );

      isTruncated = IsTruncated !== undefined ? IsTruncated : false;
      command.input.ContinuationToken = NextContinuationToken;
    }

    const headers: HeadersInit = {
      Authorization: process.env.VIDEOSDK_TOKEN || "",
      "Content-Type": "application/json",
    };
    const options: RequestInit = {
      method: "GET",
      headers: headers,
    };
    const url = `https://api.videosdk.live/v2/recordings?roomId=${classroomId}&page=1&perPage=20`;
    const response = await fetch(url, options);
    const data = await response.json();

    return JSON.stringify({
      classroomResponse: classroomResponse[0],
      materials: referenceFiles,
      assignments: assignmentResponse,
      recordings: data,
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while getting classrooms",
    });
  }
}

export async function getAssignments() {
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
    const assignmentResponse = await database
      .select()
      .from(classroom_roles)
      .innerJoin(
        assignments,
        eq(classroom_roles.classroom_id, assignments.classroom_id)
      )
      .leftJoin(
        assignment_submissions,
        eq(assignment_submissions.assignment_id, assignments.id)
      )
      .innerJoin(classrooms, eq(classrooms.id, assignments.classroom_id))
      .where(eq(classroom_roles.user_id, tokenInfo.user_id));

    if (assignmentResponse.length == 0) {
      return await JSON.stringify({
        status: 404,
        message: "No assignments found",
      });
    }

    return await JSON.stringify({
      status: 200,
      data: assignmentResponse,
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while getting assignments",
    });
  }
}

export async function getAssignmentInformation(assignmentId: string) {
  if (!assignmentId) {
    return await JSON.stringify({
      status: 400,
      message: "Assignment ID is required",
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

    const assignmentResponse = await database
      .select()
      .from(assignments)
      .innerJoin(classrooms, eq(classrooms.id, assignments.classroom_id))
      .where(eq(assignments.id, Number(assignmentId)))
      .limit(1);

    if (assignmentResponse.length == 0) {
      return await JSON.stringify({
        status: 404,
        message: "Assignment not found",
      });
    }

    const userResponse = await database
      .select({ role: classroom_roles.role })
      .from(users)
      .innerJoin(classroom_roles, eq(classroom_roles.user_id, users.id))
      .innerJoin(
        assignments,
        eq(assignments.classroom_id, classroom_roles.classroom_id)
      )
      .where(
        and(
          eq(users.id, tokenInfo.user_id),
          eq(assignments.classroom_id, classroom_roles.classroom_id)
        )
      );

    if (userResponse.length == 0) {
      return await JSON.stringify({
        status: 401,
        message: "You are not authorized to view this assignment",
      });
    }

    const command = new ListObjectsV2Command({
      Bucket: "jerome-catalyst",
      Prefix: `assignments/${assignmentId}/`,
      // The default and maximum number of keys returned is 1000. This limits it to
      // one for demonstration purposes.
      MaxKeys: 1000,
    });

    let isTruncated = true;

    let referenceFiles: { fileName: string | undefined; url: string }[] = []; // Initialize an array to store contents

    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } = await s3.send(
        command
      );

      if (!Contents) {
        console.log("No reference files found");
        break;
      }

      await Promise.all(
        Contents.map(async (content) => {
          const getObjectParams = {
            Bucket: "jerome-catalyst",
            Key: content.Key,
          };

          const command = new GetObjectCommand(getObjectParams);
          const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL expires in 1 hour
          referenceFiles.push({
            fileName: await content.Key?.split("/").pop(),
            url: url,
          });
        })
      );

      isTruncated = IsTruncated !== undefined ? IsTruncated : false;
      command.input.ContinuationToken = NextContinuationToken;
    }

    if (userResponse[0].role === "Instructor") {
      const submissions = await database
        .select()
        .from(assignment_submissions)
        .leftJoin(users, eq(users.id, assignment_submissions.user_id))
        .where(eq(assignment_submissions.assignment_id, Number(assignmentId)));

      return await JSON.stringify({
        status: 200,
        role: userResponse[0].role,
        data: assignmentResponse[0],
        referencesFiles: referenceFiles,
        submissions: submissions,
      });
    } else if (userResponse[0].role === "Student") {
      const submissions = await database
        .select()
        .from(assignment_submissions)
        .where(
          and(
            eq(assignment_submissions.assignment_id, Number(assignmentId)),
            eq(assignment_submissions.user_id, tokenInfo.user_id)
          )
        );

      if (submissions.length == 0) {
        return await JSON.stringify({
          status: 200,
          role: userResponse[0].role,
          data: assignmentResponse[0],
          referencesFiles: referenceFiles,
          submissions: submissions,
          submitted: false,
        });
      }

      const command = new ListObjectsV2Command({
        Bucket: "jerome-catalyst",
        Prefix: `assignment-submissions/${submissions[0].id}/`,
        // The default and maximum number of keys returned is 1000. This limits it to
        // one for demonstration purposes.
        MaxKeys: 1000,
      });

      let isTruncated = true;

      let submittedFiles: { fileName: string | undefined; url: string }[] = []; // Initialize an array to store contents

      while (isTruncated) {
        const { Contents, IsTruncated, NextContinuationToken } = await s3.send(
          command
        );

        if (!Contents) {
          console.log("No reference files found");
          break;
        }

        await Promise.all(
          Contents.map(async (content) => {
            const getObjectParams = {
              Bucket: "jerome-catalyst",
              Key: content.Key,
            };

            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL expires in 1 hour
            submittedFiles.push({
              fileName: await content.Key?.split("/").pop(),
              url: url,
            });
          })
        );

        isTruncated = IsTruncated !== undefined ? IsTruncated : false;
        command.input.ContinuationToken = NextContinuationToken;
      }

      return await JSON.stringify({
        status: 200,
        role: userResponse[0].role,
        data: assignmentResponse[0],
        referencesFiles: referenceFiles,
        submissions: submissions,
        submitted: true,
        submittedFiles: submittedFiles,
      });
    }

    return await JSON.stringify({
      status: 200,
      role: userResponse[0].role,
      data: assignmentResponse[0],
      referencesFiles: referenceFiles,
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while getting assignment information",
    });
  }
}

export async function dashboardInfo() {
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
    const assignmentResponse = await database
      .select()
      .from(classroom_roles)
      .innerJoin(
        assignments,
        eq(classroom_roles.classroom_id, assignments.classroom_id)
      )
      .leftJoin(
        assignment_submissions,
        eq(assignment_submissions.assignment_id, assignments.id)
      )
      .innerJoin(classrooms, eq(classrooms.id, assignments.classroom_id))
      .where(eq(classroom_roles.user_id, tokenInfo.user_id))
      .limit(3);

    let assignmentList: { id: number; name: string; deadline: Date | null }[] =
      [];
    for (let assignment of assignmentResponse) {
      assignmentList.push({
        id: assignment.assignments.id,
        name: assignment.assignments.name,
        deadline: assignment.assignments.due_at,
      });
    }

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
      .where(eq(classroom_roles.user_id, tokenInfo.user_id))
      .limit(3); // Filter by student ID

    let instructorResponse: any[] = [];
    let classList: {
      id: string;
      name: string;
      instructor: string | undefined;
    }[] = [];

    if (classroomResponse.length > 0) {
      instructorResponse = await database
        .select({
          classroom_id: classroom_roles.classroom_id,
          instructor: users.name,
        })
        .from(classroom_roles)
        .innerJoin(users, eq(users.id, classroom_roles.user_id))
        .where(
          and(
            inArray(
              classroom_roles.classroom_id,
              classroomResponse.map((c) => c.classroom_id)
            ),
            eq(classroom_roles.role, "Instructor")
          )
        );

      const combinedReponse = classroomResponse.map((c) => {
        const instructor = instructorResponse.find(
          (i) => i.classroom_id === c.classroom_id
        );
        return { ...c, instructor: instructor?.instructor };
      });

      for (let classes of combinedReponse) {
        classList.push({
          id: classes.classroom_id,
          name: classes.classroom_name,
          instructor: classes.instructor,
        });
      }
    }

    const allClassroomsResponse = await database
      .select({
        classroom_id: classrooms.id,
      })
      .from(classrooms)
      .innerJoin(
        classroom_roles,
        eq(classroom_roles.classroom_id, classrooms.id)
      )
      .where(eq(classroom_roles.user_id, tokenInfo.user_id));

    let allInstructorResponse = [];
    if (classroomResponse.length > 0) {
      allInstructorResponse = await database
        .selectDistinct({
          instructor: users.id,
        })
        .from(classroom_roles)
        .innerJoin(users, eq(users.id, classroom_roles.user_id))
        .where(
          and(
            inArray(
              classroom_roles.classroom_id,
              allClassroomsResponse.map((c) => c.classroom_id)
            ),
            eq(classroom_roles.role, "Instructor")
          )
        );
    }

    const allAssignmentResponse = await database
      .select()
      .from(classroom_roles)
      .innerJoin(
        assignments,
        eq(classroom_roles.classroom_id, assignments.classroom_id)
      )
      .leftJoin(
        assignment_submissions,
        eq(assignment_submissions.assignment_id, assignments.id)
      )
      .innerJoin(classrooms, eq(classrooms.id, assignments.classroom_id))
      .where(eq(classroom_roles.user_id, tokenInfo.user_id));

    let todayAssignmentCount = 0;

    for (let assignment of allAssignmentResponse) {
      // If the assignment is due today, increment the count
      if (assignment.assignments.due_at) {
        const dueDate = new Date(assignment.assignments.due_at);
        if (dueDate.toDateString() === new Date().toDateString()) {
          todayAssignmentCount++;
        }
      }
    }

    return await JSON.stringify({
      status: 200,
      totalCourses: allClassroomsResponse.length,
      totalInstructors: allInstructorResponse.length || 0,
      totalAssignments: allAssignmentResponse.length,
      assignmentDueToday: todayAssignmentCount,
      assignments: assignmentList,
      class: classList,
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while getting information",
    });
  }
}

export async function getAssignmentSubmissionInformation(
  assignmentId: string,
  submission_id: number
) {
  if (!assignmentId || !submission_id) {
    return await JSON.stringify({
      status: 400,
      message: "Assignment ID is required",
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

    const assignmentResponse = await database
      .select()
      .from(assignments)
      .innerJoin(classrooms, eq(classrooms.id, assignments.classroom_id))
      .where(eq(assignments.id, Number(assignmentId)))
      .limit(1);

    if (assignmentResponse.length == 0) {
      return await JSON.stringify({
        status: 404,
        message: "Assignment not found",
      });
    }

    const userResponse = await database
      .select({ role: classroom_roles.role })
      .from(users)
      .innerJoin(classroom_roles, eq(classroom_roles.user_id, users.id))
      .innerJoin(
        assignments,
        eq(assignments.classroom_id, classroom_roles.classroom_id)
      )
      .where(
        and(
          eq(users.id, tokenInfo.user_id),
          eq(assignments.classroom_id, classroom_roles.classroom_id)
        )
      );

    if (userResponse.length == 0) {
      return await JSON.stringify({
        status: 401,
        message: "You are not authorized to view this assignment",
      });
    }

    if (userResponse[0].role === "Student") {
      return await JSON.stringify({
        status: 401,
        message: "You are not authorized to view this assignment",
      });
    }

    const submissionResponse = await database
      .select({
        submission_id: assignment_submissions.id,
        user_id: assignment_submissions.user_id,
        submitted_at: assignment_submissions.submitted_at,
        grade: assignment_submissions.grade,
        graded_at: assignment_submissions.graded_at,
        name: users.name,
      })
      .from(assignment_submissions)
      .leftJoin(users, eq(users.id, assignment_submissions.user_id))
      .where(eq(assignment_submissions.id, Number(submission_id)));

    if (submissionResponse.length == 0) {
      return await JSON.stringify({
        status: 404,
        message: "Assignment not found",
      });
    }

    const command = new ListObjectsV2Command({
      Bucket: "jerome-catalyst",
      Prefix: `assignment-submissions/${submission_id}/`,
      // The default and maximum number of keys returned is 1000. This limits it to
      // one for demonstration purposes.
      MaxKeys: 1000,
    });

    let isTruncated = true;

    let referenceFiles: { fileName: string | undefined; url: string }[] = []; // Initialize an array to store contents

    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } = await s3.send(
        command
      );

      if (!Contents) {
        console.log("No reference files found");
        break;
      }

      await Promise.all(
        Contents.map(async (content) => {
          const getObjectParams = {
            Bucket: "jerome-catalyst",
            Key: content.Key,
          };

          const command = new GetObjectCommand(getObjectParams);
          const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL expires in 1 hour
          referenceFiles.push({
            fileName: await content.Key?.split("/").pop(),
            url: url,
          });
        })
      );

      isTruncated = IsTruncated !== undefined ? IsTruncated : false;
      command.input.ContinuationToken = NextContinuationToken;

      return await JSON.stringify({
        status: 200,
        data: submissionResponse[0],
        possible_marks: assignmentResponse[0].assignments.possible_marks,
        referenceFiles: referenceFiles,
      });
    }
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while getting assignment information",
    });
  }
}

export async function gradeAssignment(submissionId: number, grade: number) {
  if (!submissionId || !grade) {
    return JSON.stringify({
      status: 400,
      message: "Assignment Info is required",
    });
  }

  try {
    const token = cookies().get("jwt");
    if (!token?.value) {
      return JSON.stringify({
        status: 401,
        message: "Unauthorized",
      });
    }

    const tokenInfo = (await jwt.verify(
      String(token.value),
      jwtSecret!
    )) as jwtResponse;
    if (!tokenInfo) {
      return JSON.stringify({
        status: 401,
        message: "Unauthorized",
      });
    }

    const database = await initializeDb();

    const submissionResponse = await database
      .select({
        submission_id: assignment_submissions.id,
        assignment_id: assignment_submissions.assignment_id,
        grade: assignment_submissions.grade,
      })
      .from(assignment_submissions)
      .leftJoin(users, eq(users.id, assignment_submissions.user_id))
      .where(eq(assignment_submissions.id, Number(submissionId)));

    const assignmentResponse = await database
      .select()
      .from(assignments)
      .innerJoin(classrooms, eq(classrooms.id, assignments.classroom_id))
      .where(eq(assignments.id, Number(submissionResponse[0].assignment_id)))
      .limit(1);

    if (assignmentResponse.length == 0) {
      return JSON.stringify({
        status: 404,
        message: "Assignment not found",
      });
    }

    if (
      assignmentResponse[0].assignments.possible_marks != null &&
      assignmentResponse[0].assignments.possible_marks < grade &&
      grade < 0
    ) {
      return JSON.stringify({
        status: 400,
        message: "Invalid grade",
      });
    } else if (
      assignmentResponse[0].assignments.possible_marks == null &&
      grade < 0
    ) {
      return JSON.stringify({
        status: 400,
        message: "Invalid grade",
      });
    }

    const userResponse = await database
      .select({ role: classroom_roles.role })
      .from(users)
      .innerJoin(classroom_roles, eq(classroom_roles.user_id, users.id))
      .innerJoin(
        assignments,
        eq(assignments.classroom_id, classroom_roles.classroom_id)
      )
      .where(
        and(
          eq(users.id, tokenInfo.user_id),
          eq(assignments.classroom_id, classroom_roles.classroom_id)
        )
      );

    if (userResponse.length == 0) {
      return await JSON.stringify({
        status: 401,
        message: "You are not authorized to view this assignment",
      });
    }

    if (userResponse[0].role === "Student") {
      return JSON.stringify({
        status: 401,
        message: "You are not authorized to view this assignment",
      });
    }

    const updateStatement = await database
      .update(assignment_submissions)
      .set({ grade: grade, graded_at: new Date() })
      .where(eq(assignment_submissions.id, Number(submissionId)));

    if (!updateStatement) {
      return JSON.stringify({
        status: 500,
        message: "An error occurred while grading assignment",
      });
    }

    return JSON.stringify({
      status: 200,
      message: "Assignment graded successfully",
    });
  } catch (err) {
    console.log(err);
    return JSON.stringify({
      status: 500,
      message: "An error occurred while grading assignment",
    });
  }
}

export async function deleteMaterial(key: string, classroom_id: string) {
  if (!key || !classroom_id) {
    return JSON.stringify({
      status: 400,
      message: "Key and classroom_id are required",
    });
  }

  try {
    const token = cookies().get("jwt");
    if (!token?.value) {
      return JSON.stringify({
        status: 401,
        message: "Unauthorized",
      });
    }

    const tokenInfo = (await jwt.verify(
      String(token.value),
      jwtSecret!
    )) as jwtResponse;
    if (!tokenInfo) {
      return JSON.stringify({
        status: 401,
        message: "Unauthorized",
      });
    }

    const database = await initializeDb();

    const userResponse = await database
      .select({ role: classroom_roles.role })
      .from(users)
      .innerJoin(classroom_roles, eq(classroom_roles.user_id, users.id))
      .where(eq(users.id, tokenInfo.user_id));

    if (userResponse.length == 0) {
      return await JSON.stringify({
        status: 401,
        message: "You are not authorized to delete material",
      });
    }

    if (userResponse[0].role === "Student") {
      return JSON.stringify({
        status: 401,
        message: "You are not authorized to delete material",
      });
    }

    const deleteParams = {
      Bucket: "jerome-catalyst",
      Key: key,
    };

    const deleteCommand = new DeleteObjectCommand(deleteParams);
    await s3.send(deleteCommand);

    return JSON.stringify({
      status: 200,
      message: "Material deleted",
    });
  } catch (err) {
    console.log(err);
    return JSON.stringify({
      status: 500,
      message: "An error occurred while deleting material",
    });
  }
}

export async function joinRoom(classroomId: string) {
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
        classroom_instructor: classrooms.created_by,
        user_role: classroom_roles.role,
        invite_code: classroom_invites.code,
      })
      .from(classrooms)
      .innerJoin(
        classroom_roles,
        eq(classroom_roles.classroom_id, classrooms.id)
      )
      .innerJoin(
        classroom_invites,
        eq(classroom_invites.classroom_id, classrooms.id)
      )
      .where(
        and(
          eq(classroom_roles.user_id, tokenInfo.user_id),
          eq(classrooms.id, classroomId)
        )
      )
      .limit(1); // Filter by student ID

    if (classroomResponse.length == 0) {
      return await JSON.stringify({
        status: 404,
        message: "Classroom not found",
      });
    }

    return await JSON.stringify({
      status: 200,
      user_name: tokenInfo.name,
      instructor: classroomResponse[0].user_role === "Instructor",
      data: classroomResponse[0],
      token: process.env.VIDEOSDK_TOKEN,
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while getting classrooms",
    });
  }
}

export async function deleteRecording(recordingId: string) {
  if (!recordingId) {
    return JSON.stringify({
      status: 400,
      message: "Recording ID is required",
    });
  }

  try {
    const token = cookies().get("jwt");
    if (!token?.value) {
      return JSON.stringify({
        status: 401,
        message: "Unauthorized",
      });
    }

    const tokenInfo = (await jwt.verify(
      String(token.value),
      jwtSecret!
    )) as jwtResponse;
    if (!tokenInfo) {
      return JSON.stringify({
        status: 401,
        message: "Unauthorized",
      });
    }

    const database = await initializeDb();

    const userResponse = await database
      .select({ role: classroom_roles.role })
      .from(users)
      .innerJoin(classroom_roles, eq(classroom_roles.user_id, users.id))
      .where(eq(users.id, tokenInfo.user_id));

    if (userResponse.length == 0) {
      return await JSON.stringify({
        status: 401,
        message: "You are not authorized to delete material",
      });
    }

    if (userResponse[0].role === "Student") {
      return JSON.stringify({
        status: 401,
        message: "You are not authorized to delete material",
      });
    }

    const options = {
      method: "DELETE",
      headers: {
        Authorization: process.env.VIDEOSDK_TOKEN || "",
        "Content-Type": "application/json",
      },
    };
    const url = `https://api.videosdk.live/v2/recordings/${recordingId}`;
    const response = await fetch(url, options);
    console.log(await response.json());

    if (!response.ok) {
      return JSON.stringify({
        status: 500,
        message: "An error occurred while deleting material",
      });
    }

    return JSON.stringify({
      status: 200,
      message: "Recording deleted",
    });
  } catch (err) {
    console.log(err);
    return JSON.stringify({
      status: 500,
      message: "An error occurred while deleting material",
    });
  }
}

export async function getRooms() {
  try {
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
      );

    if (classroomResponse.length == 0) {
      return await JSON.stringify({
        status: 200,
        message: "No classrooms found",
      });
    }

    let instructorResponse: any[] = [];
    if (classroomResponse.length > 0) {
      instructorResponse = await database
        .select({
          classroom_id: classroom_roles.classroom_id,
          instructor: users.name,
        })
        .from(classroom_roles)
        .innerJoin(users, eq(users.id, classroom_roles.user_id))
        .where(
          and(
            inArray(
              classroom_roles.classroom_id,
              classroomResponse.map((c) => c.classroom_id)
            ),
            eq(classroom_roles.role, "Instructor")
          )
        );
    }
    const combinedReponse = classroomResponse.map((c) => {
      const instructor = instructorResponse.find(
        (i) => i.classroom_id === c.classroom_id
      );
      return { ...c, instructor: instructor?.instructor };
    });

    return await JSON.stringify({
      status: 200,
      data: combinedReponse,
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while getting classrooms",
    });
  }
}

export async function dreamJoinRoom(classroomId: string) {
  try {
    const database = await initializeDb();
    const classroomResponse = await database
      .select({
        classroom_id: classrooms.id,
        classroom_name: classrooms.name,
        classroom_description: classrooms.description,
        classroom_instructor: classrooms.created_by,
      })
      .from(classrooms)
      .where(eq(classrooms.id, classroomId))
      .limit(1); // Filter by student ID

    if (classroomResponse.length == 0) {
      return await JSON.stringify({
        status: 404,
        message: "Classroom not found",
      });
    }

    return await JSON.stringify({
      status: 200,
      user_name: "Dream Kit",
      instructor: true,
      data: classroomResponse[0],
      token: process.env.VIDEOSDK_TOKEN,
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurred while getting classrooms",
    });
  }
}

