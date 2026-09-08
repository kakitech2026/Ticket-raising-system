import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, readJson, requireUser } from "@/lib/api";
import { projectWhere, staffSelect } from "@/lib/policy";
import { projectSchema } from "@/lib/validation";
export async function GET(req: Request) {
  try {
    const actor = await requireUser();
    const page = Math.max(1, Number(new URL(req.url).searchParams.get("page")) || 1);
    const projects = await prisma.project.findMany({ where: projectWhere(actor), orderBy: { createdAt: "desc" }, take: 50, skip: (page - 1) * 50, select: { id: true, name: true, status: true, ownerId: true } });
    return NextResponse.json(projects);
  } catch (error) { return apiError(error); }
}
export async function POST(req: Request) {
  try {
    const actor = await requireUser(), data = await readJson(req, projectSchema);
    if (data.startDate && data.endDate && data.startDate > data.endDate) throw new ApiError(400, "End date must follow start date");
    const ids = [...new Set([...data.members, actor.id])];
    if (await prisma.user.count({ where: { id: { in: ids }, isActive: true } }) !== ids.length) throw new ApiError(400, "Select active project members");
    const project = await prisma.project.create({ data: { ...data, ownerId: actor.id, members: { connect: ids.map(id => ({ id })) } }, include: { owner: { select: staffSelect }, members: { select: staffSelect } } });
    return NextResponse.json(project, { status: 201 });
  } catch (error) { return apiError(error); }
}