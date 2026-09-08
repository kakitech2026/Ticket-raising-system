import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, requireUser } from "@/lib/api";
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser(); if (actor.role !== "ADMIN") throw new ApiError(403, "Only admins can issue reset links");
    const { id } = await params;
    const token = randomBytes(32).toString("hex");
    await prisma.$transaction(async tx => {
      await tx.user.update({ where: { id, isActive: true }, data: { sessionVersion: { increment: 1 } } });
      await tx.pushSubscription.deleteMany({ where: { userId: id } });
      await tx.passwordReset.deleteMany({ where: { userId: id } });
      await tx.passwordReset.create({ data: { userId: id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600000) } });
    });
    return NextResponse.json({ path: "/reset-password#token=" + token, expiresInMinutes: 60 }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}