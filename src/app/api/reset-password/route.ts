import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson } from "@/lib/api";
import { password } from "@/lib/validation";
import { allowAttempt } from "@/lib/rate-limit";
export async function POST(req: Request) {
  try {
    const data = await readJson(req, z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password }).strict());
    if (!await allowAttempt("reset:" + data.token, 5)) throw new ApiError(429, "Too many attempts");
    const tokenHash = createHash("sha256").update(data.token).digest("hex"), hashed = await bcrypt.hash(data.password, 12);
    await prisma.$transaction(async tx => {
      const reset = await tx.passwordReset.findUnique({ where: { tokenHash } });
      if (!reset || reset.expiresAt <= new Date()) throw new ApiError(400, "Reset link expired or invalid. Contact your admin.");
      const consumed = await tx.passwordReset.deleteMany({ where: { tokenHash, expiresAt: { gt: new Date() } } });
      if (!consumed.count) throw new ApiError(409, "Reset link already used");
      await tx.user.update({ where: { id: reset.userId, isActive: true }, data: { password: hashed, sessionVersion: { increment: 1 } } });
      await tx.passwordReset.deleteMany({ where: { userId: reset.userId } });
      await tx.pushSubscription.deleteMany({ where: { userId: reset.userId } });
    });
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error); }
}