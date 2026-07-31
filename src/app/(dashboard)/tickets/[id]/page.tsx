import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Info } from "lucide-react";
import Link from "next/link";
import { WorkflowButtons } from "./WorkflowButtons";
import { CommentsSection } from "./CommentsSection";

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
      images: true,
      timeline: {
        orderBy: { createdAt: "asc" },
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
  if ((role === "TECH" || role === "TESTER") && !isCreator && !isAssignee && ticket.assigneeId !== null) {
    return notFound(); // Hide ticket if it's assigned to someone else and they didn't create it
  }

  // Filter out internal comments for normal employees
  const visibleComments = session.user.role === "EMPLOYEE" 
    ? ticket.comments.filter(c => !c.isInternal)
    : ticket.comments;

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
              <WorkflowButtons 
                ticketId={ticket.id} 
                currentStatus={ticket.status} 
                userRole={session.user.role}
                assigneeId={ticket.assigneeId}
                currentUserId={session.user.id}
              />
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-neutral-300 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {ticket.images.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-neutral-200 mb-3 uppercase tracking-wider">Attached Screenshots</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ticket.images.map((img) => (
                    <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-neutral-700 hover:border-indigo-500 transition-colors">
                      <img src={img.url} alt="Screenshot" className="w-full h-32 object-cover" />
                    </a>
                  ))}
                </div>
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
