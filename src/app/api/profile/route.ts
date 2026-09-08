import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson, requireUser } from "@/lib/api";
import { password, title } from "@/lib/validation";
import { userSelect } from "@/lib/policy";
export async function PATCH(req: Request) {
  try {
    const actor = await requireUser();
    const data = await readJson(req, z.object({ name: title, departmentId: z.string().trim().max(80).nullable().optional(), currentPassword: z.string().max(72).optional(), newPassword: password.optional() }).strict());
    if (data.newPassword && !data.currentPassword) throw new ApiError(400, "Enter your current password");
    const account = await prisma.user.findUniqueOrThrow({ where: { id: actor.id } });
    if (data.newPassword && !await bcrypt.compare(data.currentPassword!, account.password)) throw new ApiError(400, "Current password is incorrect");
    const user = await prisma.user.update({ where: { id: actor.id, sessionVersion: account.sessionVersion, isActive: true }, data: { name: data.name, departmentId: data.departmentId || null, ...(data.newPassword ? { password: await bcrypt.hash(data.newPassword, 12), sessionVersion: { increment: 1 } } : {}) }, select: userSelect });
    if (data.newPassword) await prisma.pushSubscription.deleteMany({ where: { userId: actor.id } });
    return NextResponse.json({ ...user, signInRequired: !!data.newPassword });
  } catch (error) { return apiError(error); }
}