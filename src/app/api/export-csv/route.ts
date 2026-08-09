import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { getSLAStatus } from "@/lib/sla";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const userId = session.user.id;

    // Base authorization clause
    let whereClause = {};
    if (role === "EMPLOYEE") {
      whereClause = { creatorId: userId };
    } else if (role === "TECH") {
      whereClause = {
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
        ],
      };
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const department = searchParams.get("department");

    const filters: Prisma.TicketWhereInput[] = [whereClause];

    if (q) {
      filters.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    if (status) filters.push({ status: status as any });
    if (priority) filters.push({ priority: priority as any });
    if (department) filters.push({ department });

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

    // Generate CSV
    const headers = ["Ticket ID", "Title", "Creator", "Assignee", "Status", "Priority", "Department", "SLA Status", "Created At", "Resolved At"];
    const rows = tickets.map(t => {
      const isResolved = t.status === "COMPLETED";
      const slaStatus = getSLAStatus(t.createdAt, t.priority as any, isResolved);
      
      const resolvedEvent = isResolved 
        // We'd ideally pull this from timeline, but for CSV we can approximate or leave empty if we don't have timeline joined
        ? t.updatedAt.toISOString() 
        : "";

      return [
        `"${t.id}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${t.creator.name}"`,
        `"${t.assignee?.name || "Unassigned"}"`,
        `"${t.status}"`,
        `"${t.priority}"`,
        `"${t.department}"`,
        `"${slaStatus}"`,
        `"${t.createdAt.toISOString()}"`,
        `"${resolvedEvent}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tickets_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV Export Error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
