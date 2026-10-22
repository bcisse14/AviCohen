import { NextResponse } from "next/server";
import { z } from "zod";
import { checkCredentials, sessionCookie, sessionSeconds, signSession } from "@/lib/cms/auth";
import { apiError, readJson, requireSameOrigin } from "@/lib/cms/http";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = z.object({ email: z.string().max(254), password: z.string().min(1).max(256) }).parse(await readJson(request, 4096));
    await checkCredentials(body.email, body.password);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie, signSession(), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
      path: "/", maxAge: sessionSeconds,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
