import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (query.trim().length < 3) {
      return NextResponse.json({ articles: [] });
    }

    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } }
        ]
      },
      select: {
        id: true,
        title: true,
        content: true
      },
      take: 3
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Search KB Error:", error);
    return NextResponse.json({ error: "Failed to search knowledge base" }, { status: 500 });
  }
}
