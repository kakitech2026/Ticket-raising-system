import type { Priority } from "@prisma/client";
export const SLA_THRESHOLDS: Record<Priority, number> = { CRITICAL: 4 * 3600000, HIGH: 24 * 3600000, MEDIUM: 72 * 3600000, LOW: 168 * 3600000 };
export type SLAStatus = "ON_TRACK" | "AT_RISK" | "BREACHED" | "COMPLETED" | "STOPPED";
export function calculateSLADeadline(start: Date | string, priority: Priority): Date { return new Date(new Date(start).getTime() + SLA_THRESHOLDS[priority]); }
export function getSLAStatus(start: Date | string, priority: Priority, isResolved: boolean, dueAt?: Date | string | null, isRejected = false, now = Date.now()): SLAStatus {
  if (isResolved) return "COMPLETED";
  if (isRejected) return "STOPPED";
  const deadline = new Date(dueAt ?? calculateSLADeadline(start, priority)).getTime();
  if (now > deadline) return "BREACHED";
  return deadline - now <= SLA_THRESHOLDS[priority] * .2 ? "AT_RISK" : "ON_TRACK";
}
export function cycleBreached(cycle: { dueAt: Date | string; endedAt: Date | string | null }, now = Date.now()) {
  return (cycle.endedAt ? new Date(cycle.endedAt).getTime() : now) > new Date(cycle.dueAt).getTime();
}
export function formatTimeRemaining(deadline: Date | string, now = Date.now()): string {
  const diff = new Date(deadline).getTime() - now;
  if (diff <= 0) return "Overdue";
  const minutes = Math.ceil(diff / 60000), hours = Math.floor(minutes / 60);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
  return hours ? `${hours}h ${minutes % 60}m remaining` : `${minutes}m remaining`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(d.getDate()).padStart(2, "0");
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}
