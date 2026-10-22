-- Make lead details the source of truth and attach every task to exactly one lead.
ALTER TABLE "Lead"
  ADD COLUMN "industry" TEXT,
  ADD COLUMN "winProbability" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextAction" TEXT,
  ADD COLUMN "lastContactAt" TIMESTAMP(3),
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "SalesTask" ADD COLUMN "leadId" UUID;

UPDATE "SalesTask" AS task
SET "leadId" = relation."leadId"
FROM (
  SELECT "taskId", MIN("leadId"::text)::uuid AS "leadId"
  FROM "SalesTaskLead"
  GROUP BY "taskId"
) AS relation
WHERE relation."taskId" = task."id";

-- Preserve legacy orphan tasks by assigning them to a clearly labelled migration lead.
INSERT INTO "Lead" (
  "id", "firstName", "lastName", "status", "score", "estimatedDealValue",
  "notes", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-4000-8000-000000000099'::uuid,
  'Legacy',
  'Tasks',
  'NEW',
  0,
  0,
  'Automatically created while migrating legacy tasks to lead ownership.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "SalesTask" WHERE "leadId" IS NULL)
ON CONFLICT ("id") DO NOTHING;

UPDATE "SalesTask"
SET "leadId" = '00000000-0000-4000-8000-000000000099'::uuid
WHERE "leadId" IS NULL;

ALTER TABLE "SalesTask" ALTER COLUMN "leadId" SET NOT NULL;
CREATE INDEX "SalesTask_leadId_idx" ON "SalesTask"("leadId");
ALTER TABLE "SalesTask"
  ADD CONSTRAINT "SalesTask_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove the retired Contacts/conversion feature from the application schema while
-- preserving historical data for a deliberate, separately approved retention decision.
CREATE SCHEMA IF NOT EXISTS "archive";
ALTER TABLE "SalesTaskContact" SET SCHEMA "archive";
ALTER TABLE "SalesTaskLead" SET SCHEMA "archive";
ALTER TABLE "ContactActivity" SET SCHEMA "archive";
ALTER TABLE "LeadConversion" SET SCHEMA "archive";
ALTER TABLE "SalesContact" SET SCHEMA "archive";

-- These retired columns remain physically present for recoverability. Prisma and the API
-- no longer expose them, so they are not part of the active backend model.

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_winProbability_range_check"
  CHECK ("winProbability" >= 0 AND "winProbability" <= 100);
