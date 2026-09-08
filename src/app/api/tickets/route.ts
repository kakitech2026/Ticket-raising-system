import { NextResponse } from "next/server";
import { apiError, ApiError, readJson, requireUser } from "@/lib/api";
import { createTicketSchema } from "@/lib/validation";
import { createTicket } from "@/lib/tickets";
import { allowAttempt } from "@/lib/rate-limit";
export async function POST(req: Request) {
  try {
    const actor = await requireUser();
    if (!await allowAttempt("ticket:" + actor.id, 30, 3600000)) throw new ApiError(429, "Ticket limit reached. Try again later.");
    return NextResponse.json(await createTicket(actor, await readJson(req, createTicketSchema)), { status: 201 });
  } catch (error) { return apiError(error); }
}