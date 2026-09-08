import test from "node:test";
import assert from "node:assert/strict";
import { canTransition, articleWhere, projectWhere } from "../src/lib/policy";
import { calculateSLADeadline, cycleBreached, getSLAStatus } from "../src/lib/sla";
import { createTicketSchema, password, transitionSchema } from "../src/lib/validation";
import { csvCell } from "../src/lib/csv";
const employee = { id: "creator", role: "EMPLOYEE" as const };
const tech = { id: "tech", role: "TECH" as const };
const admin = { id: "admin", role: "ADMIN" as const };
test("creator can request re-review of rejected and completed tickets", () => {
  for (const status of ["REJECTED", "COMPLETED"] as const) assert.equal(canTransition(employee, { creatorId: "creator", assigneeId: "tech", status }, "RE_REVIEW"), true);
});
test("unrelated employee cannot reopen; employee cannot complete", () => {
  assert.equal(canTransition({ ...employee, id: "other" }, { creatorId: "creator", assigneeId: "tech", status: "REJECTED" }, "RE_REVIEW"), false);
  assert.equal(canTransition(employee, { creatorId: "creator", assigneeId: "tech", status: "IN_PROGRESS" }, "COMPLETED"), false);
});
test("only assigned person completes, including when actor is admin", () => {
  const ticket = { creatorId: "creator", assigneeId: "tech", status: "IN_PROGRESS" as const };
  assert.equal(canTransition(tech, ticket, "COMPLETED"), true);
  assert.equal(canTransition(admin, ticket, "COMPLETED"), false);
});
test("cannot jump directly from review to completion", () => assert.equal(canTransition(tech, { creatorId: "creator", assigneeId: "tech", status: "IN_REVIEW" }, "COMPLETED"), false));
test("KB reader scope is assigned user; admin scope is unrestricted", () => { assert.deepEqual(articleWhere(tech), { assigneeId: "tech" }); assert.deepEqual(articleWhere(admin), {}); });
test("projects use owner or member scope", () => assert.deepEqual(projectWhere(employee), { OR: [{ ownerId: "creator" }, { members: { some: { id: "creator" } } }] }));
test("priority deadlines and review clock are continuous", () => {
  const start = new Date("2026-09-01T00:00:00Z"), due = calculateSLADeadline(start, "HIGH");
  assert.equal(due.toISOString(), "2026-09-02T00:00:00.000Z");
  assert.equal(getSLAStatus(start, "HIGH", false, due, false, due.getTime() + 1), "BREACHED");
});
test("historical breach remains after completion or rejection", () => assert.equal(cycleBreached({ dueAt: "2026-09-01T00:00:00Z", endedAt: "2026-09-02T00:00:00Z" }), true));
test("valid creation defaults priority before SLA calculation", () => assert.equal(createTicketSchema.parse({ title: "A", description: "B", department: "IT", requestKey: "123e4567-e89b-42d3-a456-426614174000" }).priority, "MEDIUM"));
test("invalid statuses, date values, and forged assignee changes are rejected", () => {
  assert.equal(transitionSchema.safeParse({ status: "INVALID", version: 0 }).success, false);
  assert.equal(transitionSchema.safeParse({ status: "ACCEPTED", version: 0, dueDate: "tomorrow" }).success, false);
  assert.equal(transitionSchema.safeParse({ status: "ACCEPTED", version: 0, assigneeId: "attacker" }).success, false);
});
test("password policy considers UTF-8 bytes", () => { assert.equal(password.safeParse("short").success, false); assert.equal(password.safeParse("😀".repeat(20)).success, false); });
test("CSV escapes every quote and neutralizes formulas", () => {
  assert.equal(csvCell('A "quoted", name'), '"A ""quoted"", name"');
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  assert.equal(csvCell("  @SUM(A1)"), '"\'  @SUM(A1)"');
});
