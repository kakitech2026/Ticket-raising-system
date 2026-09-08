import type { Prisma, Role, TicketStatus } from "@prisma/client";

export type Actor = { id: string; role: Role };
export type TicketAccess = { creatorId: string; assigneeId: string | null; status: TicketStatus };
export const staffSelect = { id: true, name: true, role: true } as const;
export const userSelect = { ...staffSelect, email: true, departmentId: true, isActive: true } as const;
export const activeStatuses: TicketStatus[] = ["NEEDS_APPROVAL", "IN_REVIEW", "ACCEPTED", "IN_PROGRESS", "RE_REVIEW"];
export const statusLabels: Record<TicketStatus, string> = {
  NEEDS_APPROVAL: "Awaiting review", IN_REVIEW: "In review", ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress", COMPLETED: "Completed", REJECTED: "Rejected", RE_REVIEW: "Re-review requested",
  APPROVED: "Accepted", IN_TESTING: "In progress",
};
export function projectWhere(actor: Actor): Prisma.ProjectWhereInput {
  return actor.role === "ADMIN" ? {} : { OR: [{ ownerId: actor.id }, { members: { some: { id: actor.id } } }] };
}
export function ticketWhere(actor: Actor, queue = false): Prisma.TicketWhereInput {
  if (actor.role === "ADMIN") return queue ? { assigneeId: null, status: { in: activeStatuses } } : {};
  const visibility: Prisma.TicketWhereInput = actor.role === "EMPLOYEE" ? { creatorId: actor.id }
    : queue ? { assigneeId: null, status: { in: activeStatuses } }
    : { OR: [{ creatorId: actor.id }, { assigneeId: actor.id }, { assigneeId: null, status: { in: activeStatuses } }] };
  return { AND: [visibility, { OR: [{ projectId: null }, { project: projectWhere(actor) }] }] };
}
export function articleWhere(actor: Actor): Prisma.ArticleWhereInput {
  return actor.role === "ADMIN" ? {} : { assigneeId: actor.id };
}
export function canTransition(actor: Actor, ticket: TicketAccess, target: TicketStatus): boolean {
  if (target === "RE_REVIEW") return (actor.id === ticket.creatorId || actor.role === "ADMIN") && ["REJECTED", "COMPLETED", "IN_PROGRESS"].includes(ticket.status);
  if (actor.role === "EMPLOYEE" || (actor.id !== ticket.assigneeId && actor.role !== "ADMIN") || !ticket.assigneeId) return false;
  const transitions: Partial<Record<TicketStatus, TicketStatus[]>> = {
    NEEDS_APPROVAL: ["IN_REVIEW"], IN_REVIEW: ["ACCEPTED", "REJECTED"], RE_REVIEW: ["ACCEPTED", "REJECTED"],
    ACCEPTED: ["IN_PROGRESS"], IN_PROGRESS: ["COMPLETED"],
  };
  // Only the assigned staff member records completion.
  if (target === "COMPLETED" && actor.id !== ticket.assigneeId) return false;
  return transitions[ticket.status]?.includes(target) ?? false;
}

