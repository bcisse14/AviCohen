import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/cms/auth";
import { apiError, requireSameOrigin } from "@/lib/cms/http";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
