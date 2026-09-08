import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activeStatuses, statusLabels, ticketWhere, projectWhere } from "@/lib/policy";
import { getSLAStatus, formatTimeRemaining, formatDate } from "@/lib/sla";
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  FolderKanban,
  PlusCircle,
  Sparkles,
  MessageSquare,
} from "lucide-react";

export const metadata = { title: "Dashboard | Tickety" };

const priorityWeight: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function sortTicketsByPriorityAndLatest<T extends { priority: string; createdAt: Date | string }>(tickets: T[]): T[] {
  return [...tickets].sort((a, b) => {
    const weightDiff = (priorityWeight[b.priority] ?? 0) - (priorityWeight[a.priority] ?? 0);
    if (weightDiff !== 0) return weightDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = session.user;
  const isTech = user.role === "TECH";
  const isAdmin = user.role === "ADMIN";
  const isEmployee = user.role === "EMPLOYEE";

  const baseWhere = ticketWhere(user);

  if (isTech) {
    // Technician dashboard: prioritize assigned action items and unassigned pool
    const [
      awaitingMyReviewCount,
      myInProgressCount,
      unassignedPoolCount,
      myResolvedCount,
      rawAssignedActionTickets,
      myActiveTickets,
      rawUnassignedTickets,
    ] = await Promise.all([
      prisma.ticket.count({
        where: {
          AND: [
            baseWhere,
            { assigneeId: user.id, status: { in: ["NEEDS_APPROVAL", "IN_REVIEW", "RE_REVIEW"] } },
          ],
        },
      }),
      prisma.ticket.count({
        where: {
          AND: [
            baseWhere,
            { assigneeId: user.id, status: { in: ["ACCEPTED", "IN_PROGRESS"] } },
          ],
        },
      }),
      prisma.ticket.count({
        where: {
          AND: [
            baseWhere,
            { assigneeId: null, status: { in: activeStatuses } },
          ],
        },
      }),
      prisma.ticket.count({
        where: {
          AND: [
            baseWhere,
            { assigneeId: user.id, status: "COMPLETED" },
          ],
        },
      }),
      // Assigned tickets requiring technician action
      prisma.ticket.findMany({
        where: {
          AND: [
            baseWhere,
            { assigneeId: user.id, status: { in: ["NEEDS_APPROVAL", "IN_REVIEW", "RE_REVIEW"] } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          department: true,
          createdAt: true,
          slaStartedAt: true,
          slaDueAt: true,
          creator: { select: { name: true, email: true } },
          _count: { select: { comments: true } },
          notifications: {
            where: { userId: user.id, isRead: false },
            select: { id: true },
          },
        },
      }),
      // Other active tickets assigned to me
      prisma.ticket.findMany({
        where: {
          AND: [
            baseWhere,
            { assigneeId: user.id, status: { in: ["ACCEPTED", "IN_PROGRESS"] } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          department: true,
          dueDate: true,
          createdAt: true,
          slaStartedAt: true,
          slaDueAt: true,
          creator: { select: { name: true } },
          _count: { select: { comments: true } },
          notifications: {
            where: { userId: user.id, isRead: false },
            select: { id: true },
          },
        },
      }),
      // Unassigned tickets waiting in queue
      prisma.ticket.findMany({
        where: {
          AND: [
            baseWhere,
            { assigneeId: null, status: { in: activeStatuses } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          department: true,
          createdAt: true,
          slaDueAt: true,
          _count: { select: { comments: true } },
          notifications: {
            where: { userId: user.id, isRead: false },
            select: { id: true },
          },
        },
      }),
    ]);

    // Sort by Highest Priority first (CRITICAL -> HIGH -> MEDIUM -> LOW), then latest
    const assignedActionTickets = sortTicketsByPriorityAndLatest(rawAssignedActionTickets);
    const unassignedTickets = sortTicketsByPriorityAndLatest(rawUnassignedTickets);

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Technician Workspace
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Welcome back, <span className="text-neutral-200 font-medium">{user.name}</span>. Sorted by highest priority and latest requests.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/tickets?queue=unassigned" className="btn bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700">
              <Inbox className="w-4 h-4 mr-2" /> Unassigned Queue ({unassignedPoolCount})
            </Link>
            <Link href="/tickets/new" className="btn bg-indigo-600 hover:bg-indigo-500">
              <PlusCircle className="w-4 h-4 mr-2" /> New Ticket
            </Link>
          </div>
        </div>

        {/* Action KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/tickets"
            className={`panel transition hover:border-amber-500/50 relative overflow-hidden ${
              awaitingMyReviewCount > 0 ? "border-amber-500/40 bg-gradient-to-br from-amber-950/20 to-neutral-900" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-400">Needs Your Review</span>
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{awaitingMyReviewCount}</span>
              {awaitingMyReviewCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  Action Required
                </span>
              )}
            </div>
          </Link>

          <Link href="/tickets" className="panel transition hover:border-indigo-500/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-400">In Progress (Active)</span>
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Clock className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-white">{myInProgressCount}</span>
            </div>
          </Link>

          <Link href="/tickets?queue=unassigned" className="panel transition hover:border-neutral-600">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-400">Unassigned Pool</span>
              <span className="p-2 rounded-lg bg-neutral-800 text-neutral-400">
                <Inbox className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-white">{unassignedPoolCount}</span>
            </div>
          </Link>

          <div className="panel">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-400">Resolved by You</span>
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-white">{myResolvedCount}</span>
            </div>
          </div>
        </div>

        {/* Assigned to You — Awaiting Review Section (Prominently Highlighted) */}
        <section className="panel space-y-4 border-amber-900/30">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Assigned to You — Needs Attention</h2>
                {assignedActionTickets.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    {assignedActionTickets.length} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Tickets assigned to you sorted by highest priority, then most recent.
              </p>
            </div>
            <Link href="/tickets" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center">
              View all tickets <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {assignedActionTickets.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 space-y-2">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
              <p className="font-medium text-neutral-300">You are all caught up!</p>
              <p className="text-xs">No pending tickets currently waiting for your review.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/80">
              {assignedActionTickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/tickets/${t.id}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-2 rounded-lg transition hover:bg-neutral-800/50"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-neutral-100 group-hover:text-indigo-400 transition break-words">
                        {t.title}
                      </span>
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                      {t.notifications.length > 0 && (
                        <span
                          title={`${t.notifications.length} new unread update${t.notifications.length > 1 ? "s" : ""}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <span>Unread</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                      <span>By <strong className="text-neutral-300">{t.creator.name}</strong> ({t.department})</span>
                      <span suppressHydrationWarning>Created {formatDate(t.createdAt)}</span>
                      {t._count.comments > 0 && (
                        <>
                          <span className="text-neutral-500">•</span>
                          <span>{t._count.comments} {t._count.comments === 1 ? "comment" : "comments"}</span>
                        </>
                      )}
                      <span className="text-neutral-500">•</span>
                      <span className="text-amber-400 font-medium">SLA: {formatTimeRemaining(t.slaDueAt)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <span className="btn bg-indigo-600/90 group-hover:bg-indigo-600 text-xs py-1.5 px-3">
                      Review Ticket
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* In Progress & Unassigned Queue Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Work in Progress */}
          <section className="panel space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h2 className="text-base font-semibold text-white">Your In-Progress Work</h2>
              <Link href="/tickets" className="text-xs text-indigo-400 hover:underline">
                View all
              </Link>
            </div>
            {myActiveTickets.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4">No active in-progress tickets.</p>
            ) : (
              <div className="divide-y divide-neutral-800/60">
                {myActiveTickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="block py-2.5 px-2 rounded transition hover:bg-neutral-800/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <p className="text-sm font-medium text-neutral-200 truncate">{t.title}</p>
                        {t.notifications.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded-full border border-rose-500/30 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Unread
                          </span>
                        )}
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      {t.department} • Est: {t.dueDate ? formatDate(t.dueDate) : "No estimate set"}
                      {t._count.comments > 0 && ` • ${t._count.comments} ${t._count.comments === 1 ? "comment" : "comments"}`}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Unassigned Queue */}
          <section className="panel space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h2 className="text-base font-semibold text-white">Unassigned Pool</h2>
              <Link href="/tickets?queue=unassigned" className="text-xs text-indigo-400 hover:underline">
                Claim tickets ({unassignedPoolCount})
              </Link>
            </div>
            {unassignedTickets.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4">No unassigned tickets in the pool.</p>
            ) : (
              <div className="divide-y divide-neutral-800/60">
                {unassignedTickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="block py-2.5 px-2 rounded transition hover:bg-neutral-800/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <p className="text-sm font-medium text-neutral-200 truncate">{t.title}</p>
                        {t.notifications.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded-full border border-rose-500/30 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Unread
                          </span>
                        )}
                      </div>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      {t.department} • SLA Due: {formatTimeRemaining(t.slaDueAt)}
                      {t._count.comments > 0 && ` • ${t._count.comments} ${t._count.comments === 1 ? "comment" : "comments"}`}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // Employee or Admin Dashboard
  const [total, inProgress, awaitingReview, rawRecentTickets] = await Promise.all([
    prisma.ticket.count({ where: baseWhere }),
    prisma.ticket.count({
      where: { AND: [baseWhere, { status: { in: ["IN_PROGRESS", "ACCEPTED"] } }] },
    }),
    prisma.ticket.count({
      where: { AND: [baseWhere, { status: { in: ["NEEDS_APPROVAL", "IN_REVIEW", "RE_REVIEW"] } }] },
    }),
    prisma.ticket.findMany({
      where: { AND: [baseWhere, { status: { in: activeStatuses } }] },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        department: true,
        createdAt: true,
        slaStartedAt: true,
        slaDueAt: true,
        assignee: { select: { name: true } },
        _count: { select: { comments: true } },
        notifications: {
          where: { userId: user.id, isRead: false },
          select: { id: true },
        },
      },
    }),
  ]);

  const recentTickets = sortTicketsByPriorityAndLatest(rawRecentTickets).slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {isAdmin ? "Admin Overview" : "Your Support Dashboard"}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Welcome back, <span className="text-neutral-200 font-medium">{user.name}</span>. Track and manage your requests.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/tickets/new" className="btn bg-indigo-600 hover:bg-indigo-500">
            <PlusCircle className="w-4 h-4 mr-2" /> Create Ticket
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/tickets" className="panel transition hover:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">Total Active Tickets</span>
            <span className="p-2 rounded-lg bg-neutral-800 text-neutral-300">
              <FolderKanban className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-white mt-3">{total}</p>
        </Link>

        <Link href="/tickets" className="panel transition hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">Awaiting Review</span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-white mt-3">{awaitingReview}</p>
        </Link>

        <Link href="/tickets" className="panel transition hover:border-indigo-500/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">In Progress</span>
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-white mt-3">{inProgress}</p>
        </Link>
      </div>

      {/* Recent Tickets Section (Highest Priority First, Then Latest) */}
      <section className="panel space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isEmployee ? "Your Recent Tickets" : "Recent Active Tickets"}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live status and updates on your submitted requests (highest priority first).
            </p>
          </div>
          <Link href="/tickets" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center">
            View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="py-8 text-center text-neutral-400 space-y-3">
            <Inbox className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="font-medium text-neutral-300">No active tickets found</p>
            <Link href="/tickets/new" className="btn text-xs py-1.5 px-3">
              Create your first ticket
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {recentTickets.map((t) => (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-2 rounded-lg transition hover:bg-neutral-800/50"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-neutral-100 group-hover:text-indigo-400 transition break-words">
                      {t.title}
                    </span>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                    {t.notifications.length > 0 && (
                      <span
                        title={`${t.notifications.length} new unread update${t.notifications.length > 1 ? "s" : ""}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        <span>Unread</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                    <span>Department: <strong className="text-neutral-300">{t.department}</strong></span>
                    <span>Assigned: <strong className="text-neutral-300">{t.assignee?.name ?? "Unassigned"}</strong></span>
                    <span suppressHydrationWarning>Created {formatDate(t.createdAt)}</span>
                    {t._count.comments > 0 && (
                      <>
                        <span className="text-neutral-500">•</span>
                        <span>{t._count.comments} {t._count.comments === 1 ? "comment" : "comments"}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center text-xs text-neutral-400">
                  <span>SLA: {formatTimeRemaining(t.slaDueAt)}</span>
                  <ArrowRight className="w-4 h-4 ml-2 text-neutral-500 group-hover:text-neutral-200 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-red-950/70 text-red-400 border-red-800/80",
    HIGH: "bg-orange-950/70 text-orange-400 border-orange-800/80",
    MEDIUM: "bg-blue-950/70 text-blue-400 border-blue-800/80",
    LOW: "bg-neutral-800 text-neutral-400 border-neutral-700",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${styles[priority] ?? styles.LOW}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    NEEDS_APPROVAL: "bg-amber-950/70 text-amber-300 border-amber-800/80",
    IN_REVIEW: "bg-purple-950/70 text-purple-300 border-purple-800/80",
    RE_REVIEW: "bg-pink-950/70 text-pink-300 border-pink-800/80",
    ACCEPTED: "bg-indigo-950/70 text-indigo-300 border-indigo-800/80",
    IN_PROGRESS: "bg-cyan-950/70 text-cyan-300 border-cyan-800/80",
    COMPLETED: "bg-emerald-950/70 text-emerald-300 border-emerald-800/80",
    REJECTED: "bg-rose-950/70 text-rose-400 border-rose-800/80",
  };
  const labels: Record<string, string> = {
    NEEDS_APPROVAL: "Awaiting Review",
    IN_REVIEW: "In Review",
    RE_REVIEW: "Re-Review",
    ACCEPTED: "Accepted",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${styles[status] ?? "bg-neutral-800 text-neutral-300 border-neutral-700"}`}>
      {labels[status] ?? status}
    </span>
  );
}