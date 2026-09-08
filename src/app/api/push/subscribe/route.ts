import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson, requireUser } from "@/lib/api";
const endpoint = z.url().max(2048).refine(value => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443") && /(^|\.)(fcm\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com|web\.push\.apple\.com)$/.test(url.hostname);
}, "Unsupported push service");
export async function POST(req: Request) {
  try {
    const actor = await requireUser();
    const data = await readJson(req, z.object({ endpoint, keys: z.object({ p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}=?$/), auth: z.string().regex(/^[A-Za-z0-9_-]{22}={0,2}$/) }), expirationTime: z.number().nullable().optional() }));
    const count = await prisma.pushSubscription.count({ where: { userId: actor.id } });
    if (count >= 10 && !await prisma.pushSubscription.findUnique({ where: { endpoint: data.endpoint } })) throw new ApiError(400, "Too many subscribed devices");
    await prisma.pushSubscription.upsert({ where: { endpoint: data.endpoint }, update: { userId: actor.id, ...data.keys }, create: { userId: actor.id, endpoint: data.endpoint, ...data.keys } });
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error); }
}
export async function DELETE(req: Request) {
  try {
    const actor = await requireUser(), data = await readJson(req, z.object({ endpoint: z.string().max(2048).optional() }));
    await prisma.pushSubscription.deleteMany({ where: { userId: actor.id, ...(data.endpoint ? { endpoint: data.endpoint } : {}) } });
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error); }
}