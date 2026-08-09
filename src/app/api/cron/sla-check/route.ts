import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSLAStatus } from "@/lib/sla";
import { sendPushNotification } from "@/lib/push";

export async function GET(req: Request) {
  try {
    // Note: In production, you should add authorization here 
    // (e.g., check an API key in the headers) to prevent abuse.
    
    // Fetch all unresolved tickets
    const activeTickets = await prisma.ticket.findMany({
      where: {
        status: {
          not: "COMPLETED",
        },
      },
      include: {
        assignee: true,
      }
    });

    let breachedCount = 0;

    for (const ticket of activeTickets) {
      const slaStatus = getSLAStatus(ticket.createdAt, ticket.priority, false);
      
      if (slaStatus === "BREACHED" && ticket.assigneeId) {
        // Send a notification to the assignee if they haven't been spammed recently
        // (In a real system, you'd want to store the "last SLA notification sent" timestamp to avoid duplicate alerts every minute)
        
        await sendPushNotification(
          ticket.assigneeId, 
          "🚨 SLA Breached!", 
          `Ticket "${ticket.title}" has breached its SLA deadline. Please resolve immediately.`, 
          `/tickets/${ticket.id}`
        );

        // Also notify admins
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
        for (const admin of admins) {
           await sendPushNotification(
             admin.id,
             "🚨 SLA Breached",
             `Tech ${ticket.assignee?.name} missed the SLA for ticket "${ticket.title}".`,
             `/tickets/${ticket.id}`
           );
        }
        
        breachedCount++;
      }
    }

    return NextResponse.json({ success: true, breachedNotified: breachedCount });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Failed to run SLA check" }, { status: 500 });
  }
}
