import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { content, isInternal } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        isInternal: isInternal || false,
        authorId: session.user.id,
        ticketId: id,
      },
    });

    // Also add to timeline
    await prisma.timelineEvent.create({
      data: {
        action: isInternal ? "Added an internal note" : "Added a comment",
        userId: session.user.id,
        ticketId: id,
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
