import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["TECH", "ADMIN"] } }
  });
  return NextResponse.json(users);
}
