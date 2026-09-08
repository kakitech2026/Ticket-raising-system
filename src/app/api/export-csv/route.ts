import { prisma } from "@/lib/prisma";
import { apiError, requireUser } from "@/lib/api";
import { ticketQuery } from "@/lib/ticket-query";
import { csvRow } from "@/lib/csv";
export async function GET(req: Request) {
  try {
    const actor = await requireUser(), { where } = ticketQuery(actor, Object.fromEntries(new URL(req.url).searchParams));
    let cursor: string | undefined, header = false;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          if (!header) { controller.enqueue(encoder.encode(csvRow(["Ticket ID","Title","Creator","Assignee","Status","Priority","Department","SLA Deadline","Technician Estimate","Created At","Completed At"]))); header=true; return; }
          const rows = await prisma.ticket.findMany({ where, orderBy: { id: "asc" }, take: 250, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), select: { id:true,title:true,status:true,priority:true,department:true,slaDueAt:true,dueDate:true,createdAt:true,completedAt:true,creator:{select:{name:true}},assignee:{select:{name:true}} } });
          if (!rows.length) { controller.close(); return; }
          controller.enqueue(encoder.encode(rows.map(t => csvRow([t.id,t.title,t.creator.name,t.assignee?.name,t.status,t.priority,t.department,t.slaDueAt.toISOString(),t.dueDate?.toISOString(),t.createdAt.toISOString(),t.completedAt?.toISOString()])).join("")));
          cursor=rows.at(-1)!.id;
        } catch { controller.error(new Error("Export interrupted. Please retry.")); }
      },
    });
    return new Response(stream, { headers: { "Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="tickets.csv"',"Cache-Control":"private, no-store" } });
  } catch(error) { return apiError(error); }
}