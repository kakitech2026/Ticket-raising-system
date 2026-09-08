import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ticketQuery } from "@/lib/ticket-query";
import { activeStatuses, statusLabels, ticketWhere } from "@/lib/policy";
import { TicketFilters } from "./TicketFilters";
import { Pagination } from "@/components/Pagination";
import { MessageSquare, Inbox, CheckCircle2, Clock, ListFilter, PlusCircle } from "lucide-react";

export const metadata = { title: "Tickets | Tickety" };

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const params = await searchParams;
  let query;
  try {
    query = ticketQuery(session.user, params);
  } catch {
    return (
      <div className="panel">
        <p role="alert">Invalid filters.</p>
        <Link href="/tickets">Clear filters</Link>
      </div>
    );
  }

  const isTech = session.user.role === "TECH";
  const isAdmin = session.user.role === "ADMIN";
  const currentView = params.queue === "unassigned" ? "unassigned" : (params.view ?? "active");

  const baseUserWhere = ticketWhere(session.user);
  const myScopeWhere = isTech
    ? { AND: [baseUserWhere, { OR: [{ creatorId: session.user.id }, { assigneeId: session.user.id }] }] }
    : baseUserWhere;

  const [
    tickets,
    total,
    activeCount,
    completedCount,
    allCount,
    unassignedCount,
  ] = await Promise.all([
    prisma.ticket.findMany({
      where: query.where,
      orderBy: { createdAt: "desc" },
      take: 25,
      skip: (query.page - 1) * 25,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        department: true,
        createdAt: true,
        assignee: { select: { name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.ticket.count({ where: query.where }),
    prisma.ticket.count({ where: { AND: [myScopeWhere, { status: { in: activeStatuses } }] } }),
    prisma.ticket.count({ where: { AND: [myScopeWhere, { status: { in: ["COMPLETED", "REJECTED"] } }] } }),
    prisma.ticket.count({ where: myScopeWhere }),
    (isTech || isAdmin) ? prisma.ticket.count({ where: ticketWhere(session.user, true) }) : Promise.resolve(0),
  ]);

  // Tab builder preserving other search/filter params
  function buildTabHref(tabView: string, isQueue = false) {
    const sp = new URLSearchParams();
    if (isQueue) {
      sp.set("queue", "unassigned");
    } else {
      if (tabView !== "active") sp.set("view", tabView);
    }
    if (params.q) sp.set("q", params.q);
    if (params.priority) sp.set("priority", params.priority);
    if (params.department) sp.set("department", params.department);
    const qs = sp.toString();
    return "/tickets" + (qs ? `?${qs}` : "");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {params.queue === "unassigned" ? "Unassigned Pool" : "Tickets"}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            {params.queue === "unassigned"
              ? "Available tickets waiting to be claimed by technicians."
              : currentView === "completed"
              ? "Resolved and closed ticket archives."
              : currentView === "all"
              ? "All tickets across all lifecycle stages."
              : "Active tickets currently in progress, accepted, or awaiting review."}
          </p>
        </div>
        <Link className="btn bg-indigo-600 hover:bg-indigo-500" href="/tickets/new">
          <PlusCircle className="w-4 h-4 mr-2" /> Create Ticket
        </Link>
      </div>

      {/* Navigation Tabs (Separating Active vs Completed vs Unassigned) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-3">
        <Link
          href={buildTabHref("active")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-2 ${
            currentView === "active"
              ? "bg-indigo-600 text-white shadow"
              : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-neutral-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Active Tickets</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            currentView === "active" ? "bg-indigo-700/80 text-white" : "bg-neutral-800 text-neutral-300"
          }`}>
            {activeCount}
          </span>
        </Link>

        <Link
          href={buildTabHref("completed")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-2 ${
            currentView === "completed"
              ? "bg-indigo-600 text-white shadow"
              : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-neutral-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Completed & Closed</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            currentView === "completed" ? "bg-indigo-700/80 text-white" : "bg-neutral-800 text-neutral-300"
          }`}>
            {completedCount}
          </span>
        </Link>

        <Link
          href={buildTabHref("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-2 ${
            currentView === "all"
              ? "bg-indigo-600 text-white shadow"
              : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-neutral-800"
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>All Tickets</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            currentView === "all" ? "bg-indigo-700/80 text-white" : "bg-neutral-800 text-neutral-300"
          }`}>
            {allCount}
          </span>
        </Link>

        {(isTech || isAdmin) && (
          <Link
            href={buildTabHref("", true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-2 ${
              currentView === "unassigned"
                ? "bg-indigo-600 text-white shadow"
                : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-neutral-800"
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Unassigned Pool</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              currentView === "unassigned" ? "bg-indigo-700/80 text-white" : "bg-neutral-800 text-neutral-300"
            }`}>
              {unassignedCount}
            </span>
          </Link>
        )}
      </div>

      <TicketFilters key={params.q ?? ""} />

      {/* Tickets Table */}
      <div className="panel overflow-x-auto p-0 border border-neutral-800 rounded-xl">
        {tickets.length ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/60 text-xs font-semibold uppercase text-neutral-400">
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-sm">
              {tickets.map((t) => (
                <tr key={t.id} className="transition hover:bg-neutral-800/40">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <Link
                        className="text-neutral-100 hover:text-indigo-400 font-medium transition break-words"
                        href={"/tickets/" + t.id}
                      >
                        {t.title}
                      </Link>
                      {t._count.comments > 0 && (
                        <span
                          title={`${t._count.comments} comment${t._count.comments > 1 ? "s" : ""}`}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 shrink-0"
                        >
                          <MessageSquare className="w-3 h-3 text-indigo-400" />
                          <span>{t._count.comments}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-3.5 px-4">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="py-3.5 px-4 text-neutral-400">{t.department}</td>
                  <td className="py-3.5 px-4 text-neutral-300">
                    {t.assignee?.name ?? <span className="text-neutral-500 italic">Unassigned</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-neutral-400 space-y-2">
            <Inbox className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="font-medium text-neutral-300">No tickets found</p>
            <p className="text-xs">No tickets match the selected view or filters.</p>
          </div>
        )}
      </div>

      <Pagination page={query.page} total={total} base="/tickets" params={params} />
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
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${styles[status] ?? "bg-neutral-800 text-neutral-300 border-neutral-700"}`}>
      {statusLabels[status as keyof typeof statusLabels] ?? status}
    </span>
  );
}