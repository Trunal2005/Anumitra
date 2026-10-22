-- Preserve the original generation's retry bound when upgrading pre-generation intents.
UPDATE "Outbox" SET "generationAttempts" = GREATEST("generationAttempts", attempts)
WHERE generation = 1 AND "generationAttempts" = 0 AND attempts > 0;

-- Legacy reminder identities used the general case version and broadcast viewers.
-- Retain their history, retire only pending legacy deadline work, then let the
-- designated-recipient scanner create current deadline identities.
WITH superseded AS (
  UPDATE "Outbox" SET state = 'SUPERSEDED'
  WHERE "eventKind" = 'EVENT' AND state IN ('QUEUED','FAILED')
    AND ("logicalKey" LIKE '%:UPCOMING:%' OR "logicalKey" LIKE '%:OVERDUE_ESCALATION:%')
  RETURNING id, "applicationId"
)
INSERT INTO "Audit" (id,"applicationId","actorId",scope,action,"fromState","toState",reason,evidence,"policyId",visibility,"correlationId")
SELECT md5('legacy-deadline-upgrade:' || s.id),s."applicationId",'SYSTEM','[]'::jsonb,
  'legacy-deadline-superseded',a.state,a.state,
  'Pending legacy broadcast/version-based deadline intent retired during explicit deadline-generation upgrade; history retained',
  jsonb_build_array(s.id),a."workflowId",'PUBLIC','migration006:' || s.id
FROM superseded s JOIN "Application" a ON a.id=s."applicationId";
