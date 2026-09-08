import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson } from "@/lib/api";
import { password, email } from "@/lib/validation";
import { allowAttempt } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

const requestSchema = z.object({ email }).strict();
const executeSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/),
    password,
  })
  .strict();

export async function POST(req: Request) {
  try {
    const body = await req.clone().json().catch(() => ({}));

    // If body contains email, this is a reset link request
    if ("email" in body) {
      const data = await readJson(req, requestSchema);
      if (
        !(await allowAttempt("pwd-reset-req:" + data.email, 3, 900000)) ||
        !(await allowAttempt("pwd-reset-global", 100, 3600000))
      ) {
        throw new ApiError(429, "Too many reset attempts. Please try again later.");
      }

      const user = await prisma.user.findFirst({
        where: { email: { equals: data.email, mode: "insensitive" }, isActive: true },
        select: { id: true, email: true, name: true },
      });

      if (user) {
        const token = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        await prisma.$transaction(async (tx) => {
          await tx.passwordReset.deleteMany({ where: { userId: user.id } });
          await tx.passwordReset.create({
            data: {
              userId: user.id,
              tokenHash,
              expiresAt,
            },
          });
        });

        const baseUrl =
          process.env.NEXTAUTH_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        const resetUrl = `${baseUrl}/reset-password#token=${token}`;

        await sendPasswordResetEmail({
          to: user.email,
          recipientName: user.name,
          resetUrl,
        });
      }

      // Always return a generic success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message:
          "If an account with this email exists, a reset link has been sent. Check your inbox.",
      });
    }

    // Otherwise, this is the token execution
    const data = await readJson(req, executeSchema);
    if (!(await allowAttempt("reset:" + data.token, 5))) {
      throw new ApiError(429, "Too many attempts");
    }

    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const hashed = await bcrypt.hash(data.password, 12);

    await prisma.$transaction(async (tx) => {
      const reset = await tx.passwordReset.findUnique({ where: { tokenHash } });
      if (!reset || reset.expiresAt <= new Date()) {
        throw new ApiError(400, "Reset link expired or invalid. Request a new one.");
      }
      const consumed = await tx.passwordReset.deleteMany({
        where: { tokenHash, expiresAt: { gt: new Date() } },
      });
      if (!consumed.count) throw new ApiError(409, "Reset link already used");
      await tx.user.update({
        where: { id: reset.userId, isActive: true },
        data: { password: hashed, sessionVersion: { increment: 1 } },
      });
      await tx.passwordReset.deleteMany({ where: { userId: reset.userId } });
      await tx.pushSubscription.deleteMany({ where: { userId: reset.userId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}