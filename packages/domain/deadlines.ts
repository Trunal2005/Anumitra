import type { Prisma } from "@prisma/client";
import { db, type Tx } from "../db/index.ts";
import { workflowSchema, type WorkflowConfig } from "../contracts/index.ts";
import { documentCompliance } from "./documents.ts";
export function windowDays(config: WorkflowConfig, state: string) {
  const key =
    state === "AWAITING_RESPONSE"
      ? "RESPONSE"
      : state === "EVC"
        ? "EVC_SCHEDULING"
        : state;
  return (
    config.windows?.[key as keyof NonNullable<WorkflowConfig["windows"]>] ??
    config.deadlineDays
  );
}
export type DeadlineSubject = {
  applicationId: string;
  reference: string;
  institutionId: string;
  regionId: string;
  ownerId: string | null;
  policyId: string;
  policy: WorkflowConfig;
  type: string;
  id: string;
  revision: number;
  due: Date;
  status: string;
  label: string;
};
export async function deadlineSubjects(
  where: Prisma.ApplicationWhereInput,
  now: Date,
  tx: Tx = db,
) {
  const apps = await tx.application.findMany({
    where,
    include: {
      institution: true,
      workflow: true,
      obligations: true,
      documents: { include: { versions: { orderBy: { number: "desc" } } } },
      visits: true,
    },
  });
  const subjects: DeadlineSubject[] = [];
  for (const app of apps) {
    const policy = workflowSchema.parse(app.workflow.config);
    const add = (
      s: Pick<
        DeadlineSubject,
        "type" | "id" | "revision" | "due" | "status" | "label"
      >,
    ) =>
      subjects.push({
        applicationId: app.id,
        reference: app.reference,
        institutionId: app.institutionId,
        regionId: app.institution.regionId,
        ownerId: app.ownerId,
        policyId: app.workflowId,
        policy,
        ...s,
      });
    const activeVisits = app.visits.filter(
      (v) => !["COMPLETED", "CANCELLED"].includes(v.state),
    );
    if (
      !["DRAFT", "APPROVED", "CONDITIONAL", "REJECTED"].includes(app.state) &&
      app.dueAt &&
      !(app.state === "EVC" && activeVisits.length)
    )
      add({
        type: "APPLICATION",
        id: app.id,
        revision: app.deadlineRevision,
        due: app.dueAt,
        status: app.state,
        label:
          app.state === "EVC" ? "EVC scheduling" : "Application " + app.state,
      });
    for (const o of app.obligations)
      if (!["ACCEPTED", "WAIVED"].includes(o.state))
        add({
          type: "OBLIGATION",
          id: o.id,
          revision: o.revision,
          due: o.dueAt,
          status: o.state,
          label: o.condition,
        });
    for (const doc of app.documents) {
      const compliance = documentCompliance(doc.versions, now);
      if (compliance.effective?.validUntil)
        add({
          type: "DOCUMENT",
          id: compliance.effective.id,
          revision: compliance.effective.number,
          due: compliance.effective.validUntil,
          status: compliance.status,
          label: `Effective ${doc.title}${compliance.renewalPending ? " • renewal pending verification" : ""}`,
        });
      else if (!compliance.effective && compliance.submitted)
        add({
          type: "DOCUMENT_REVIEW",
          id: doc.id,
          revision: compliance.submitted.number,
          due: new Date(
            +compliance.submitted.createdAt +
              (policy.windows?.DOCUMENT_REVIEW ?? policy.deadlineDays) *
                86400000,
          ),
          status: "NO_ACCEPTED_VERSION",
          label: `No accepted evidence: ${doc.title}`,
        });
    }
    for (const v of activeVisits)
      add({
        type: "VISIT",
        id: v.id,
        revision: v.deadlineRevision,
        due: ["CONFIRMED", "REPORT_PENDING"].includes(v.state)
          ? (v.reportDueAt ??
            new Date(
              +v.endAt +
                (policy.windows?.EVC_REPORT ?? policy.deadlineDays) * 86400000,
            ))
          : v.startAt,
        status: v.state,
        label: "EVC " + v.state,
      });
  }
  return subjects;
}
