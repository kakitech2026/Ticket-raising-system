import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson } from "@/lib/api";
import { email, password, title } from "@/lib/validation";
import { allowAttempt } from "@/lib/rate-limit";
const schema = z.object({ name: title, email, password, departmentId: z.string().trim().max(80).optional() }).strict();
export async function POST(req: Request) {
  try {
    const data = await readJson(req, schema);
    if (!await allowAttempt("signup:" + data.email, 3) || !await allowAttempt("signup:global", 100, 3600000)) throw new ApiError(429, "Too many registration attempts. Try again later.");
    const existing = await prisma.user.findFirst({ where: { email: { equals: data.email, mode: "insensitive" } }, select: { id: true } });
    if (existing) throw new ApiError(409, "Unable to register this email. Try signing in or contact your administrator.");
    const user = await prisma.user.create({ data: { ...data, password: await bcrypt.hash(data.password, 12), role: "EMPLOYEE" }, select: { id: true } });
    return NextResponse.json({ message: "Account created", user }, { status: 201 });
  } catch (error) { return apiError(error); }
}
