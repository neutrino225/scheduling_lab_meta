import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieMaxAge,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

interface FacebookLoginRequest {
  accessToken?: string;
}

interface FacebookMeResponse {
  id: string;
  name?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FacebookLoginRequest;
    const accessToken = body.accessToken?.trim();

    if (!accessToken) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "accessToken is required" },
        { status: 400 }
      );
    }

    const meRes = await fetch(
      `https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`,
      { cache: "no-store" }
    );

    if (!meRes.ok) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Invalid Facebook access token" },
        { status: 401 }
      );
    }

    const me = (await meRes.json()) as FacebookMeResponse;
    const username = me.name?.trim() || `fb_${me.id}`;

    const token = await createSessionToken(username);
    const response = NextResponse.json({
      success: true,
      user: { username, facebookId: me.id },
    });

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
