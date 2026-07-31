import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Ticket as TicketIcon, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const role = session.user.role;
  const userId = session.user.id;

  let whereClause = {};
  if (role === "EMPLOYEE") {
    whereClause = { creatorId: userId };
  } else if (role === "TECH" || role === "TESTER") {
    whereClause = {
      OR: [
        { creatorId: userId },
        { assigneeId: userId },
        { assigneeId: null }, // So they can claim unassigned tickets
      ],
    };
  }

  const tickets = await prisma.ticket.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      creator: true,
      assignee: true,
    },
    take: 10,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "IN_PROGRESS": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "NEEDS_APPROVAL": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default: return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "text-red-400";
      case "HIGH": return "text-orange-400";
      case "MEDIUM": return "text-yellow-400";
      default: return "text-green-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Tickets", value: tickets.length, icon: TicketIcon, color: "text-indigo-400" },
          { label: "In Progress", value: tickets.filter(t => t.status === "IN_PROGRESS").length, icon: Clock, color: "text-blue-400" },
          { label: "Needs Approval", value: tickets.filter(t => t.status === "NEEDS_APPROVAL").length, icon: AlertCircle, color: "text-yellow-400" },
        ].map((metric) => (
          <div key={metric.label} className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-400">{metric.label}</p>
              <p className="text-3xl font-bold text-neutral-100 mt-1">{metric.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-neutral-800/50 ${metric.color}`}>
              <metric.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Tickets List */}
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-neutral-100">Recent Tickets</h2>
          <Link href="/tickets/new" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Create Ticket &rarr;
          </Link>
        </div>
        
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No tickets found. Create your first ticket!
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {tickets.map((ticket) => (
              <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block p-6 hover:bg-neutral-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-neutral-200 font-medium">{ticket.title}</h3>
                    <p className="text-sm text-neutral-500 line-clamp-1">{ticket.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                    <div className="flex flex-col items-end text-sm">
                      <span className={`${getPriorityColor(ticket.priority)} font-medium`}>{ticket.priority}</span>
                      <span className="text-neutral-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
