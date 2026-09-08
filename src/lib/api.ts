import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new ApiError(401, "Please sign in again");
  return session.user;
}
export async function readJson<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ApiError(415, "Use application/json");
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError(400, "Missing request body");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 4500000) { await reader.cancel(); throw new ApiError(413, "Request too large. Use at most three images, each under 1 MB."); }
    chunks.push(value);
  }
  let body: unknown;
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new ApiError(400, "Invalid JSON"); }
  return schema.parse(body);
}
export function apiError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") return NextResponse.json({ error: "Not found or no longer available" }, { status: 404 });
    if (["P2002", "P2034"].includes(error.code)) return NextResponse.json({ error: "This request conflicts with another change. Refresh and try again." }, { status: 409 });
    if (error.code === "P2003") return NextResponse.json({ error: "A related record is not available" }, { status: 400 });
  }
  console.error("Request failed", error instanceof Error ? error.name : "Unknown error");
  return NextResponse.json({ error: "Unable to save this change. Please try again." }, { status: 500 });
}
