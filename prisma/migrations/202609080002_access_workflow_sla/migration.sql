BEGIN;
-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_authorId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "requestKey" TEXT,
ADD COLUMN     "resolutionSummary" TEXT,
ADD COLUMN     "slaDueAt" TIMESTAMP(3),
ADD COLUMN     "slaStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "requestKey" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "pushAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pushNextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pushSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "sourceTicketId" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TicketSlaCycle" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "outcome" "TicketStatus",
    "assigneeId" TEXT,

    CONSTRAINT "TicketSlaCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateIndex
CREATE INDEX "TicketSlaCycle_ticketId_startedAt_idx" ON "TicketSlaCycle"("ticketId", "startedAt");

-- CreateIndex
CREATE INDEX "TicketSlaCycle_endedAt_outcome_idx" ON "TicketSlaCycle"("endedAt", "outcome");

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_requestKey_key" ON "Ticket"("requestKey");

-- CreateIndex
CREATE INDEX "Ticket_creatorId_createdAt_idx" ON "Ticket"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_assigneeId_status_createdAt_idx" ON "Ticket"("assigneeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_projectId_createdAt_idx" ON "Ticket"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_status_slaDueAt_idx" ON "Ticket"("status", "slaDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_requestKey_key" ON "Comment"("requestKey");

-- CreateIndex
CREATE INDEX "Comment_ticketId_createdAt_idx" ON "Comment"("ticketId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_pushSentAt_pushNextAttemptAt_idx" ON "Notification"("pushSentAt", "pushNextAttemptAt");

-- CreateIndex
CREATE INDEX "Article_assigneeId_updatedAt_idx" ON "Article"("assigneeId", "updatedAt");

-- CreateIndex
CREATE INDEX "Project_ownerId_createdAt_idx" ON "Project"("ownerId", "createdAt");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_sourceTicketId_fkey" FOREIGN KEY ("sourceTicketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketSlaCycle" ADD CONSTRAINT "TicketSlaCycle_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve existing records. Historical completion time is reconstructed from the latest available status event, then updatedAt as a fallback.
UPDATE "Ticket" SET "slaStartedAt" = "createdAt", "slaDueAt" = "createdAt" + CASE "priority" WHEN 'CRITICAL' THEN INTERVAL '4 hours' WHEN 'HIGH' THEN INTERVAL '24 hours' WHEN 'MEDIUM' THEN INTERVAL '72 hours' ELSE INTERVAL '168 hours' END;
UPDATE "Ticket" t SET "completedAt" = COALESCE((SELECT MAX(e."createdAt") FROM "TimelineEvent" e WHERE e."ticketId" = t.id AND e.action LIKE '%COMPLETED%'), t."updatedAt") WHERE t.status = 'COMPLETED';
UPDATE "Ticket" SET status = 'ACCEPTED' WHERE status = 'APPROVED';
UPDATE "Ticket" SET status = 'IN_PROGRESS' WHERE status = 'IN_TESTING';
INSERT INTO "TicketSlaCycle" (id, "ticketId", "startedAt", "dueAt", "endedAt", outcome, "assigneeId") SELECT 'baseline-' || id, id, "createdAt", "slaDueAt", CASE WHEN status = 'COMPLETED' THEN "completedAt" WHEN status = 'REJECTED' THEN "updatedAt" ELSE NULL END, CASE WHEN status IN ('COMPLETED','REJECTED') THEN status ELSE NULL END, "assigneeId" FROM "Ticket";
UPDATE "Article" SET "assigneeId" = "authorId";
UPDATE "Notification" SET "pushSentAt" = CURRENT_TIMESTAMP;
ALTER TABLE "Ticket" ALTER COLUMN "slaDueAt" SET NOT NULL;
ALTER TABLE "Article" ALTER COLUMN "assigneeId" SET NOT NULL;

COMMIT;
