import { Priority } from "@prisma/client";

// SLA deadlines in milliseconds
export const SLA_THRESHOLDS = {
  CRITICAL: 4 * 60 * 60 * 1000, // 4 hours
  HIGH: 24 * 60 * 60 * 1000,    // 24 hours
  MEDIUM: 3 * 24 * 60 * 60 * 1000, // 3 days
  LOW: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export type SLAStatus = "ON_TRACK" | "AT_RISK" | "BREACHED" | "COMPLETED";

export function calculateSLADeadline(createdAt: Date | string, priority: Priority): Date {
  const start = new Date(createdAt).getTime();
  const duration = SLA_THRESHOLDS[priority];
  return new Date(start + duration);
}

export function getSLAStatus(createdAt: Date | string, priority: Priority, isResolved: boolean): SLAStatus {
  if (isResolved) return "COMPLETED";

  const deadline = calculateSLADeadline(createdAt, priority).getTime();
  const now = Date.now();
  
  if (now > deadline) {
    return "BREACHED";
  }

  // AT_RISK if less than 20% of the SLA duration remains
  const duration = SLA_THRESHOLDS[priority];
  const timeRemaining = deadline - now;
  const isAtRisk = timeRemaining < (duration * 0.2);

  return isAtRisk ? "AT_RISK" : "ON_TRACK";
}

export function formatTimeRemaining(deadline: Date | string): string {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = end - now;

  if (diff <= 0) return "Overdue";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes}m remaining`;
}
