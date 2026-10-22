import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/cms/auth";
import { apiError, readJson, requireSameOrigin } from "@/lib/cms/http";
import { repository } from "@/lib/cms/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    requireAdmin();
    return NextResponse.json(await repository.versions(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    requireAdmin();
    const body = z.object({ id: z.string().regex(/^\d{1,19}$/), revision: z.number().int().positive() }).parse(await readJson(request, 4096));
    return NextResponse.json(await repository.restore(body.id, body.revision));
  } catch (error) { return apiError(error); }
}
