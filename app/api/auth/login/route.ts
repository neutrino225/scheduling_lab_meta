import { NextRequest, NextResponse } from "next/server";
import { validateCredentials } from "@/lib/auth/credentials";
import {
  createSessionToken,
  getSessionCookieMaxAge,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

interface LoginRequest {
  username?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginRequest;
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "username and password are required" },
        { status: 400 }
      );
    }

    if (!validateCredentials(username, password)) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(username);
    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionCookieMaxAge(),
    });

    return response;
  } catch {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
