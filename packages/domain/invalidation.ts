import type { Tx } from "../db/index.ts";
// Called while holding the case lock, in the same transaction as the lifecycle change.
export async function invalidateDeadline(
  tx: Tx,
  applicationId: string,
  subjectType: string,
  subjectId: string,
  reason: string,
) {
  await tx.outbox.updateMany({
    where: {
      applicationId,
      subjectType,
      subjectId,
      eventKind: "DEADLINE",
      state: { in: ["QUEUED", "FAILED"] },
    },
    data: { state: "SUPERSEDED" },
  });
  const events = await tx.escalation.findMany({
    where: {
      applicationId,
      subjectType,
      subjectId,
      state: { in: ["OPEN", "UNASSIGNED", "ACKNOWLEDGED"] },
    },
  });
  for (const event of events) {
    await tx.escalation.update({
      where: { id: event.id },
      data: { state: "RESOLVED", resolvedAt: new Date(), reason },
    });
    await tx.audit.create({
      data: {
        applicationId,
        actorId: "SYSTEM",
        scope: { system: true },
        action: "escalation-resolved",
        reason,
        policyId: event.policyId,
        visibility: "PUBLIC",
        correlationId: event.id,
        evidence: [],
      },
    });
  }
}
