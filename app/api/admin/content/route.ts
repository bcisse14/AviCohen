import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/cms/auth";
import { apiError, readJson, requireSameOrigin } from "@/lib/cms/http";
import { documentSchema } from "@/lib/cms/schema";
import { repository } from "@/lib/cms/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    requireAdmin();
    return NextResponse.json(await repository.getState(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
export async function PUT(request: Request) {
  try {
    requireSameOrigin(request);
    requireAdmin();
    const body = z.object({
      document: documentSchema, revision: z.number().int().positive(), publish: z.boolean(),
    }).parse(await readJson(request));
    return NextResponse.json(await repository.save(body.document, body.revision, body.publish), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) { return apiError(error); }
}
