import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { TicketStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status, reason, dueDate, images, assigneeId } = await req.json();

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    let actionText = reason 
      ? `Status changed to ${status.replace("_", " ")}. Reason: "${reason}"`
      : `Status changed to ${status.replace("_", " ")}`;

    if (dueDate) {
      actionText += `. Expected Completion: ${new Date(dueDate).toLocaleDateString()}`;
    }

    let timelineCreateData: any = {
      action: actionText,
      userId: session.user.id,
    };

    if (images && images.length > 0) {
      timelineCreateData.images = {
        create: images.map((url: string) => ({ 
          url,
          ticketId: id
        }))
      };
    }

    const updateData: any = {
      status: status as TicketStatus,
      timeline: {
        create: timelineCreateData
      }
    };

    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }
    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId;
    }

    // Update the ticket
    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    if (assigneeId && assigneeId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          message: `You have been assigned to ticket: ${ticket.title}`,
          ticketId: ticket.id,
        },
      });
      const { sendPushNotification } = await import("@/lib/push");
      await sendPushNotification(assigneeId, "Ticket Assigned", `You have been assigned to: ${ticket.title}`, `/tickets/${ticket.id}`);
    }

    // Notify the ticket creator about the status change
    if (ticket.creatorId && ticket.creatorId !== session.user.id) {
      let msg = `Your ticket "${ticket.title}" status was updated to ${status.replace("_", " ")}`;
      if (reason) msg += `. Reason: ${reason}`;
      
      await prisma.notification.create({
        data: {
          userId: ticket.creatorId,
          message: msg,
          ticketId: ticket.id,
        },
      });
      const { sendPushNotification } = await import("@/lib/push");
      await sendPushNotification(ticket.creatorId, "Ticket Update", msg, `/tickets/${ticket.id}`);
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
