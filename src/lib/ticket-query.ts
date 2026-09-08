import type { Prisma } from "@prisma/client";
import { filterSchema } from "./validation";
import { ticketWhere, type Actor, activeStatuses } from "./policy";

export function ticketQuery(actor: Actor, input: Record<string, unknown>) {
  const filter = filterSchema.parse(Object.fromEntries(Object.entries(input).filter(([,v])=>v!=="" && v!==undefined)));
  const clauses: Prisma.TicketWhereInput[] = [ticketWhere(actor, filter.queue === "unassigned")];
  if (!filter.queue && actor.role === "TECH") clauses.push({ OR: [{ creatorId: actor.id }, { assigneeId: actor.id }] });
  if (filter.queue && actor.role === "EMPLOYEE") clauses.push({ id: "__no_access__" });
  if (filter.q) clauses.push({ OR: [{ title: { contains: filter.q, mode: "insensitive" } }, { description: { contains: filter.q, mode: "insensitive" } }] });
  
  if (filter.status) {
    clauses.push({ status: filter.status });
  } else if (filter.view === "completed") {
    clauses.push({ status: { in: ["COMPLETED", "REJECTED"] } });
  } else if (filter.view === "all") {
    // Show all
  } else if (!filter.queue) {
    // Default to active tickets when view is "active" or unspecified
    clauses.push({ status: { in: activeStatuses } });
  }

  if (filter.priority) clauses.push({ priority: filter.priority });
  if (filter.department) clauses.push({ department: filter.department });
  return { where: { AND: clauses } satisfies Prisma.TicketWhereInput, page: filter.page, view: filter.view ?? "active" };
}
