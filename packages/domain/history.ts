import type { Audit, Escalation } from "@prisma/client";
import { db } from "../db/index.ts";

export function escalationEvidence(event: Escalation, state = event.state) {
  return {
    escalationId: event.id,
    subjectType: event.subjectType,
    subjectId: event.subjectId,
    level: event.level,
    recipientRole: event.recipientRole,
    recipientIds: event.recipientIds,
    state,
    deadlineRevision: event.deadlineRevision,
  };
}
export async function historyContext(
  rows: Audit[],
  institutionIds: string[] = [],
) {
  const evidenceId = (row: Audit) => {
    const e = row.evidence;
    return e &&
      typeof e === "object" &&
      !Array.isArray(e) &&
      typeof e.escalationId === "string"
      ? e.escalationId
      : row.correlationId;
  };
  const events = await db.escalation.findMany({
    where: {
      applicationId: {
        in: rows.flatMap((r) => (r.applicationId ? [r.applicationId] : [])),
      },
      id: { in: rows.map(evidenceId) },
    },
  });
  const people = await db.user.findMany({
    where: {
      id: {
        in: events.flatMap((e) =>
          Array.isArray(e.recipientIds)
            ? e.recipientIds.filter((v): v is string => typeof v === "string")
            : [],
        ),
      },
    },
    select: { id: true, name: true },
  });
  return rows.map((row) => {
    if (
      row.applicationId &&
      institutionIds.includes(row.applicationId) &&
      row.evidence &&
      typeof row.evidence === "object" &&
      !Array.isArray(row.evidence)
    ) {
      const { recipientIds: _privateRecipients, ...safe } = row.evidence;
      row = { ...row, evidence: safe };
    }
    const event = events.find(
      (e) => e.id === evidenceId(row) && e.applicationId === row.applicationId,
    );
    if (!event) return { ...row, escalation: null };
    const institutionView = institutionIds.includes(event.applicationId);
    const ids = Array.isArray(event.recipientIds)
      ? event.recipientIds.filter((v): v is string => typeof v === "string")
      : [];
    return {
      ...row,
      escalation: {
        subjectType: event.subjectType,
        subjectId: event.subjectId,
        level: event.level,
        recipientRole: event.recipientRole,
        recipientCount: ids.length,
        recipients: institutionView
          ? []
          : people.filter((p) => ids.includes(p.id)).map((p) => p.name),
        currentStatus: event.state,
        deadlineRevision: event.deadlineRevision,
        due: event.dueAt,
        resolutionReason: event.reason,
      },
    };
  });
}
