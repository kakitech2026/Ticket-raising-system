import { NextResponse } from "next/server";
import { apiError, readJson, requireUser } from "@/lib/api";
import { transitionSchema } from "@/lib/validation";
import { transitionTicket } from "@/lib/tickets";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return NextResponse.json(await transitionTicket(await requireUser(), (await params).id, await readJson(req, transitionSchema))); }
  catch (error) { return apiError(error); }
}