import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ticketWhere, projectWhere, staffSelect, statusLabels } from "@/lib/policy";
import { getSLAStatus, formatTimeRemaining, cycleBreached, formatDate } from "@/lib/sla";
import { WorkflowButtons } from "./WorkflowButtons";
import { CommentsSection } from "./CommentsSection";
import { ImageGallery } from "@/components/ImageGallery";
import { TicketProjectLink } from "@/components/TicketProjectLink";
import { Pagination } from "@/components/Pagination";
export default async function TicketDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const session = await getServerSession(authOptions); if (!session?.user?.id) return notFound();
  const actor = session.user, { id } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const ticket = await prisma.ticket.findFirst({ where: { AND: [{ id }, ticketWhere(actor)] }, include: {
    creator: { select: staffSelect }, assignee: { select: staffSelect }, project: { select: { id: true, name: true } },
    images: { where: { timelineEventId: null }, select: { id: true } },
    comments: { where: actor.role === "EMPLOYEE" ? { isInternal: false } : {}, include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" }, take: 100, skip: (page - 1) * 100 },
    timeline: { orderBy: { createdAt: "desc" }, take: 25, skip: (page - 1) * 25, include: { images: { select: { id: true } } } },
    slaCycles: { orderBy: { startedAt: "desc" }, take: 25, skip: (page - 1) * 25 },
    _count: { select: { comments: { where: actor.role === "EMPLOYEE" ? { isInternal: false } : {} }, timeline: true, slaCycles: true } },
  } });
  if (!ticket) return notFound();
  // Automatically clear unread notifications on this ticket for the viewing user
  await prisma.notification.updateMany({
    where: { userId: actor.id, ticketId: id, isRead: false },
    data: { isRead: true },
  });
  const projects = await prisma.project.findMany({ where: projectWhere(actor), select: { id: true, name: true }, orderBy: { name: "asc" }, take: 100 });
  const closed = ["COMPLETED", "REJECTED"].includes(ticket.status);
  const sla = getSLAStatus(ticket.slaStartedAt, ticket.priority, ticket.status === "COMPLETED", ticket.slaDueAt, ticket.status === "REJECTED");
  const canLink = actor.role === "ADMIN" || actor.id === ticket.creatorId || actor.id === ticket.assigneeId;
  const links = (images: { id: string }[]) => images.map(i => ({ id: i.id, url: "/api/attachments/" + i.id }));
  return <div className="max-w-5xl mx-auto space-y-6">
    <Link href="/tickets" className="text-indigo-400">? Tickets</Link>
    <section className="panel space-y-4"><h1 className="text-2xl font-semibold break-words">{ticket.title}</h1><p className="text-sm text-neutral-400">By {ticket.creator.name} ? {ticket.createdAt.toLocaleString()} ? {statusLabels[ticket.status]}</p><p className="whitespace-pre-wrap">{ticket.description}</p>
      <ImageGallery images={links(ticket.images)} />
      <WorkflowButtons ticketId={id} currentStatus={ticket.status} userRole={actor.role} assigneeId={ticket.assigneeId} creatorId={ticket.creatorId} currentUserId={actor.id} version={ticket.version} />
      {ticket.resolutionSummary && <div><h2 className="font-semibold">Resolution</h2><p className="whitespace-pre-wrap">{ticket.resolutionSummary}</p></div>}
      {ticket.status === "COMPLETED" && (actor.role === "ADMIN" || actor.id === ticket.assigneeId) && <Link className="inline-block text-indigo-400" href={"/kb/new?ticketId=" + id}>Draft a restricted knowledge-base article ?</Link>}
    </section>
    <div className="grid md:grid-cols-2 gap-6">
      <section className="panel space-y-3"><h2 className="text-lg font-semibold">Ticket details</h2><p>{ticket.department} • {ticket.priority}</p><p>Assigned to {ticket.assignee?.name ?? "Unassigned"}</p><p>SLA: {sla.replaceAll("_", " ")}</p><p suppressHydrationWarning>SLA deadline: {ticket.slaDueAt.toLocaleString()}</p>{!closed && <p>{formatTimeRemaining(ticket.slaDueAt)}</p>}<p suppressHydrationWarning>Technician estimate: {ticket.dueDate ? formatDate(ticket.dueDate) : "Not set"}</p><p className="text-sm text-neutral-400">SLA runs continuously, including review. Estimates do not extend it.</p>
        {canLink ? <TicketProjectLink key={ticket.version} id={id} version={ticket.version} projectId={ticket.projectId} projects={projects} /> : <p>Project: {ticket.project?.name ?? "None"}</p>}
      </section>
      <section className="panel space-y-3"><h2 className="text-lg font-semibold">SLA history</h2>{ticket.slaCycles.map(c => <div key={c.id} className="border-b border-neutral-800 pb-2"><p>{c.startedAt.toLocaleString()} ? {c.endedAt?.toLocaleString() ?? "Active"}</p><p className={cycleBreached(c) ? "text-red-400" : "text-neutral-400"}>{c.outcome ? statusLabels[c.outcome] : "Open"} ? {cycleBreached(c) ? "Deadline missed" : "Within deadline"}</p></div>)}</section>
    </div>
    <section className="panel"><h2 className="text-lg font-semibold mb-4">Discussion</h2><CommentsSection ticketId={id} userRole={actor.role} comments={ticket.comments} /></section>
    <section className="panel space-y-4"><h2 className="text-lg font-semibold">Timeline</h2>{ticket.timeline.map(event => <article key={event.id} className="border-b border-neutral-800 pb-3"><p className="whitespace-pre-wrap">{event.action}</p><p className="text-sm text-neutral-400">{event.createdAt.toLocaleString()}</p><ImageGallery images={links(event.images)} /></article>)}</section>
    <Pagination page={page} total={Math.max(ticket._count.comments, ticket._count.timeline, ticket._count.slaCycles)} base={"/tickets/" + id} />
  </div>;
}