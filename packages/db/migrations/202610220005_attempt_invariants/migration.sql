-- Preserve legacy rows while closing orphaned/overlapping intervals. Historical
-- missing waiting time is not inferred or advertised as measured.
UPDATE "Grant" SET global=true WHERE "institutionId" IS NULL AND "regionId" IS NULL AND bureau IS NULL AND role IN ('BUREAU','AUTHORITY','AUDITOR','COMMITTEE','ADMIN');
UPDATE "Grant" g SET "canDelegateGlobal"=true FROM "User" u WHERE g."userId"=u.id AND u.email='bureau@anumitra.test' AND g.role='BUREAU' AND g.global=true;
WITH ordered AS (SELECT id,"startedAt",lead("startedAt") OVER (PARTITION BY "applicationId" ORDER BY "startedAt",id) AS next_start FROM "StageAttempt")
UPDATE "StageAttempt" t SET "endedAt"=o.next_start,state=CASE WHEN t.state='OPEN' THEN 'SUPERSEDED' ELSE t.state END FROM ordered o WHERE t.id=o.id AND o.next_start IS NOT NULL AND (t."endedAt" IS NULL OR t."endedAt">o.next_start);
UPDATE "StageAttempt" t SET state='SUPERSEDED',"endedAt"=greatest(t."startedAt",a."updatedAt") FROM "Application" a WHERE t."applicationId"=a.id AND t.state='OPEN' AND (t.stage<>a.state OR a.state IN ('DRAFT','APPROVED','CONDITIONAL','REJECTED'));
INSERT INTO "StageAttempt" (id,"applicationId",stage,"stageIndex",state,"ownerId","startedAt") SELECT 'repair:'||a.id,a.id,a.state,a."stageIndex",'OPEN',CASE WHEN a.state='AWAITING_RESPONSE' THEN NULL ELSE a."ownerId" END,greatest(a."updatedAt",coalesce((SELECT max(t."endedAt") FROM "StageAttempt" t WHERE t."applicationId"=a.id),a."updatedAt")) FROM "Application" a WHERE a.state NOT IN ('DRAFT','APPROVED','CONDITIONAL','REJECTED') AND NOT EXISTS(SELECT 1 FROM "StageAttempt" t WHERE t."applicationId"=a.id AND t.state='OPEN');
ALTER TABLE "StageAttempt" ADD CONSTRAINT attempt_positive_interval CHECK ("endedAt" IS NULL OR "endedAt">="startedAt");
CREATE UNIQUE INDEX one_open_attempt_per_case ON "StageAttempt" ("applicationId") WHERE state='OPEN';
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "StageAttempt" ADD CONSTRAINT nonoverlapping_case_attempts EXCLUDE USING gist ("applicationId" WITH =, tsrange("startedAt","endedAt",'[)') WITH &&) DEFERRABLE INITIALLY IMMEDIATE;
