import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch staff that can be assigned tickets
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["TECH", "MANAGER", "ADMIN", "TESTER"]
        }
      },
      select: {
        id: true,
        name: true,
        role: true,
        email: true
      },
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
