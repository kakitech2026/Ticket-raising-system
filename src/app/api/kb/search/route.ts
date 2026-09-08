import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, requireUser } from "@/lib/api";
import { articleWhere } from "@/lib/policy";
export async function GET(req: Request) {
  try {
    const actor = await requireUser(), query = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 160);
    if (query.length < 3) return NextResponse.json({ articles: [] });
    const articles = await prisma.article.findMany({ where: { AND: [articleWhere(actor), { OR: [{ title: { contains: query, mode: "insensitive" } }, { content: { contains: query, mode: "insensitive" } }] }] }, select: { id: true, title: true }, take: 3 });
    return NextResponse.json({ articles });
  } catch (error) { return apiError(error); }
}