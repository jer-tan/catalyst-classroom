"use server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import { getDBConnection } from "@/app/lib/db";
import crypto from "crypto";
import { generateFromEmail } from "unique-username-generator";
import { initializeDb } from "./database";
import { reset_password, users } from "../../../db/schema";
import { eq } from "drizzle-orm";
const emailRegex =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
const jwtSecret = process.env.JWT_SECRET;
const requiredScope = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

interface GoogleAuthTokenResponse {
  error?: string;
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
}

interface ErrorMessageComponent {
  message: string;
}

export interface ErrorMessage extends Array<ErrorMessageComponent> {}

export async function passwordAuth(email: string, password: string) {
  var email = email.trim();
  if (!emailRegex.test(email)) {
    let msg = {
      status: 400,
      message: "Invalid email address",
    };
    return await JSON.stringify(msg);
  }

  try {
    const database = await initializeDb();
    const response = await database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let user = response[0];

    if (!user) {
      let msg = {
        status: 404,
        message: "No account was found on the email address",
      };
      return await JSON.stringify(msg);
    }

    const match = await bcrypt.compare(password, user.password_hash!);
    if (match) {
      var token = jwt.sign(
        {
          user_id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
        jwtSecret!,
        { expiresIn: "24h" }
      );
      let msg = {
        status: 200,
        token: token,
      };
      return await JSON.stringify(msg);
    } else {
      let msg = {
        status: 400,
        message: "Incorrect Password",
      };
      return await JSON.stringify(msg);
    }
  } catch (error) {
    console.log(error);
    let msg = {
      status: 500,
      message:
        "An error occurs while authenticating user, please try again later.",
    };
    return await JSON.stringify(msg);
  }
}

export async function createAccount(
  name: string,
  email: string,
  password: string
) {
  var email = email.trim();
  if (!emailRegex.test(email)) {
    return await JSON.stringify({
      status: 400,
      message: "Invalid email address",
    });
  }

  try {
    const hash = await bcrypt.hashSync(password, 12);
    const username = await generateFromEmail(email, 3);
    
    const database = await initializeDb();
    const res = await database.insert(users).values({
      name: name,
      username: username,
      email: email,
      password_hash: hash,
    });

    if (res) {
      return await JSON.stringify({ status: 200, message: "register" });
    }
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      status: 500,
      message: "An error occurs, please try again later.",
    });
  }
}

export async function resetPassword(email: string) {
  var email = email.trim();
  if (!emailRegex.test(email)) {
    return await JSON.stringify({
      message: "Invalid email address",
      status: 400,
    });
  }

  try {
    const db = await initializeDb();
    const userResponse = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    const user = userResponse[0];

    if (!user) {
      return await JSON.stringify({
        message: "No account was found on the email address",
        status: 400,
      });
    }

    const codeLength = Math.floor(Math.random() * (100 - 50)) + 50;
    const code = crypto.randomBytes(codeLength).toString("hex");

    const insertResponse = await db.insert(reset_password).values({
      user_id: user.id,
      code: code,
      expiration_time: new Date(Date.now() + 86400000), // 1 day expiration time
    });

    if (!insertResponse) {
      return await JSON.stringify({
        error: "An error occurs while generating code, please try again later",
        status: 500,
      });
    }

    // Send email to user with reset password link
    const emailSend = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": `${process.env.BREVO_API_KEY}`,
        accept: "application/json",
      },
      body: JSON.stringify({
        to: [
          {
            email,
            name: user.name,
          },
        ],
        templateId: 1,
        params: {
          name: user.name,
          resetlink: "http://localhost:3000/auth/password?code=" + code,
        },
      }),
    });

    if (emailSend.status !== 201) {
      return await JSON.stringify({
        message: "Failed to send reset password email",
        status: 500,
      });
    }

    return await JSON.stringify({
      status: 200,
      message: "You should receive an email shortly with instruction",
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      message: "Failed to reset password",
      status: 500,
    });
  }
}

export async function passwordResetCodeCheck(code: string) {
  try {
    const db = await initializeDb();
    const codeResponse = await db
      .select()
      .from(reset_password)
      .innerJoin(users, eq(reset_password.user_id, users.id))
      .where(eq(reset_password.code, code));

    const codeInfo = codeResponse[0];

    if (!codeInfo) {
      return await JSON.stringify({
        message: "Invalid code!",
        status: 400,
      });
    }

    if (new Date(codeInfo.reset_password.expiration_time) < new Date()) {
      return await JSON.stringify({
        message: "Code has expired!",
        status: 400,
      });
    }
    return await JSON.stringify({
      status: 200,
      username: codeInfo.users.name,
    });
  } catch (error) {
    return await JSON.stringify({
      message: "Failed to check token, please try again later",
      status: 500,
    });
  }
}

export async function passwordResetSubmit(code: string, password: string) {
  try {
    const db = await initializeDb();
    const codeResponse = await db
      .select()
      .from(reset_password)
      .innerJoin(users, eq(reset_password.user_id, users.id))
      .where(eq(reset_password.code, code));

    const codeInfo = codeResponse[0];

    if (!codeInfo) {
      return await JSON.stringify({
        message: "Invalid code!",
        status: 400,
      });
    }

    if (new Date(codeInfo.reset_password.expiration_time) < new Date()) {
      return await JSON.stringify({
        message: "Code has expired!",
        status: 400,
      });
    }

    const hash = await bcrypt.hashSync(password, 12);
    const updateResponse = await db
      .update(users)
      .set({ password_hash: hash })
      .where(eq(users.id, codeInfo.users.id));

    if (!updateResponse) {
      return await JSON.stringify({
        message: "Failed to reset password",
        status: 500,
      });
    }

    const deleteResponse = await db
      .delete(reset_password)
      .where(eq(reset_password.code, code));
    if (!deleteResponse) {
      return await JSON.stringify({
        message: "Failed to reset password",
        status: 500,
      });
    }

    return await JSON.stringify({
      status: 200,
      message: "Password reset successfully. You will be redirected shortly",
    });
  } catch (error) {
    console.log(error);
    return await JSON.stringify({
      message: "Failed to check token, please try again later",
      status: 500,
    });
  }
}

export async function googleAuth(code: string) {
  const GoogleClientId = process.env.GOOGLE_CLIENT_ID;
  const GoogleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const GoogleRedirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!GoogleClientId || !GoogleClientSecret || !GoogleRedirectUri) {
    let msg = {
      status: 500,
      message: "Server misconfigured, please try again later.",
    };
    return await JSON.stringify(msg);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: GoogleClientId,
      client_secret: GoogleClientSecret,
      redirect_uri: GoogleRedirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data: GoogleAuthTokenResponse = await tokenResponse.json();

  if (data.error) {
    return await JSON.stringify({ message: data.error, status: 400 });
  }

  if (!requiredScope.every((item) => data.scope.includes(item))) {
    return await JSON.stringify({ message: "Invalid scope", status: 400 });
  }

  const accessToken = data.access_token;

  const profileResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const profile = await profileResponse.json();

  try {
    const db = await initializeDb();
    const userResponse = await db
      .select()
      .from(users)
      .where(eq(users.email, profile.email))
      .limit(1);
    const user = userResponse[0];
    if (user) {
      // User already exists
      if (!user.google_id) {
        const updateResponse = await db.update(users).set({
          google_id: profile.id,
        });
        if (!updateResponse) {
          return await JSON.stringify({
            message: "Failed to update user",
            status: 500,
          });
        }
      }

      try {
        var token = jwt.sign(
          {
            user_id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
          },
          jwtSecret!,
          { expiresIn: "24h" }
        );
        let msg = {
          status: 200,
          token: token,
        };
        return await JSON.stringify(msg);
      } catch (err) {
        return await JSON.stringify({
          message: "Failed to create token",
          status: 500,
        });
      }
    }
    var username = await generateFromEmail(profile.email, 3);
    const insertResponse = await db.insert(users).values({
      name: profile.name,
      username,
      email: profile.email,
      login_method: "Google",
      google_id: profile.id,
    });

    if (!insertResponse) {
      return await JSON.stringify({
        error: "Login failed, please try again later",
        status: 500,
      });
    }

    try {
      const secUserResponse = await db
        .select()
        .from(users)
        .where(eq(users.email, profile.email))
        .limit(1);
      const secUser = secUserResponse[0];
      if (!secUser) {
        return await JSON.stringify({
          error: "An error occured, please try again later",
          status: 500,
        });
      }
      var token = jwt.sign(
        {
          user_id: secUser.id,
          name: secUser.name,
          email: secUser.email,
          created_at: secUser.created_at,
        },
        jwtSecret!,
        { expiresIn: "24h" }
      );
    } catch (err) {
      return await JSON.stringify({
        error: "Failed to create token",
        status: 500,
      });
    }
  } catch (e) {
    return await JSON.stringify({
      error: "Login failed, please try again later",
      status: 500,
    });
  }
}
