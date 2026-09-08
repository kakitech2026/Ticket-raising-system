import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson, requireUser } from "@/lib/api";
import { email, password, title } from "@/lib/validation";
import { staffSelect, userSelect } from "@/lib/policy";
export async function GET(req: Request) {
  try {
    await requireUser();
    const url = new URL(req.url), q = (url.searchParams.get("q") ?? "").slice(0, 80);
    const directory = url.searchParams.get("directory") === "members";
    return NextResponse.json(await prisma.user.findMany({ where: { isActive: true, ...(directory ? {} : { role: { in: ["TECH", "ADMIN"] } }), ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) }, select: staffSelect, take: 100, orderBy: { name: "asc" } }));
  } catch (error) { return apiError(error); }
}
export async function POST(req: Request) {
  try {
    const actor = await requireUser(); if (actor.role !== "ADMIN") throw new ApiError(403, "Only admins can provision staff");
    const data = await readJson(req, z.object({ name: title, email, password, role: z.enum(["EMPLOYEE", "TECH", "ADMIN"]), departmentId: z.string().trim().max(80).optional() }).strict());
    if (await prisma.user.findFirst({ where: { email: { equals: data.email, mode: "insensitive" } } })) throw new ApiError(409, "Email already registered");
    return NextResponse.json(await prisma.user.create({ data: { ...data, password: await bcrypt.hash(data.password, 12) }, select: userSelect }), { status: 201 });
  } catch (error) { return apiError(error); }
}