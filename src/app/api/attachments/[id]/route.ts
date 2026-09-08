import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, requireUser } from "@/lib/api";
import { ticketWhere } from "@/lib/policy";
import { decodeImage } from "@/lib/attachments";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const image = await prisma.image.findFirst({ where: { id: (await params).id, ticket: ticketWhere(user) }, select: { url: true } });
    if (!image) throw new ApiError(404, "Image not found");
    const { mime, bytes } = decodeImage(image.url);
    return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return apiError(error); }
}
