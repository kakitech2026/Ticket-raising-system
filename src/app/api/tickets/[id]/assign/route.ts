import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
    
    // Assign to the current user
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        assigneeId: session.user.id,
        timeline: {
          create: {
            action: `Ticket assigned to ${session.user.name}`,
            userId: session.user.id,
          }
        }
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
