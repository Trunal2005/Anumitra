-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Grant" ADD COLUMN     "canDelegateGlobal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "global" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "publishedHash" TEXT,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "deadlineRevision" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "reviewOutcome" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewerId" TEXT;

-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN     "attemptId" TEXT;

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "deadlineRevision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "reportDueAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Outbox" ADD COLUMN     "eventKind" TEXT NOT NULL DEFAULT 'EVENT',
ADD COLUMN     "generation" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "generationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recipientRole" TEXT;

-- AlterTable
ALTER TABLE "DeliveryAttempt" ADD COLUMN     "generation" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Escalation" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "deadlineRevision" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "recipientIds" JSONB NOT NULL,
    "recipientRole" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'OPEN',
    "logicalKey" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Escalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerHeartbeat" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "WorkerHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Escalation_logicalKey_key" ON "Escalation"("logicalKey");

-- CreateIndex
CREATE INDEX "Escalation_applicationId_state_idx" ON "Escalation"("applicationId", "state");
