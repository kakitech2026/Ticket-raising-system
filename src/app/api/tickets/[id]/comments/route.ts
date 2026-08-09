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

    // Fetch ticket to get creatorId and assigneeId
    const ticket = await prisma.ticket.findUnique({ where: { id } });

    if (ticket && !isInternal) {
      // Notify creator if the author is not the creator
      if (ticket.creatorId && ticket.creatorId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: ticket.creatorId,
            message: `New comment on your ticket "${ticket.title}"`,
            ticketId: ticket.id,
          }
        });
        const { sendPushNotification } = await import("@/lib/push");
        await sendPushNotification(ticket.creatorId, "New Comment", `Someone commented on your ticket "${ticket.title}"`, `/tickets/${ticket.id}`);
      }
      
      // Notify assignee if the author is not the assignee
      if (ticket.assigneeId && ticket.assigneeId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: ticket.assigneeId,
            message: `New comment on assigned ticket "${ticket.title}"`,
            ticketId: ticket.id,
          }
        });
        const { sendPushNotification } = await import("@/lib/push");
        await sendPushNotification(ticket.assigneeId, "New Comment", `Someone commented on assigned ticket "${ticket.title}"`, `/tickets/${ticket.id}`);
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
