import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { ticketWhere, type Actor } from "./policy";
export async function analytics(actor: Actor) {
  const since=new Date();since.setUTCDate(since.getUTCDate()-29);since.setUTCHours(0,0,0,0);
  const visible=actor.role==="ADMIN"?Prisma.sql`TRUE`:Prisma.sql`
    (t."creatorId"=${actor.id} OR t."assigneeId"=${actor.id})
    AND (t."projectId" IS NULL OR EXISTS (SELECT 1 FROM "Project" p WHERE p.id=t."projectId" AND (p."ownerId"=${actor.id} OR EXISTS (SELECT 1 FROM "_ProjectMembers" pm WHERE pm."A"=p.id AND pm."B"=${actor.id}))))`;
  const [summary,performance,series,departments]=await Promise.all([
    prisma.$queryRaw<{resolved:number;breached:number;closed:number;average:number|null}[]>(Prisma.sql`SELECT COUNT(*) FILTER(WHERE c.outcome='COMPLETED')::int AS resolved, COUNT(*) FILTER(WHERE c."endedAt">c."dueAt")::int AS breached, COUNT(*)::int AS closed, AVG(EXTRACT(EPOCH FROM (c."endedAt"-c."startedAt"))/3600) FILTER(WHERE c.outcome='COMPLETED')::float AS average FROM "TicketSlaCycle" c JOIN "Ticket" t ON t.id=c."ticketId" WHERE ${visible} AND c."endedAt">=${since}`),
    prisma.$queryRaw<{id:string;name:string;resolved:number}[]>(Prisma.sql`SELECT u.id,u.name,COUNT(*)::int AS resolved FROM "TicketSlaCycle" c JOIN "Ticket" t ON t.id=c."ticketId" JOIN "User" u ON u.id=c."assigneeId" WHERE ${visible} AND c.outcome='COMPLETED' AND c."endedAt">=${since} GROUP BY u.id,u.name ORDER BY resolved DESC`),
    prisma.$queryRaw<{date:string;created:number;resolved:number}[]>(Prisma.sql`SELECT day::date::text AS date, SUM(created)::int AS created, SUM(resolved)::int AS resolved FROM (SELECT date_trunc('day',t."createdAt") AS day, COUNT(*)::int AS created,0 AS resolved FROM "Ticket" t WHERE ${visible} AND t."createdAt">=${since} GROUP BY day UNION ALL SELECT date_trunc('day',c."endedAt") AS day,0 AS created,COUNT(*)::int AS resolved FROM "TicketSlaCycle" c JOIN "Ticket" t ON t.id=c."ticketId" WHERE ${visible} AND c.outcome='COMPLETED' AND c."endedAt">=${since} GROUP BY day) events GROUP BY day ORDER BY day`),
    prisma.ticket.groupBy({by:["department"],where:{AND:[ticketWhere(actor),{createdAt:{gte:since}},...(actor.role==="TECH"?[{OR:[{creatorId:actor.id},{assigneeId:actor.id}]}]:[])]},_count:true}),
  ]);
  const days=Array.from({length:30},(_,i)=>{const d=new Date(since);d.setUTCDate(d.getUTCDate()+i);const date=d.toISOString().slice(0,10);return series.find(r=>r.date===date)??{date,created:0,resolved:0};});
  return {summary:summary[0],techPerformance:performance.map(p=>({name:p.name+" ("+p.id.slice(-5)+")",resolved:p.resolved})),ticketsOverTime:days,ticketsByDepartment:departments.map(d=>({name:d.department,value:d._count}))};
}