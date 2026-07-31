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
    const { status, reason } = await req.json();

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const actionText = reason 
      ? `Status changed to ${status.replace("_", " ")}. Reason: "${reason}"`
      : `Status changed to ${status.replace("_", " ")}`;

    // Update the ticket
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status: status as TicketStatus,
        timeline: {
          create: {
            action: actionText,
            userId: session.user.id,
          }
        }
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
