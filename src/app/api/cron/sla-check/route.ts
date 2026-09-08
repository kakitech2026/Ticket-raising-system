import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { activeStatuses } from "@/lib/policy";
import { deliverNotifications } from "@/lib/push";
import { apiError, ApiError } from "@/lib/api";
export async function GET(req: Request) {
  try {
    const expected = process.env.CRON_SECRET;
    const received = req.headers.get("authorization") || "";
    if (!expected || received.length !== ("Bearer " + expected).length || !timingSafeEqual(Buffer.from(received), Buffer.from("Bearer " + expected))) throw new ApiError(401, "Unauthorized");
    const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
    const cycles = await prisma.ticketSlaCycle.findMany({ where: { endedAt: null, dueAt: { lt: new Date() }, ticket: { status: { in: activeStatuses } } }, include: { ticket: { select: { assigneeId: true } } }, take: 500, orderBy: { dueAt: "asc" } });
    let created = 0;
    for (const cycle of cycles) {
      const recipients = [...new Set([...admins.map(a => a.id), ...(cycle.ticket.assigneeId ? [cycle.ticket.assigneeId] : [])])];
      const result = await prisma.notification.createMany({ data: recipients.map(userId => ({ userId, ticketId: cycle.ticketId, message: "SLA deadline missed. Please review this ticket.", dedupeKey: "sla:" + cycle.id + ":" + userId })), skipDuplicates: true });
      created += result.count;
    }
    await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await prisma.passwordReset.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return NextResponse.json({ created, push: await deliverNotifications() });
  } catch (error) { return apiError(error); }
}