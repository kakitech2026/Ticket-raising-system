import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Search, Plus, Calendar, Ticket as TicketIcon } from "lucide-react";
import { TicketFilters } from "./TicketFilters";
import { Prisma } from "@prisma/client";

export const metadata = {
  title: "My Tickets | Tickety",
};

export default async function MyTicketsPage(
  props: {
    searchParams: Promise<{ search?: string; status?: string; priority?: string }>;
  }
) {
  const searchParams = await props.searchParams;
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
      ],
    };
  } else if (role === "MANAGER" || role === "ADMIN") {
    // For managers and admins, they might want to see all tickets or just theirs. 
    // Assuming "My Tickets" means tickets they created or are assigned to them, but usually they see everything.
    // Let's stick to their own tickets for "My tickets" to keep it distinct from an "All Tickets" view.
    whereClause = {
      OR: [
        { creatorId: userId },
        { assigneeId: userId },
      ],
    };
  }

  // Apply filters from searchParams
  const filters: Prisma.TicketWhereInput[] = [whereClause];

  if (searchParams.search) {
    filters.push({
      OR: [
        { title: { contains: searchParams.search, mode: "insensitive" } },
        { description: { contains: searchParams.search, mode: "insensitive" } },
      ],
    });
  }

  if (searchParams.status) {
    filters.push({ status: searchParams.status as any });
  }

  if (searchParams.priority) {
    filters.push({ priority: searchParams.priority as any });
  }

  const finalWhereClause: Prisma.TicketWhereInput = filters.length > 1 
    ? { AND: filters } 
    : whereClause;

  const tickets = await prisma.ticket.findMany({
    where: finalWhereClause,
    orderBy: { createdAt: "desc" },
    include: {
      creator: true,
      assignee: true,
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "IN_PROGRESS": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "NEEDS_APPROVAL": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "APPROVED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "REJECTED": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "IN_TESTING": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default: return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "HIGH": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "MEDIUM": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      default: return "text-green-400 bg-green-400/10 border-green-400/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Tickets</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage and track your tickets</p>
        </div>
        <Link 
          href="/tickets/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          Create Ticket
        </Link>
      </div>

      {/* Toolbar */}
      <TicketFilters />

      {/* Tickets List */}
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center border-t border-neutral-800">
            <div className="w-16 h-16 bg-neutral-800/50 rounded-full flex items-center justify-center mb-4">
              <TicketIcon className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No tickets found</h3>
            <p className="text-neutral-500 max-w-sm mb-6">You don't have any tickets yet. Create a new one to get started.</p>
            <Link 
              href="/tickets/new" 
              className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Ticket
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/80">
                  <th className="px-6 py-4 text-sm font-medium text-neutral-400">Ticket</th>
                  <th className="px-6 py-4 text-sm font-medium text-neutral-400">Status</th>
                  <th className="px-6 py-4 text-sm font-medium text-neutral-400">Priority</th>
                  <th className="px-6 py-4 text-sm font-medium text-neutral-400">Department</th>
                  <th className="px-6 py-4 text-sm font-medium text-neutral-400">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-neutral-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/tickets/${ticket.id}`} className="block">
                        <p className="text-white font-medium group-hover:text-indigo-400 transition-colors">{ticket.title}</p>
                        <p className="text-sm text-neutral-500 line-clamp-1 mt-0.5 max-w-md">{ticket.description}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-300">
                        {ticket.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(ticket.createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', month: 'short', day: 'numeric' 
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
