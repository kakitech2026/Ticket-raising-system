import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma, TicketStatus } from "@prisma/client";
import { projectWhere, ticketWhere, staffSelect, statusLabels, activeStatuses } from "@/lib/policy";
import { ProjectForm } from "@/components/ProjectForm";
import { Pagination } from "@/components/Pagination";
import { ArrowLeft, Clock, CheckCircle2, Ticket } from "lucide-react";

export const metadata = { title: "Project | Tickety" };

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return notFound();

  const { id } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const activeTab = sp.tab ?? "active";

  const project = await prisma.project.findFirst({
    where: { AND: [{ id }, projectWhere(session.user)] },
    include: {
      members: { select: staffSelect },
      owner: { select: staffSelect },
    },
  });

  if (!project) return notFound();

  const completedStatuses: TicketStatus[] = ["COMPLETED", "REJECTED"];
  const baseProjectTicketWhere = { AND: [{ projectId: id }, ticketWhere(session.user)] };
  const filterWhere: Prisma.TicketWhereInput = {
    AND: [
      baseProjectTicketWhere,
      activeTab === "completed"
        ? { status: { in: completedStatuses } }
        : { status: { in: activeStatuses } },
    ],
  };

  const [activeCount, completedCount, tickets, total] = await Promise.all([
    prisma.ticket.count({
      where: { AND: [baseProjectTicketWhere, { status: { in: activeStatuses } }] },
    }),
    prisma.ticket.count({
      where: { AND: [baseProjectTicketWhere, { status: { in: completedStatuses } }] },
    }),
    prisma.ticket.findMany({
      where: filterWhere,
      take: 25,
      skip: (page - 1) * 25,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        assignee: { select: { name: true } },
      },
    }),
    prisma.ticket.count({ where: filterWhere }),
  ]);

  const canManage = session.user.role === "ADMIN" || session.user.id === project.ownerId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/projects"
        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Owner: <strong className="text-neutral-200">{project.owner.name}</strong>
          </p>
        </div>
      </div>

      <ProjectForm
        key={project.version}
        canManage={canManage}
        project={{
          ...project,
          startDate: project.startDate?.toISOString() ?? null,
          endDate: project.endDate?.toISOString() ?? null,
        }}
      />

      {/* Project Tickets Section with Active vs Completed Tabs */}
      <section className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <h2 className="text-lg font-semibold text-white">Project Tickets</h2>
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${id}?tab=active`}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5 ${
                activeTab === "active"
                  ? "bg-indigo-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Active ({activeCount})
            </Link>
            <Link
              href={`/projects/${id}?tab=completed`}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5 ${
                activeTab === "completed"
                  ? "bg-indigo-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed ({completedCount})
            </Link>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="py-6 text-center text-neutral-400 space-y-1">
            <Ticket className="w-6 h-6 mx-auto text-neutral-600 mb-2" />
            <p className="text-sm font-medium text-neutral-300">
              No {activeTab === "completed" ? "completed" : "active"} tickets in this project.
            </p>
            <p className="text-xs">You can link tickets to this project from their ticket details page.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="flex items-center justify-between gap-3 py-3 px-2 rounded hover:bg-neutral-800/40 transition"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-neutral-100 hover:text-indigo-400 truncate">
                    {t.title}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Assigned to: {t.assignee?.name ?? "Unassigned"} • Priority: {t.priority}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 shrink-0">
                  {statusLabels[t.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Pagination page={page} total={total} base={"/projects/" + id} params={{ tab: activeTab }} />
    </div>
  );
}