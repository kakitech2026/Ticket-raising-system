import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, requireUser } from "@/lib/api";
import { userSelect } from "@/lib/policy";
type Context = { params: Promise<{ id: string }> };
export async function GET(_req: Request, { params }: Context) {
  try {
    const actor = await requireUser(), { id } = await params;
    if (actor.id !== id && actor.role !== "ADMIN") throw new ApiError(403, "This profile is private");
    const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new ApiError(404, "User not found");
    return NextResponse.json(user);
  } catch (error) { return apiError(error); }
}
export async function DELETE(_req: Request, { params }: Context) {
  try {
    const actor = await requireUser(), { id } = await params;
    if (actor.role !== "ADMIN") throw new ApiError(403, "Only admins can deactivate accounts");
    if (actor.id === id) throw new ApiError(400, "You cannot deactivate your own account");
    await prisma.$transaction(async tx => {
      const changed = await tx.user.updateMany({ where: { id, isActive: true }, data: { isActive: false, sessionVersion: { increment: 1 } } });
      if (!changed.count) throw new ApiError(404, "Active user not found");
      await tx.pushSubscription.deleteMany({ where: { userId: id } });
      await tx.passwordReset.deleteMany({ where: { userId: id } });
      // Open work returns to the queue. Completed history and authorship remain intact.
      await tx.ticket.updateMany({ where: { assigneeId: id, status: { notIn: ["COMPLETED", "REJECTED"] } }, data: { assigneeId: null, version: { increment: 1 } } });
    });
    return NextResponse.json({ success: true, message: "Account deactivated. History retained." });
  } catch (error) { return apiError(error); }
}