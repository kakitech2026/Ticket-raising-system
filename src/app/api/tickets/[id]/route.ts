import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson, requireUser } from "@/lib/api";
import { projectWhere, ticketWhere } from "@/lib/policy";
import { checkAssignee, checkProject } from "@/lib/tickets";
import { id } from "@/lib/validation";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser(), ticketId = (await params).id;
    const data = await readJson(req, z.object({ projectId: id.nullable(), version: z.number().int().nonnegative() }).strict());
    await prisma.$transaction(async tx => {
      const ticket = await tx.ticket.findFirst({ where: { AND: [{ id: ticketId }, ticketWhere(actor)] } });
      if (!ticket || (actor.role !== "ADMIN" && actor.id !== ticket.creatorId && actor.id !== ticket.assigneeId)) throw new ApiError(403, "You cannot link this ticket");
      await checkProject(tx, actor, data.projectId);
      await checkAssignee(tx, ticket.assigneeId, data.projectId);
      const creator = await tx.user.findUniqueOrThrow({ where: { id: ticket.creatorId }, select: { id: true, role: true } });
      if (data.projectId && !await tx.project.findFirst({ where: { AND: [{ id: data.projectId }, projectWhere(creator)] } })) throw new ApiError(400, "The ticket creator must belong to this project");
      const changed = await tx.ticket.updateMany({ where: { id: ticketId, version: data.version }, data: { projectId: data.projectId, version: { increment: 1 } } });
      if (!changed.count) throw new ApiError(409, "Ticket changed. Refresh and try again.");
      await tx.timelineEvent.create({ data: { ticketId, userId: actor.id, action: data.projectId ? "Linked ticket to a project" : "Removed project link" } });
    });
    return NextResponse.json({ id: ticketId });
  } catch (error) { return apiError(error); }
}