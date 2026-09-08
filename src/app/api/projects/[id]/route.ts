import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson, requireUser } from "@/lib/api";
import { projectWhere, staffSelect, ticketWhere } from "@/lib/policy";
import { projectSchema } from "@/lib/validation";
type Context = { params: Promise<{ id: string }> };
export async function GET(_req: Request, { params }: Context) {
  try {
    const actor = await requireUser(), { id } = await params;
    const project = await prisma.project.findFirst({ where: { AND: [{ id }, projectWhere(actor)] }, include: { owner: { select: staffSelect }, members: { select: staffSelect }, tickets: { where: ticketWhere(actor), take: 50, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true } } } });
    if (!project) throw new ApiError(404, "Project not found");
    return NextResponse.json(project);
  } catch (error) { return apiError(error); }
}
export async function PATCH(req: Request, { params }: Context) {
  try {
    const actor = await requireUser(), { id } = await params;
    const data = await readJson(req, projectSchema.partial().extend({ version: z.number().int().nonnegative() }).strict());
    await prisma.$transaction(async tx => {
      const project = await tx.project.findFirst({ where: { AND: [{ id }, projectWhere(actor)] } });
      if (!project) throw new ApiError(404, "Project not found");
      const owner = actor.role === "ADMIN" || actor.id === project.ownerId;
      if (!owner && (data.members !== undefined || data.name !== undefined)) throw new ApiError(403, "Only the owner or admin can change the name or members");
      const start = data.startDate === undefined ? project.startDate : data.startDate;
      const end = data.endDate === undefined ? project.endDate : data.endDate;
      if (start && end && start > end) throw new ApiError(400, "End date must follow start date");
      const { members, version, ...fields } = data;
      if (members) {
        const ids = [...new Set([...members, project.ownerId])];
        if (await tx.user.count({ where: { id: { in: ids }, isActive: true } }) !== ids.length) throw new ApiError(400, "Select active members");
        // Preserve access for the creators and assignees of already-linked tickets.
        const participants = await tx.ticket.findMany({ where: { projectId: id }, select: { creatorId: true, assigneeId: true } });
        const required = [...new Set(participants.flatMap(t => [t.creatorId, t.assigneeId]).filter((v): v is string => !!v))];
        const missing = await tx.user.count({ where: { id: { in: required, notIn: ids }, role: { not: "ADMIN" }, isActive: true } });
        if (missing) throw new ApiError(400, "Unlink affected tickets before removing their creator or assignee from the project");
        await tx.project.update({ where: { id }, data: { members: { set: ids.map(id => ({ id })) } } });
      }
      const changed = await tx.project.updateMany({ where: { id, version }, data: { ...fields, version: { increment: 1 } } });
      if (!changed.count) throw new ApiError(409, "Project changed. Refresh before saving.");
    });
    return NextResponse.json({ id });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_req: Request, { params }: Context) {
  try {
    const actor = await requireUser(), { id } = await params;
    const project = await prisma.project.findFirst({ where: { id, ...(actor.role === "ADMIN" ? {} : { ownerId: actor.id }) } });
    if (!project) throw new ApiError(403, "Only the owner or admin may delete a project");
    if (await prisma.ticket.count({ where: { projectId: id } })) throw new ApiError(409, "Unlink tickets before deleting this project");
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error); }
}