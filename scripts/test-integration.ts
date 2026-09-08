import "dotenv/config";
import { Pool } from "pg";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for isolated integration tests");
  const schema = "tickety_test_" + randomBytes(6).toString("hex");
  if (!/^tickety_test_[a-f0-9]{12}$/.test(schema)) throw new Error("Invalid test schema");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const connection = await pool.connect();
  let app: Awaited<typeof import("../src/lib/prisma")> | undefined;
  let passed = 0;
  async function check(name: string, run: () => Promise<void>) { await run(); passed++; console.log("PASS " + name); }
  try {
    await connection.query(`CREATE SCHEMA "${schema}"`);
    await connection.query(`SET search_path TO "${schema}"`);
    await connection.query(await readFile("prisma/migrations/202609080001_baseline/migration.sql", "utf8"));
    await connection.query(`INSERT INTO "User" (id,email,password,name,role) VALUES ('employee','employee@example.test','unused','Employee','EMPLOYEE'), ('tech','tech@example.test','unused','Same Name','TECH'), ('tech2','tech2@example.test','unused','Same Name','TECH'), ('admin','admin@example.test','unused','Admin','ADMIN'), ('other','other@example.test','unused','Other','EMPLOYEE')`);
    await connection.query(`INSERT INTO "Ticket" (id,title,description,department,"creatorId","assigneeId",status,"createdAt","updatedAt") VALUES ('old','Existing completed ticket','Keep this history','IT','employee','tech','COMPLETED',CURRENT_TIMESTAMP - INTERVAL '10 days',CURRENT_TIMESTAMP - INTERVAL '2 days')`);
    await connection.query(`INSERT INTO "Article" (id,title,content,"authorId","updatedAt") VALUES ('old-article','Existing article','Keep content','tech',CURRENT_TIMESTAMP)`);
    await connection.query(await readFile("prisma/migrations/202609080002_access_workflow_sla/migration.sql", "utf8"));
    process.env.DATABASE_SCHEMA = schema;
    app = await import("../src/lib/prisma");
    const { prisma } = app;
    const { createTicket, transitionTicket, claimTicket } = await import("../src/lib/tickets");
    const { createTicketSchema, transitionSchema } = await import("../src/lib/validation");
    const { ticketWhere, articleWhere } = await import("../src/lib/policy");
    const employee = { id: "employee", role: "EMPLOYEE" as const }, tech = { id: "tech", role: "TECH" as const };
    const create = (overrides = {}) => createTicketSchema.parse({ title: "Test ticket", description: "Description", department: "IT", assigneeId: "tech", requestKey: randomUUID(), ...overrides });
    const transition = (status: string, version: number, extra = {}) => transitionSchema.parse({ status, version, ...extra });
    await check("populated migration preserves tickets, article assignment and SLA history", async () => {
      assert.equal((await prisma.ticket.findUniqueOrThrow({ where: { id: "old" } })).title, "Existing completed ticket");
      assert.equal((await prisma.article.findUniqueOrThrow({ where: { id: "old-article" } })).assigneeId, "tech");
      assert.equal(await prisma.ticketSlaCycle.count({ where: { ticketId: "old", outcome: "COMPLETED" } }), 1);
    });
    const data = create(); const ticket = await createTicket(employee, data);
    await check("retrying creation with the same key returns one ticket", async () => { assert.equal((await createTicket(employee, data)).id, ticket.id); assert.equal(await prisma.ticket.count({ where: { requestKey: data.requestKey } }), 1); });
    await check("unrelated employee cannot read or transition ticket", async () => {
      const actor = { id: "other", role: "EMPLOYEE" as const };
      assert.equal(await prisma.ticket.count({ where: { AND: [{ id: ticket.id }, ticketWhere(actor)] } }), 0);
      await assert.rejects(transitionTicket(actor, ticket.id, transition("COMPLETED", 0, { resolutionSummary: "Forged" })));
    });
    await check("assigned technician reviews and rejects with a reason", async () => {
      await transitionTicket(tech, ticket.id, transition("IN_REVIEW", 0));
      await assert.rejects(transitionTicket(tech, ticket.id, transition("REJECTED", 1)));
      await transitionTicket(tech, ticket.id, transition("REJECTED", 1, { reason: "More information required" }));
      assert.equal(await prisma.ticketSlaCycle.count({ where: { ticketId: ticket.id, outcome: "REJECTED" } }), 1);
    });
    await check("creator reopens rejection with a fresh SLA cycle", async () => {
      await transitionTicket(employee, ticket.id, transition("RE_REVIEW", 2, { reason: "Here are the missing details" }));
      assert.equal(await prisma.ticketSlaCycle.count({ where: { ticketId: ticket.id } }), 2);
      assert.equal(await prisma.ticketSlaCycle.count({ where: { ticketId: ticket.id, endedAt: null } }), 1);
    });
    await check("acceptance estimate does not change SLA deadline", async () => {
      const before = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      await transitionTicket(tech, ticket.id, transition("ACCEPTED", 3, { dueDate: new Date(Date.now() + 10 * 86400000).toISOString() }));
      const after = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      assert.equal(before.slaDueAt.getTime(), after.slaDueAt.getTime());
      assert.notEqual(after.slaDueAt.getTime(), after.dueDate?.getTime());
    });
    await check("stale versions fail without changing state", async () => {
      await assert.rejects(transitionTicket(tech, ticket.id, transition("IN_PROGRESS", 0)));
      assert.equal((await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } })).status, "ACCEPTED");
    });
    await check("active re-review preserves the clock; assigned person records completion", async () => {
      await transitionTicket(tech, ticket.id, transition("IN_PROGRESS", 4));
      const before = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      await transitionTicket(employee, ticket.id, transition("RE_REVIEW", 5, { reason: "Clarify active work" }));
      const after = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      assert.equal(before.slaDueAt.getTime(), after.slaDueAt.getTime());
      assert.equal(await prisma.ticketSlaCycle.count({ where: { ticketId: ticket.id } }), 2);
      await transitionTicket(tech, ticket.id, transition("ACCEPTED", 6, { dueDate: new Date(Date.now() + 86400000).toISOString() }));
      await transitionTicket(tech, ticket.id, transition("IN_PROGRESS", 7));
      await transitionTicket(tech, ticket.id, transition("COMPLETED", 8, { resolutionSummary: "Configuration corrected and verified" }));
      assert.equal(await prisma.ticketSlaCycle.count({ where: { ticketId: ticket.id, outcome: "COMPLETED" } }), 1);
    });
    await check("simultaneous claims have one winner", async () => {
      const t = await createTicket(employee, create({ assigneeId: undefined }));
      const results = await Promise.allSettled([claimTicket(tech, t.id, 0), claimTicket({ id: "tech2", role: "TECH" }, t.id, 0)]);
      assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    });
    await check("notification insertion failure rolls back ticket creation", async () => {
      await connection.query(`ALTER TABLE "Notification" ADD CONSTRAINT test_failure CHECK (message NOT LIKE '%force-failure%')`);
      const data = create({ title: "force-failure" });
      await assert.rejects(createTicket(employee, data));
      assert.equal(await prisma.ticket.count({ where: { requestKey: data.requestKey } }), 0);
      await connection.query(`ALTER TABLE "Notification" DROP CONSTRAINT test_failure`);
    });
    await check("restricted article reads exclude unrelated staff and employees", async () => {
      assert.equal(await prisma.article.count({ where: articleWhere(employee) }), 0);
      assert.equal(await prisma.article.count({ where: articleWhere({ id: "tech2", role: "TECH" }) }), 0);
      assert.equal(await prisma.article.count({ where: articleWhere(tech) }), 1);
    });
    await check("project selection requires creator and technician membership", async () => {
      const p = await prisma.project.create({ data: { name: "Private", description: "Private project", ownerId: "other" } });
      await assert.rejects(createTicket(employee, create({ projectId: p.id })));
      await prisma.project.update({ where: { id: p.id }, data: { members: { connect: [{ id: "employee" }, { id: "tech" }] } } });
      assert.ok((await createTicket(employee, create({ projectId: p.id }))).id);
    });
    await check("analytics executes against migrated data without merging names", async () => {
      const { analytics } = await import("../src/lib/reporting");
      const report = await analytics({ id: "admin", role: "ADMIN" });
      assert.ok(report.summary.resolved >= 2); assert.equal(report.ticketsOverTime.length, 30);
    });
    console.log(`${passed} integration checks passed in an isolated schema. Existing records were not used.`);
  } finally {
    if (app) await app.prisma.$disconnect();
    await connection.query("ROLLBACK").catch(() => undefined);
    await connection.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    connection.release(); await pool.end();
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Integration test failed"); process.exitCode = 1; });
