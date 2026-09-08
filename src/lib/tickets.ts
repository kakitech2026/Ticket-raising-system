import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "./prisma";
import { ApiError } from "./api";
import { activeStatuses, canTransition, projectWhere, ticketWhere, type Actor } from "./policy";
import { calculateSLADeadline } from "./sla";
import { validateImages } from "./attachments";
import type { createTicketSchema, transitionSchema } from "./validation";

export async function checkProject(tx: Prisma.TransactionClient, actor: Actor, projectId?: string | null) {
  if (projectId && !await tx.project.findFirst({ where: { AND: [{ id: projectId }, projectWhere(actor)] }, select: { id: true } })) throw new ApiError(403, "You cannot access this project");
}
export async function checkAssignee(tx: Prisma.TransactionClient, assigneeId?: string | null, projectId?: string | null) {
  if (!assigneeId) return;
  const staff = await tx.user.findFirst({ where: { id: assigneeId, isActive: true, role: { in: ["TECH", "ADMIN"] } }, select: { id: true, role: true } });
  if (!staff) throw new ApiError(400, "Select an active staff member");
  await checkProject(tx, staff, projectId);
}
export async function notify(tx: Prisma.TransactionClient, userIds: (string | null)[], ticketId: string, message: string, key: string) {
  await tx.notification.createMany({ data: [...new Set(userIds.filter((id): id is string => !!id))].map(userId => ({ userId, ticketId, message, dedupeKey: `${key}:${userId}` })), skipDuplicates: true });
}
export async function createTicket(actor: Actor, data: z.infer<typeof createTicketSchema>) {
  validateImages(data.images);
  return prisma.$transaction(async tx => {
    const existing = await tx.ticket.findUnique({ where: { requestKey: data.requestKey }, select: { id: true, creatorId: true } });
    if (existing) { if (existing.creatorId !== actor.id) throw new ApiError(409, "Request key already used"); return { id: existing.id }; }
    await checkProject(tx, actor, data.projectId);
    await checkAssignee(tx, data.assigneeId, data.projectId);
    const now = new Date(), slaDueAt = calculateSLADeadline(now, data.priority);
    const ticket = await tx.ticket.create({ data: {
      title: data.title, description: data.description, priority: data.priority, department: data.department,
      creatorId: actor.id, assigneeId: data.assigneeId, projectId: data.projectId, requestKey: data.requestKey,
      slaStartedAt: now, slaDueAt,
      images: { create: data.images.map(url => ({ url })) },
      timeline: { create: { action: "Ticket submitted for technician review", userId: actor.id } },
      slaCycles: { create: { startedAt: now, dueAt: slaDueAt, assigneeId: data.assigneeId } },
    }, select: { id: true, title: true } });
    await notify(tx, [data.assigneeId ?? null], ticket.id, `Ticket awaiting your review: ${ticket.title}`, `created:${ticket.id}`);
    return { id: ticket.id };
  });
}
export async function transitionTicket(actor: Actor, id: string, data: z.infer<typeof transitionSchema>) {
  validateImages(data.images);
  return prisma.$transaction(async tx => {
    const ticket = await tx.ticket.findFirst({ where: { AND: [{ id }, ticketWhere(actor)] } });
    if (!ticket) throw new ApiError(404, "Ticket not found");
    if (!canTransition(actor, ticket, data.status)) throw new ApiError(403, "This transition is not allowed");
    if (["REJECTED", "RE_REVIEW"].includes(data.status) && !data.reason) throw new ApiError(400, "A reason is required");
    if (data.status === "ACCEPTED" && (!data.dueDate || data.dueDate <= new Date())) throw new ApiError(400, "Choose a future estimated completion time");
    if (data.status === "COMPLETED" && !data.resolutionSummary) throw new ApiError(400, "Describe how the issue was resolved");
    const now = new Date();
    const reopening = data.status === "RE_REVIEW" && ["REJECTED", "COMPLETED"].includes(ticket.status);
    const slaDueAt = reopening ? calculateSLADeadline(now, ticket.priority) : ticket.slaDueAt;
    const result = await tx.ticket.updateMany({ where: { id, version: data.version, status: ticket.status }, data: {
      status: data.status, version: { increment: 1 },
      ...(data.status === "ACCEPTED" ? { dueDate: data.dueDate } : {}),
      ...(data.status === "COMPLETED" ? { completedAt: now, resolutionSummary: data.resolutionSummary } : {}),
      ...(reopening ? { slaStartedAt: now, slaDueAt, completedAt: null, dueDate: null, resolutionSummary: null } : {}),
    } });
    if (!result.count) throw new ApiError(409, "This ticket changed. Refresh before trying again.");
    if (["REJECTED", "COMPLETED"].includes(data.status)) await tx.ticketSlaCycle.updateMany({ where: { ticketId: id, endedAt: null }, data: { endedAt: now, outcome: data.status, assigneeId: ticket.assigneeId } });
    if (reopening) await tx.ticketSlaCycle.create({ data: { ticketId: id, startedAt: now, dueAt: slaDueAt, assigneeId: ticket.assigneeId } });
    await tx.timelineEvent.create({ data: { ticketId: id, userId: actor.id, action: `Status: ${ticket.status} → ${data.status}${data.reason ? `. Reason: ${data.reason}` : ""}${data.resolutionSummary ? `. Resolution: ${data.resolutionSummary}` : ""}${reopening ? ". A new SLA cycle has started; previous history is retained." : ""}`, images: { create: data.images.map(url => ({ url, ticketId: id })) } } });
    await notify(tx, [ticket.creatorId, ticket.assigneeId].filter(userId => userId !== actor.id), id, `${ticket.title}: ${data.status.replaceAll("_", " ")}`, `status:${id}:${data.version + 1}`);
    return { id, version: data.version + 1 };
  });
}

export async function claimTicket(actor: Actor, id: string, version: number) {
  if (actor.role === "EMPLOYEE") throw new ApiError(403, "Only staff can claim tickets");
  return prisma.$transaction(async tx => {
    const result = await tx.ticket.updateMany({ where: { AND: [ticketWhere(actor), { id, assigneeId: null, version, status: { in: activeStatuses } }] }, data: { assigneeId: actor.id, version: { increment: 1 } } });
    if (!result.count) throw new ApiError(409, "Ticket unavailable or already claimed. Refresh the queue.");
    await tx.ticketSlaCycle.updateMany({ where: { ticketId: id, endedAt: null }, data: { assigneeId: actor.id } });
    await tx.timelineEvent.create({ data: { ticketId: id, userId: actor.id, action: "Ticket claimed by a technician" } });
    return { id };
  });
}
