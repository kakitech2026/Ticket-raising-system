import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson, requireUser } from "@/lib/api";
import { articleWhere, staffSelect } from "@/lib/policy";
import { articleSchema } from "@/lib/validation";
import { checkAssignee } from "@/lib/tickets";
type Context = { params: Promise<{ id: string }> };
export async function GET(_req: Request, { params }: Context) {
  try {
    const actor = await requireUser(), { id } = await params;
    const article = await prisma.article.findFirst({ where: { AND: [{ id }, articleWhere(actor)] }, include: { assignee: { select: staffSelect } } });
    if (!article) throw new ApiError(404, "Article not found");
    return NextResponse.json(article);
  } catch (error) { return apiError(error); }
}
export async function PATCH(req: Request, { params }: Context) {
  try {
    const actor = await requireUser(), { id } = await params;
    if (actor.role === "EMPLOYEE") throw new ApiError(403, "Only staff can edit articles");
    const data = await readJson(req, articleSchema.omit({ sourceTicketId: true }));
    if (data.assigneeId && actor.role !== "ADMIN" && data.assigneeId !== actor.id) throw new ApiError(403, "Only admins can reassign articles");
    const result = await prisma.$transaction(async tx => {
      if (data.assigneeId) await checkAssignee(tx, data.assigneeId);
      return tx.article.updateMany({ where: { AND: [{ id }, articleWhere(actor)] }, data });
    });
    if (!result.count) throw new ApiError(404, "Article not found");
    return NextResponse.json({ id });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_req: Request, { params }: Context) {
  try {
    const actor = await requireUser(), { id } = await params;
    if (actor.role === "EMPLOYEE") throw new ApiError(403, "Only staff can delete articles");
    const result = await prisma.article.deleteMany({ where: { AND: [{ id }, articleWhere(actor)] } });
    if (!result.count) throw new ApiError(404, "Article not found");
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error); }
}