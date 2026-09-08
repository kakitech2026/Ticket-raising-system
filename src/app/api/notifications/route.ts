import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson, requireUser } from "@/lib/api";
import { ticketWhere } from "@/lib/policy";
export async function GET(req: Request) {
  try {
    const actor = await requireUser(), page = Math.max(1, Number(new URL(req.url).searchParams.get("page")) || 1);
    const where = { userId: actor.id, OR: [{ ticketId: null }, { ticket: ticketWhere(actor) }] };
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 20, take: 20 }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) { return apiError(error); }
}
export async function PATCH(req: Request) {
  try {
    const actor = await requireUser(),
      data = await readJson(
        req,
        z
          .object({
            id: z.string().optional(),
            ticketId: z.string().optional(),
            markAll: z.boolean().optional(),
          })
          .strict()
      );
    if (!data.markAll && !data.id && !data.ticketId)
      throw new ApiError(400, "Select a notification or ticket");
    await prisma.notification.updateMany({
      where: {
        userId: actor.id,
        ...(data.markAll
          ? {}
          : data.ticketId
          ? { ticketId: data.ticketId }
          : { id: data.id }),
      },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}