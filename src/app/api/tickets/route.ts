import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Priority } from "@prisma/client";
import { calculateSLADeadline } from "@/lib/sla";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, priority, department, images, assigneeId } = await req.json();

    if (!title || !description || !department) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority as Priority,
        department,
        dueDate: calculateSLADeadline(new Date(), priority as Priority),
        assigneeId: assigneeId || undefined,
        requestedAssigneeId: undefined,
        creatorId: session.user.id,
        timeline: {
          create: {
            action: "Ticket created",
            userId: session.user.id,
          }
        },
        images: images && images.length > 0 ? {
          create: images.map((url: string) => ({ url }))
        } : undefined
      },
    });

    if (assigneeId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          message: `You have been assigned to a new ticket: ${ticket.title}`,
          ticketId: ticket.id,
        },
      });
      
      const { sendPushNotification } = await import("@/lib/push");
      await sendPushNotification(assigneeId, "New Ticket Assigned", `You have been assigned to: ${ticket.title}`, `/tickets/${ticket.id}`);
    }

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
