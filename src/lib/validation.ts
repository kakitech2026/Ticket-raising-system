import { z } from "zod";
export const id = z.string().min(1).max(100);
export const title = z.string().trim().min(1, "This field is required").max(160);
export const content = z.string().trim().min(1, "This field is required").max(20000);
export const password = z.string().min(12, "Use at least 12 characters").max(72, "Use at most 72 characters").refine(v => new TextEncoder().encode(v).length <= 72, "Password must be at most 72 UTF-8 bytes");
export const email = z.email().trim().toLowerCase().max(254);
export const priority = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const status = z.enum(["NEEDS_APPROVAL", "IN_REVIEW", "ACCEPTED", "IN_PROGRESS", "RE_REVIEW", "REJECTED", "COMPLETED"]);
export const date = z.iso.datetime({ offset: true }).transform(v => new Date(v));
export const images = z.array(z.string().max(1400000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/, "Use PNG, JPEG or WebP images up to 1 MB")).max(3).default([]);
export const createTicketSchema = z.object({ title, description: content, priority: priority.default("MEDIUM"), department: z.enum(["IT", "HR", "FACILITIES", "FINANCE"]), assigneeId: id.optional(), projectId: id.optional(), images, requestKey: z.uuid() });
export const transitionSchema = z.object({ status, version: z.number().int().nonnegative(), reason: content.optional(), dueDate: date.optional(), images, resolutionSummary: content.optional() }).strict();
export const projectSchema = z.object({ name: title, description: content, startDate: date.nullish(), endDate: date.nullish(), status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"]).default("PLANNING"), members: z.array(id).max(100).default([]) });
export const articleSchema = z.object({ title, content, assigneeId: id.optional(), sourceTicketId: id.optional() }).strict();
export const filterSchema = z.object({ q: z.string().trim().max(160).optional(), status: status.optional(), priority: priority.optional(), department: z.string().max(50).optional(), queue: z.enum(["unassigned"]).optional(), view: z.enum(["active", "completed", "all"]).optional(), page: z.coerce.number().int().min(1).max(100000).default(1) });

