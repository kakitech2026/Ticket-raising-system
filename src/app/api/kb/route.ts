import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson, requireUser } from "@/lib/api";
import { articleWhere, staffSelect, ticketWhere } from "@/lib/policy";
import { articleSchema } from "@/lib/validation";
import { checkAssignee } from "@/lib/tickets";
export async function GET(req: Request) {
  try {
    const actor = await requireUser(), page = Math.max(1, Number(new URL(req.url).searchParams.get("page")) || 1);
    return NextResponse.json(await prisma.article.findMany({ where: articleWhere(actor), take: 50, skip: (page - 1) * 50, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, updatedAt: true, assignee: { select: staffSelect } } }));
  } catch (error) { return apiError(error); }
}
export async function POST(req: Request) {
  try {
    const actor = await requireUser();
    if (actor.role === "EMPLOYEE") throw new ApiError(403, "Only staff may create articles");
    const data = await readJson(req, articleSchema);
    const article = await prisma.$transaction(async tx => {
      let assigneeId = actor.id;
      if (data.sourceTicketId) {
        const ticket = await tx.ticket.findFirst({ where: { AND: [{ id: data.sourceTicketId, status: "COMPLETED" }, ticketWhere(actor)] } });
        if (!ticket) throw new ApiError(404, "Completed source ticket not found");
        assigneeId = ticket.assigneeId ?? actor.id;
      }
      if (data.assigneeId) {
        if (actor.role !== "ADMIN" && data.assigneeId !== actor.id) throw new ApiError(403, "Only admins may assign an article to someone else");
        assigneeId = data.assigneeId;
      }
      await checkAssignee(tx, assigneeId);
      return tx.article.create({ data: { ...data, assigneeId, authorId: actor.id }, select: { id: true } });
    });
    return NextResponse.json(article, { status: 201 });
  } catch (error) { return apiError(error); }
}