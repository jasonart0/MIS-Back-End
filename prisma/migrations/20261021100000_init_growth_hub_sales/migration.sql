-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "position" TEXT,
    "source" TEXT,
    "ownerId" UUID,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "conversionStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "score" INTEGER,
    "estimatedDealValue" DECIMAL(12,2),
    "notes" TEXT,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadConversion" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "resultingContactId" UUID,
    "conversionStatus" TEXT NOT NULL,
    "approvedById" UUID,
    "convertedById" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesContact" (
    "id" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "position" TEXT,
    "industry" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "accountManagerId" UUID,
    "satisfactionScore" INTEGER,
    "dealValue" DECIMAL(12,2),
    "originatingLeadId" UUID,
    "notes" TEXT,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactActivity" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesTask" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigneeId" UUID,
    "creatorId" UUID,
    "dueDate" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "parentTaskId" UUID,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskChecklistItem" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "authorId" UUID,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAttachment" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTimeEntry" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "userId" UUID,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTag" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesTaskTag" (
    "taskId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "SalesTaskTag_pkey" PRIMARY KEY ("taskId","tagId")
);

-- CreateTable
CREATE TABLE "TaskActivity" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesTaskLead" (
    "taskId" UUID NOT NULL,
    "leadId" UUID NOT NULL,

    CONSTRAINT "SalesTaskLead_pkey" PRIMARY KEY ("taskId","leadId")
);

-- CreateTable
CREATE TABLE "SalesTaskContact" (
    "taskId" UUID NOT NULL,
    "contactId" UUID NOT NULL,

    CONSTRAINT "SalesTaskContact_pkey" PRIMARY KEY ("taskId","contactId")
);

-- CreateIndex
CREATE INDEX "Lead_ownerId_idx" ON "Lead"("ownerId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_createdAt_idx" ON "LeadActivity"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadConversion_leadId_createdAt_idx" ON "LeadConversion"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadConversion_resultingContactId_idx" ON "LeadConversion"("resultingContactId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesContact_originatingLeadId_key" ON "SalesContact"("originatingLeadId");

-- CreateIndex
CREATE INDEX "SalesContact_accountManagerId_idx" ON "SalesContact"("accountManagerId");

-- CreateIndex
CREATE INDEX "SalesContact_status_idx" ON "SalesContact"("status");

-- CreateIndex
CREATE INDEX "SalesContact_createdAt_idx" ON "SalesContact"("createdAt");

-- CreateIndex
CREATE INDEX "ContactActivity_contactId_createdAt_idx" ON "ContactActivity"("contactId", "createdAt");

-- CreateIndex
CREATE INDEX "SalesTask_assigneeId_idx" ON "SalesTask"("assigneeId");

-- CreateIndex
CREATE INDEX "SalesTask_creatorId_idx" ON "SalesTask"("creatorId");

-- CreateIndex
CREATE INDEX "SalesTask_parentTaskId_idx" ON "SalesTask"("parentTaskId");

-- CreateIndex
CREATE INDEX "SalesTask_status_idx" ON "SalesTask"("status");

-- CreateIndex
CREATE INDEX "SalesTask_dueDate_idx" ON "SalesTask"("dueDate");

-- CreateIndex
CREATE INDEX "TaskChecklistItem_taskId_position_idx" ON "TaskChecklistItem"("taskId", "position");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_createdAt_idx" ON "TaskComment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskAttachment_taskId_createdAt_idx" ON "TaskAttachment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_taskId_startedAt_idx" ON "TaskTimeEntry"("taskId", "startedAt");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_userId_idx" ON "TaskTimeEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskTag_name_key" ON "TaskTag"("name");

-- CreateIndex
CREATE INDEX "SalesTaskTag_tagId_idx" ON "SalesTaskTag"("tagId");

-- CreateIndex
CREATE INDEX "TaskActivity_taskId_createdAt_idx" ON "TaskActivity"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "SalesTaskLead_leadId_idx" ON "SalesTaskLead"("leadId");

-- CreateIndex
CREATE INDEX "SalesTaskContact_contactId_idx" ON "SalesTaskContact"("contactId");

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadConversion" ADD CONSTRAINT "LeadConversion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadConversion" ADD CONSTRAINT "LeadConversion_resultingContactId_fkey" FOREIGN KEY ("resultingContactId") REFERENCES "SalesContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesContact" ADD CONSTRAINT "SalesContact_originatingLeadId_fkey" FOREIGN KEY ("originatingLeadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactActivity" ADD CONSTRAINT "ContactActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "SalesContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "SalesTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskChecklistItem" ADD CONSTRAINT "TaskChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SalesTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SalesTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SalesTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SalesTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTaskTag" ADD CONSTRAINT "SalesTaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SalesTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTaskTag" ADD CONSTRAINT "SalesTaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "TaskTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SalesTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTaskLead" ADD CONSTRAINT "SalesTaskLead_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SalesTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTaskLead" ADD CONSTRAINT "SalesTaskLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTaskContact" ADD CONSTRAINT "SalesTaskContact_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SalesTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTaskContact" ADD CONSTRAINT "SalesTaskContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "SalesContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Check constraints also protect records written outside the HTTP API.
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_score_range_check" CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 100));
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_estimatedDealValue_nonnegative_check" CHECK ("estimatedDealValue" IS NULL OR "estimatedDealValue" >= 0);
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_approvalStatus_check" CHECK ("approvalStatus" IN ('PENDING', 'APPROVED'));
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_conversionStatus_check" CHECK ("conversionStatus" IN ('PENDING', 'CONVERTED'));
ALTER TABLE "SalesContact" ADD CONSTRAINT "SalesContact_satisfactionScore_range_check" CHECK ("satisfactionScore" IS NULL OR ("satisfactionScore" >= 0 AND "satisfactionScore" <= 100));
ALTER TABLE "SalesContact" ADD CONSTRAINT "SalesContact_dealValue_nonnegative_check" CHECK ("dealValue" IS NULL OR "dealValue" >= 0);
ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_progress_range_check" CHECK ("progress" >= 0 AND "progress" <= 100);
ALTER TABLE "TaskChecklistItem" ADD CONSTRAINT "TaskChecklistItem_position_nonnegative_check" CHECK ("position" >= 0);
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_fileSize_nonnegative_check" CHECK ("fileSize" >= 0);
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_durationMinutes_nonnegative_check" CHECK ("durationMinutes" IS NULL OR "durationMinutes" >= 0);
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_chronological_check" CHECK ("endedAt" IS NULL OR "endedAt" >= "startedAt");
