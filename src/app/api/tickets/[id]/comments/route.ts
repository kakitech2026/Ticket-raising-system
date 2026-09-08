import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson, requireUser } from "@/lib/api";
import { ticketWhere } from "@/lib/policy";
import { content } from "@/lib/validation";
import { notify } from "@/lib/tickets";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser(), { id } = await params;
    const data = await readJson(req, z.object({ content, isInternal: z.boolean().default(false), requestKey: z.uuid() }).strict());
    if (data.isInternal && actor.role === "EMPLOYEE") throw new ApiError(403, "Internal notes are for staff");
    const comment = await prisma.$transaction(async tx => {
      const ticket = await tx.ticket.findFirst({ where: { AND: [{ id }, ticketWhere(actor)] } });
      if (!ticket) throw new ApiError(404, "Ticket not found");
      const existing = await tx.comment.findUnique({ where: { requestKey: data.requestKey } });
      if (existing) { if (existing.authorId !== actor.id || existing.ticketId !== id) throw new ApiError(409, "Request key already used"); return { id: existing.id }; }
      const created = await tx.comment.create({ data: { ...data, ticketId: id, authorId: actor.id }, select: { id: true } });
      await tx.timelineEvent.create({ data: { ticketId: id, userId: actor.id, action: data.isInternal ? "Staff added an internal note" : "Comment added" } });
      if (!data.isInternal) await notify(tx, [ticket.creatorId, ticket.assigneeId].filter(v => v !== actor.id), id, "New comment: " + ticket.title, "comment:" + created.id);
      return created;
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) { return apiError(error); }
}