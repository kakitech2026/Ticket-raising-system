import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Since deleting a user might violate foreign key constraints (e.g., tickets they created or were assigned to, comments they made),
    // we need to handle this. In Prisma, this is typically handled via `onDelete: Cascade` in schema.
    // Let's assume Prisma schema has `onDelete: Cascade` or we just delete them. If it throws an error due to relations,
    // we should catch it and return a friendly error.

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    // Handle Prisma relation violation error
    if (
      error.code === 'P2003' ||
      error.code === 'P2039' ||
      (error.message && error.message.includes("foreign key constraint")) ||
      (error.message && error.message.includes("Foreign key constraint failed"))
    ) {
      return NextResponse.json(
        { error: "Cannot delete this user because they are associated with existing tickets or comments." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message, code: error.code },
      { status: 500 }
    );
  }
}
