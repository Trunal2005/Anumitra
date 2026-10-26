import type { Actor } from "./permissions.ts";
import { eligible } from "./permissions.ts";
import { db } from "../db/index.ts";
import { clock, type getApp } from "./engine.ts";
import { deadlineSubjects } from "./deadlines.ts";

export async function nextStep(record: Awaited<ReturnType<typeof getApp>>) {
  const owner = record.ownerId
    ? await db.user.findUnique({
        where: { id: record.ownerId },
        include: { grants: true },
      })
    : null;
  const assigned =
    owner?.active && eligible(owner as Actor, record) ? owner.name : null;
  const result = (
    role: string,
    task: string,
    due: Date | null = record.dueAt,
    name: string | null = null,
  ) => ({ role, task, due, assignee: name });
  if (record.state === "DRAFT")
    return result(
      "Institution representative",
      "Add required evidence, then explicitly submit the draft.",
      null,
    );
  if (record.state === "AWAITING_RESPONSE")
    return result(
      "Institution representative",
      "Respond to each open deficiency with evidence for official re-scrutiny.",
    );
  if (["APPROVED", "REJECTED", "CONDITIONAL"].includes(record.state)) {
    const pending = record.obligations
      .filter((o) => !["ACCEPTED", "WAIVED"].includes(o.state))
      .sort((a, b) => +a.dueAt - +b.dueAt)[0];
    if (pending)
      return result(
        pending.state === "SUBMITTED"
          ? "Authorized reviewer / supervisor / bureau"
          : "Institution representative",
        pending.state === "SUBMITTED"
          ? "Review the submitted undertaking evidence; submission alone does not close the condition."
          : "Submit evidence for the outstanding decision condition.",
        pending.dueAt,
      );
    const subjects = await deadlineSubjects({ id: record.id }, await clock());
    const review = record.documents.find(
      (d) => d.compliance.submitted?.reviewState === "PENDING",
    );
    if (review) {
      const deadline = subjects.find(
        (s) => s.type === "DOCUMENT_REVIEW" && s.id === review.id,
      );
      return result(
        "Authorized reviewer / supervisor / bureau",
        `Review the latest submission for ${review.title}. ${review.compliance.effective ? "The accepted version remains effective; the date shown is its existing expiry, not a new review deadline." : "No accepted version exists; the date shown is the configured DEMO review deadline."}`,
        review.compliance.effective?.validUntil ?? deadline?.due ?? null,
      );
    }
    const renewal = record.documents
      .filter((d) => ["EXPIRED", "EXPIRING"].includes(d.compliance.status))
      .sort(
        (a, b) =>
          +a.compliance.effective!.validUntil! -
          +b.compliance.effective!.validUntil!,
      )[0];
    if (renewal)
      return result(
        "Institution representative",
        `Submit corrected renewal evidence for ${renewal.title}; the accepted version's expiry remains in force until a replacement is accepted.`,
        renewal.compliance.effective!.validUntil,
      );
    return result(
      "No application transition pending",
      "The human decision is recorded. Accepted document validity remains monitored in the document registry.",
      null,
    );
  }
  if (record.state === "EVC") {
    const visit = record.visits.find(
      (v) => !["CANCELLED", "COMPLETED"].includes(v.state),
    );
    if (!visit && !record.visits.some((v) => v.state === "COMPLETED"))
      return result(
        "Supervisor / bureau coordinator",
        "Schedule and confirm an eligible expert visit.",
      );
    if (visit?.state === "PROPOSED")
      return result(
        "Supervisor / bureau coordinator",
        "Confirm or reschedule the proposed appointment.",
        visit.startAt,
      );
    if (visit?.report)
      return result(
        "Supervisor / bureau coordinator",
        "Review the submitted visit report and explicitly accept completion.",
        visit.reportDueAt,
      );
    if (visit)
      return result(
        "Assigned EVC member",
        "Submit the visit report after the appointment; completion review is a separate action.",
        visit.reportDueAt,
      );
  }
  const role =
    record.state === "AUTHORITY"
      ? "Competent authority"
      : ["EVC", "SAC", "SHC"].includes(record.state)
        ? `Assigned ${record.state} committee member`
        : "Assigned reviewer / supervisor / bureau";
  return result(
    assigned ? role : `${role} (eligible assignment required)`,
    record.state === "AUTHORITY"
      ? "Record an explicit human decision after the required review guards."
      : "Complete the current review and its evidence guards before stage progression.",
    record.dueAt,
    assigned,
  );
}
