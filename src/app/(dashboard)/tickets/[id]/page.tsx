import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Info } from "lucide-react";
import Link from "next/link";
import { WorkflowButtons } from "./WorkflowButtons";
import { CommentsSection } from "./CommentsSection";
import { ImageGallery } from "@/components/ImageGallery";
import { getSLAStatus, formatTimeRemaining } from "@/lib/sla";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      creator: true,
      assignee: true,
      requestedAssignee: true,
      images: true,
      timeline: {
        orderBy: { createdAt: "asc" },
        include: { images: true },
      },
      comments: {
        include: { author: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) return notFound();

  // Authorization Check
  const role = session.user.role;
  const userId = session.user.id;
  const isCreator = ticket.creatorId === userId;
  const isAssignee = ticket.assigneeId === userId;
  
  if (role === "EMPLOYEE" && !isCreator) {
    return notFound(); // Hide ticket completely if they aren't the creator
  }
  if (role === "TECH" && !isCreator && !isAssignee && ticket.assigneeId !== null) {
    return notFound(); // Hide ticket if it's assigned to someone else and they didn't create it
  }
  // Admin can see everything, no notFound check for ADMIN

  // Filter out internal comments for normal employees
  const visibleComments = session.user.role === "EMPLOYEE" 
    ? ticket.comments.filter(c => !c.isInternal)
    : ticket.comments;

  const initialImages = ticket.images.filter(img => !img.timelineEventId);

  const latestReReviewEvent = ticket.status === "RE_REVIEW" 
    ? [...ticket.timeline].reverse().find(e => e.action.includes("RE REVIEW"))
    : null;
    
  let reReviewReason = "";
  let reReviewImages: any[] = [];
  
  if (latestReReviewEvent) {
    const match = latestReReviewEvent.action.match(/Reason: "(.*)"$/s);
    reReviewReason = match ? match[1] : latestReReviewEvent.action;
    reReviewImages = latestReReviewEvent.images || [];
  }

  const slaStatus = getSLAStatus(ticket.createdAt, ticket.priority, ticket.status === "COMPLETED");
  const isResolved = ticket.status === "COMPLETED";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-neutral-100">{ticket.title}</h1>
                <p className="text-sm text-neutral-400 mt-1" suppressHydrationWarning>
                  Created by <span className="text-neutral-200">{ticket.creator.name}</span> on {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {ticket.status === "COMPLETED" && (role === "ADMIN" || role === "TECH") && (
                  <Link 
                    href={`/kb/new?title=${encodeURIComponent(ticket.title)}&content=${encodeURIComponent(ticket.description)}`}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Publish to KB
                  </Link>
                )}
                <WorkflowButtons 
                  ticketId={ticket.id} 
                  currentStatus={ticket.status} 
                  userRole={session.user.role}
                  assigneeId={ticket.assigneeId}
                  requestedAssigneeId={ticket.requestedAssigneeId}
                  creatorId={ticket.creatorId}
                  currentUserId={session.user.id}
                />
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-neutral-300 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {initialImages.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-neutral-200 mb-3 uppercase tracking-wider">Initial Screenshots</h3>
                <ImageGallery images={initialImages} />
              </div>
            )}

            {ticket.status === "RE_REVIEW" && latestReReviewEvent && (
              <div className="mt-8 bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-orange-400 mb-3 uppercase tracking-wider">Re-Review Requested</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-neutral-200 whitespace-pre-wrap">{reReviewReason}</p>
                </div>
                {reReviewImages.length > 0 && (
                  <div className="mt-4">
                    <ImageGallery images={reReviewImages} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 md:p-8">
            <h3 className="text-lg font-semibold text-neutral-100 mb-6">Discussion</h3>
            <CommentsSection 
              ticketId={ticket.id} 
              userRole={session.user.role}
              comments={visibleComments} 
            />
          </div>
        </div>

        {/* Right Column (Sidebar Info & Timeline) */}
        <div className="space-y-6">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-neutral-200 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4" /> Details
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Status</span>
                <span className="font-medium text-neutral-200">{ticket.status.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Priority</span>
                <span className="font-medium text-neutral-200">{ticket.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Department</span>
                <span className="font-medium text-neutral-200">{ticket.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Assignee</span>
                <span className="font-medium text-neutral-200">{ticket.assignee?.name || "Unassigned"}</span>
              </div>
              {ticket.requestedAssignee && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Requested Tech</span>
                  <span className="font-medium text-neutral-200">{ticket.requestedAssignee.name}</span>
                </div>
              )}
              
              <div className="pt-4 mt-4 border-t border-neutral-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">SLA Status</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    slaStatus === "BREACHED" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    slaStatus === "AT_RISK" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                    slaStatus === "COMPLETED" ? "bg-neutral-800 text-neutral-400 border-neutral-700" :
                    "bg-green-500/10 text-green-400 border-green-500/20"
                  }`}>
                    {slaStatus.replace("_", " ")}
                  </span>
                </div>
                {!isResolved && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Time Remaining</span>
                    <span className={`font-medium ${slaStatus === "BREACHED" ? "text-red-400" : "text-neutral-200"}`}>
                      {formatTimeRemaining(ticket.dueDate || ticket.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-neutral-200 mb-6 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> Timeline
            </h3>
            <div className="relative border-l border-neutral-800 ml-3 space-y-6">
              {ticket.timeline.map((event, idx) => (
                <div key={event.id} className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-neutral-700 rounded-full ring-4 ring-neutral-900"></div>
                  <p className="text-sm text-neutral-300">{event.action}</p>
                  
                  {event.images && event.images.length > 0 && (
                    <div className="mt-3 mb-2">
                      <ImageGallery 
                        images={event.images} 
                        containerClassName="grid grid-cols-2 gap-2" 
                        imageClassName="w-full h-20 object-cover" 
                      />
                    </div>
                  )}

                  <p className="text-xs text-neutral-500 mt-1" suppressHydrationWarning>{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
