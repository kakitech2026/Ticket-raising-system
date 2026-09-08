import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, readJson, requireUser } from "@/lib/api";
import { claimTicket } from "@/lib/tickets";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser();
    const { version } = await readJson(req, z.object({ version: z.number().int().nonnegative() }).strict());
    return NextResponse.json(await claimTicket(actor, (await params).id, version));
  } catch (error) { return apiError(error); }
}
