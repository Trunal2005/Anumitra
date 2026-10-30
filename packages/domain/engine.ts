import { createHash, randomUUID } from "node:crypto";
import {
  Prisma,
  type Grant,
  type User,
  type Application,
} from "@prisma/client";
import { db, type Tx } from "../db/index.ts";
import { commandSchema, workflowSchema } from "../contracts/index.ts";
export { type Actor, scope, can } from "./permissions.ts";
import {
  type Actor,
  scope,
  can,
  eligible,
  officialScope,
} from "./permissions.ts";
import { reviewBlockers } from "../contracts/workflow-checks.ts";
import { transitionAttempt } from "./attempts.ts";
import { windowDays } from "./deadlines.ts";
import { resolveRecipients } from "./recipients.ts";
import { documentCompliance } from "./documents.ts";
import { invalidateDeadline } from "./invalidation.ts";
export class DomainError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function ensure(ok: unknown, message: string, status = 409): asserts ok {
  if (!ok) throw new DomainError(status, message);
}
export const hash = (x: unknown) =>
  createHash("sha256").update(JSON.stringify(x)).digest("hex");
export async function clock(tx: Tx = db) {
  return process.env.DEMO_MODE === "true"
    ? (await tx.demoClock.findUniqueOrThrow({ where: { id: "current" } })).now
    : new Date();
}
export async function runId(tx: Tx = db) {
  return (await tx.demoClock.findUniqueOrThrow({ where: { id: "current" } }))
    .runId;
}
export function hasRole(a: Actor, ...roles: string[]) {
  return a.grants.some((g) => roles.includes(g.role));
}
export async function getApp(a: Actor, id: string, tx: Tx = db) {
  const app = await tx.application.findFirst({
    where: { id, ...scope(a), runId: await runId(tx) },
    include: {
      institution: true,
      workflow: true,
      documents: {
        include: {
          versions: { orderBy: { number: "desc" }, include: { reviews: true } },
        },
      },
      deficiencies: {
        include: { responses: true },
        orderBy: { createdAt: "asc" },
      },
      attempts: { orderBy: { startedAt: "asc" } },
      snapshots: true,
      recommendations: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
      decisions: true,
      obligations: true,
      visits: { include: { reservations: true } },
    },
  });
  ensure(app, "Application unavailable", 404);
  const asOf = await clock(tx);
  const institutionOnly = !(await tx.application.count({
    where: { id, ...officialScope(a) },
  }));
  return {
    ...app,
    institutionView: institutionOnly,
    documents: app.documents.map((d) => {
      const compliance = documentCompliance(d.versions, asOf);
      return {
        ...d,
        compliance,
        versions: institutionOnly
          ? d.versions.filter(
              (v) =>
                v.id === compliance.submitted?.id ||
                v.id === compliance.effective?.id,
            )
          : d.versions,
      };
    }),
  };
}
export async function audit(
  tx: Tx,
  a: Actor | null,
  app: Application | null,
  action: string,
  reason: string,
  fromState?: string,
  visibility = "INTERNAL",
  evidence: unknown = [],
) {
  await tx.audit.create({
    data: {
      applicationId: app?.id,
      actorId: a?.id ?? "SYSTEM",
      scope: (a?.grants.map((g) => ({
        role: g.role,
        institutionId: g.institutionId,
        regionId: g.regionId,
        committee: g.committee,
      })) ?? []) as Prisma.InputJsonValue,
      action,
      reason,
      fromState,
      toState: app?.state,
      policyId: app?.workflowId,
      visibility,
      evidence: evidence as Prisma.InputJsonValue,
      correlationId: randomUUID(),
    },
  });
}
export async function notify(
  tx: Tx,
  app: Application,
  title: string,
  key: string,
  subjectType = "APPLICATION",
  subjectId = app.id,
  revision = app.version,
  roles: string[] = ["INSTITUTION", "ASSIGNEE", "SUPERVISOR"],
  eventKind = "EVENT",
) {
  const caseRecord = await tx.application.findUniqueOrThrow({
    where: { id: app.id },
    include: { institution: true },
  });
  for (const recipient of await resolveRecipients(tx, caseRecord, roles)) {
    await tx.outbox.upsert({
      where: { logicalKey: `${app.runId}:${key}:${recipient.id}` },
      create: {
        applicationId: app.id,
        recipientId: recipient.id,
        recipientRole: recipient.role,
        eventKind,
        logicalKey: `${app.runId}:${key}:${recipient.id}`,
        revision,
        subjectType,
        subjectId,
        runId: app.runId,
        title,
      },
      update: {},
    });
  }
}
export function actions(a: Actor, app: Awaited<ReturnType<typeof getApp>>) {
  const allowed: string[] = [];
  const blockers: string[] = [];
  if (can(a, app, ["INSTITUTION"])) {
    if (app.state === "DRAFT") allowed.push("submit");
    if (app.state === "AWAITING_RESPONSE") allowed.push("submit-response");
  }
  if (can(a, app, ["SUPERVISOR", "BUREAU"])) allowed.push("assign");
  if (
    ["SCRUTINY", "RESCRUTINY"].includes(app.state) &&
    can(a, app, ["REVIEWER", "SUPERVISOR", "BUREAU"])
  ) {
    allowed.push("review-document", "raise-deficiency", "return-with-reason");
    if (app.state === "RESCRUTINY") allowed.push("verify-response");
    allowed.push("complete-stage");
  }
  if (
    ["EVC", "SAC", "SHC"].includes(app.state) &&
    can(a, app, ["COMMITTEE", "SUPERVISOR", "BUREAU"])
  )
    allowed.push("record-recommendation", "complete-stage");
  if (
    ["SCRUTINY", "RESCRUTINY", "AWAITING_RESPONSE"].includes(app.state) &&
    can(a, app, ["REVIEWER", "SUPERVISOR", "BUREAU"])
  )
    allowed.push("refer-adverse");
  if (app.state === "AUTHORITY" && can(a, app, ["AUTHORITY"]))
    allowed.push("record-authorized-decision");
  blockers.push(...reviewBlockers(app));
  const reviewed =
    app.documents.length > 0 &&
    app.documents.every((d) =>
      ["ACCEPTED", "REJECTED"].includes(d.versions[0]?.reviewState),
    );
  const commandBlockingReasons: Record<string, Record<string, string[]>> = {
    "record-authorized-decision": {
      REJECTED: reviewed
        ? []
        : [
            "A negative decision requires every current evidence version to have been reviewed.",
          ],
      APPROVED: blockers,
      CONDITIONAL: [
        ...blockers,
        "Enter the decision condition and a future undertaking deadline.",
      ],
    },
    "refer-adverse": {
      ACCEPTED: reviewed
        ? [
            "Requires a recorded adverse document or response review and an enabled pinned referral policy.",
          ]
        : ["Review all current evidence before an adverse referral."],
    },
    "submit-response": {
      ACCEPTED: [
        "Choose an open deficiency and the current evidence supporting this response.",
      ],
    },
    "verify-response": {
      ACCEPTED: [
        "Choose a responded deficiency; acceptance resolves this item.",
      ],
      REJECTED: [
        "Choose a responded deficiency; rejection opens a new institutional waiting interval.",
      ],
    },
  };
  return {
    allowedActions: allowed,
    blockingReasons: blockers,
    commandBlockingReasons,
  };
}
export async function command(
  a: Actor,
  id: string,
  input: unknown,
  key: string,
) {
  const c = commandSchema.parse(input);
  ensure(key && key.length <= 150, "Idempotency-Key is required", 400);
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${id} FOR UPDATE`;
      const idemId = `${a.id}:${hash(a.grants)}:${id}:${key}`;
      const digest = hash(c);
      const replay = await tx.idempotency.findUnique({ where: { id: idemId } });
      if (replay) {
        ensure(
          replay.payloadHash === digest,
          "Idempotency key has different input",
        );
        return replay.result;
      }
      const app = await getApp(a, id, tx);
      ensure(
        app.version === c.expectedVersion,
        "Record changed. Refresh and review before retrying.",
      );
      ensure(
        actions(a, app).allowedActions.includes(c.command),
        "Action is not permitted",
        403,
      );
      const config = workflowSchema.parse(app.workflow.config);
      const now = await clock(tx);
      let state = app.state;
      let stageIndex = app.stageIndex;
      let ownerId = app.ownerId;
      const evidence = app.documents.flatMap((d) =>
        d.versions.slice(0, 1).map((v) => v.id),
      );
      if (c.command !== "submit")
        ensure(
          c.reason.trim().length >= 5,
          "A meaningful reason is required",
          400,
        );
      if (c.command === "submit") {
        ensure(
          !config.applicability ||
            config.applicability.includes(app.category as any),
          "This workflow does not apply to the application category",
        );
        ensure(
          !config.requiredEvidence?.some(
            (kind) =>
              !app.documents.some((d) => d.kind === kind && d.versions.length),
          ),
          "Required evidence types are missing for this workflow",
        );
        ensure(
          app.documents.some((d) => d.versions.length),
          "Evidence required",
        );
        ensure(
          (app.data as any).contact && (app.data as any).programme,
          "Complete the draft",
        );
        await tx.snapshot.create({
          data: {
            applicationId: id,
            revision: app.version,
            kind: "SUBMISSION",
            content: { data: app.data, evidence, workflowId: app.workflowId },
          },
        });
        state = config.stages[0];
      }
      if (c.command === "assign") {
        ensure(c.ownerId, "Choose an assignee", 400);
        const assignee = await tx.user.findUnique({
          where: { id: c.ownerId },
          include: { grants: true },
        });
        ensure(assignee, "Assignee unavailable", 400);
        ensure(
          eligible(assignee, app),
          "Assignee lacks the current stage and complete case scope",
          403,
        );
        ownerId = c.ownerId;
      }
      if (
        c.command === "raise-deficiency" ||
        c.command === "return-with-reason"
      ) {
        const items = c.items ?? (c.item?.trim() ? [c.item] : []);
        ensure(
          items.length && new Set(items).size === items.length,
          "Distinct checklist items are required",
          400,
        );
        const round = Math.max(0, ...app.deficiencies.map((d) => d.round)) + 1;
        await tx.deficiency.createMany({
          data: items.map((item) => ({
            applicationId: id,
            round,
            item,
            reason: c.reason,
          })),
        });
        state = "AWAITING_RESPONSE";
      }
      if (c.command === "submit-response") {
        const d = app.deficiencies.find(
          (d) => d.id === c.deficiencyId && d.state === "OPEN",
        );
        ensure(d, "Open deficiency required");
        ensure(
          evidence.includes(c.documentVersionId ?? ""),
          "Response must reference a current version from this case",
        );
        await tx.response.create({
          data: {
            deficiencyId: d.id,
            text: c.reason,
            documentVersionId: c.documentVersionId!,
          },
        });
        await tx.deficiency.update({
          where: { id: d.id },
          data: { state: "RESPONDED" },
        });
        if (app.deficiencies.filter((x) => x.state === "OPEN").length === 1)
          state = "RESCRUTINY";
        await tx.snapshot.create({
          data: {
            applicationId: id,
            revision: app.version,
            kind: "RESPONSE",
            content: {
              deficiencyId: d.id,
              reason: c.reason,
              evidence: c.documentVersionId!,
            },
          },
        });
      }
      if (c.command === "verify-response") {
        const d = app.deficiencies.find(
          (d) => d.id === c.deficiencyId && d.state === "RESPONDED",
        );
        ensure(d, "Responded deficiency required");
        ensure(
          ["ACCEPTED", "REJECTED"].includes(c.outcome ?? ""),
          "Choose response outcome",
          400,
        );
        await tx.deficiency.update({
          where: { id: d.id },
          data: { state: c.outcome === "ACCEPTED" ? "ACCEPTED" : "OPEN" },
        });
        const response = [...d.responses].sort(
          (a, b) => +b.createdAt - +a.createdAt,
        )[0];
        ensure(response, "Response evidence is missing");
        await tx.response.update({
          where: { id: response.id },
          data: { reviewOutcome: c.outcome, reviewerId: a.id, reviewedAt: now },
        });
        if (c.outcome === "REJECTED") state = "AWAITING_RESPONSE";
      }
      if (c.command === "review-document") {
        ensure(
          evidence.includes(c.documentVersionId ?? ""),
          "Choose a current case document",
        );
        ensure(
          ["ACCEPTED", "REJECTED"].includes(c.outcome ?? ""),
          "Choose review outcome",
          400,
        );
        const doc = app.documents.find(
          (d) => d.versions[0]?.id === c.documentVersionId,
        )!;
        ensure(
          doc.versions[0].reviewState === "PENDING",
          "This immutable version already has a review decision; submit a new version for another verification",
        );
        await tx.documentReview.create({
          data: {
            versionId: c.documentVersionId!,
            actorId: a.id,
            outcome: c.outcome!,
            reason: c.reason,
          },
        });
        await tx.documentVersion.update({
          where: { id: c.documentVersionId },
          data: { reviewState: c.outcome },
        });
        if (c.outcome === "ACCEPTED") {
          const previous = doc.compliance.effective;
          if (previous)
            await invalidateDeadline(
              tx,
              id,
              "DOCUMENT",
              previous.id,
              "Authorized accepted evidence replaced the prior effective version",
            );
          await invalidateDeadline(
            tx,
            id,
            "DOCUMENT_REVIEW",
            doc.id,
            "Accepted evidence resolves the missing-acceptance review deadline",
          );
        }
      }
      if (c.command === "record-recommendation") {
        ensure(
          ["ACCEPTED", "REJECTED"].includes(c.outcome ?? ""),
          "Recommendation must explicitly accept or reject",
        );
        if (app.state === "EVC")
          ensure(
            app.visits.some((v) => v.state === "COMPLETED"),
            "Completed EVC report required",
          );
        await tx.recommendation.create({
          data: {
            applicationId: id,
            actorId: a.id,
            stage: app.state,
            attemptId: app.attempts.find((t) => t.state === "OPEN")?.id,
            outcome: c.outcome!,
            reason: c.reason,
          },
        });
      }
      if (c.command === "complete-stage") {
        const currentRecommendation = app.recommendations.find(
          (r) =>
            r.attemptId === app.attempts.find((t) => t.state === "OPEN")?.id,
        );
        const negative =
          ["EVC", "SAC", "SHC"].includes(app.state) &&
          currentRecommendation?.outcome === "REJECTED";
        ensure(
          negative || !app.deficiencies.some((d) => d.state !== "ACCEPTED"),
          "Resolve every open deficiency or use an explicit adverse referral",
        );
        ensure(
          app.documents.length &&
            app.documents.every((d) =>
              negative
                ? ["ACCEPTED", "REJECTED"].includes(d.versions[0]?.reviewState)
                : d.versions[0]?.reviewState === "ACCEPTED",
            ),
          "Review current evidence before progressing; positive paths require acceptance",
        );
        if (["EVC", "SAC", "SHC"].includes(app.state))
          ensure(
            app.recommendations.some(
              (r) =>
                r.stage === app.state &&
                r.attemptId ===
                  app.attempts.find((t) => t.state === "OPEN")?.id,
            ),
            "Record a separate recommendation first",
          );
        if (app.state === "EVC")
          ensure(
            app.visits.some((v) => v.state === "COMPLETED"),
            "Complete EVC first",
          );
        stageIndex++;
        ensure(config.stages[stageIndex], "No next stage configured");
        state = config.stages[stageIndex];
      }
      if (c.command === "record-authorized-decision") {
        ensure(
          ["APPROVED", "CONDITIONAL", "REJECTED"].includes(c.outcome ?? ""),
          "Choose a decision outcome",
          400,
        );
        if (c.outcome === "REJECTED")
          ensure(
            app.documents.length &&
              app.documents.every((d) =>
                ["ACCEPTED", "REJECTED"].includes(d.versions[0]?.reviewState),
              ),
            "A negative decision still requires reviewed evidence",
          );
        else
          ensure(
            !app.deficiencies.some((d) => d.state !== "ACCEPTED") &&
              app.documents.length &&
              app.documents.every(
                (d) => d.versions[0]?.reviewState === "ACCEPTED",
              ),
            "Positive decisions require accepted evidence and resolved deficiencies",
          );
        const decision = await tx.decision.create({
          data: {
            applicationId: id,
            actorId: a.id,
            outcome: c.outcome!,
            reason: c.reason,
            snapshot: {
              data: app.data,
              evidence,
              workflowId: app.workflowId,
              recommendations: app.recommendations.map((r) => r.id),
              reviewedEvidence: app.documents.map((d) => ({
                versionId: d.versions[0]?.id,
                outcome: d.versions[0]?.reviewState,
              })),
              recommendationOutcomes: app.recommendations.map((r) => ({
                id: r.id,
                attemptId: r.attemptId,
                outcome: r.outcome,
              })),
            },
          },
        });
        if (c.outcome === "CONDITIONAL") {
          ensure(
            c.condition && c.dueAt && new Date(c.dueAt) > now,
            "Conditional decision requires a condition and future deadline",
            400,
          );
          const institutionUser = await tx.user.findFirst({
            where: {
              grants: {
                some: { institutionId: app.institutionId, role: "INSTITUTION" },
              },
            },
          });
          ensure(institutionUser, "Institution owner required");
          await tx.obligation.create({
            data: {
              applicationId: id,
              decisionId: decision.id,
              condition: c.condition,
              source: `DEMO decision ${decision.id}`,
              ownerId: institutionUser.id,
              requiredEvidence: "Private document version plus explanation",
              originalDueAt: new Date(c.dueAt),
              dueAt: new Date(c.dueAt),
            },
          });
        }
        state = c.outcome!;
      }
      if (c.command === "refer-adverse") {
        ensure(
          config.adverseReferral === "AUTHORITY_REVIEW",
          "The pinned DEMO policy does not permit an adverse referral",
        );
        ensure(
          app.documents.length &&
            app.documents.every((d) =>
              ["ACCEPTED", "REJECTED"].includes(d.versions[0]?.reviewState),
            ),
          "An adverse referral requires current reviewed evidence",
        );
        ensure(
          app.documents.some(
            (d) => d.versions[0]?.reviewState === "REJECTED",
          ) ||
            app.deficiencies.some((d) =>
              d.responses.some((r) => r.reviewOutcome === "REJECTED"),
            ),
          "Record a reasoned adverse verification before referring",
        );
        await tx.recommendation.create({
          data: {
            applicationId: id,
            actorId: a.id,
            stage: app.state,
            attemptId: app.attempts.find((t) => t.state === "OPEN")?.id,
            outcome: "REJECTED",
            reason: c.reason,
          },
        });
        stageIndex = config.stages.indexOf("AUTHORITY");
        state = "AUTHORITY";
      }
      if (state !== app.state && config.stages.includes(state as any)) {
        const candidates = await tx.user.findMany({
          where: { active: true },
          include: { grants: true },
          orderBy: { id: "asc" },
        });
        ownerId =
          candidates
            .filter((u) => eligible(u, { ...app, state }, state))
            .sort((a, b) => {
              const score = (u: Actor) =>
                Math.min(
                  ...u.grants
                    .filter((g) =>
                      ["REVIEWER", "SUPERVISOR", "BUREAU"].includes(g.role),
                    )
                    .map((g) =>
                      ["REVIEWER", "SUPERVISOR", "BUREAU"].indexOf(g.role),
                    ),
                  9,
                );
              return score(a) - score(b) || a.id.localeCompare(b.id);
            })[0]?.id ?? null;
      }
      await transitionAttempt(tx, app, { state, stageIndex, ownerId }, now);
      if (state !== app.state)
        await invalidateDeadline(
          tx,
          id,
          "APPLICATION",
          id,
          `Stage changed ${app.state} to ${state}; previous deadline resolved`,
        );
      const updated = await tx.application.update({
        where: { id },
        data: {
          state,
          stageIndex,
          ownerId,
          version: { increment: 1 },
          ...(state !== app.state
            ? { deadlineRevision: { increment: 1 } }
            : {}),
          ...(state !== app.state
            ? { dueAt: new Date(+now + windowDays(config, state) * 86400000) }
            : {}),
        },
      });
      await audit(
        tx,
        a,
        updated,
        c.command,
        (c.reason || "Submission validated") +
          (state !== app.state
            ? `; business time ${now.toISOString()}; deadline ${app.dueAt?.toISOString() ?? "none"} r${app.deadlineRevision} -> ${updated.dueAt?.toISOString() ?? "none"} r${updated.deadlineRevision}; continuous DEMO calendar-day window`
            : ""),
        app.state,
        "PUBLIC",
        c.documentVersionId ? [c.documentVersionId] : evidence,
      );
      await notify(
        tx,
        updated,
        `${app.reference}: ${c.command.replaceAll("-", " ")} → ${state}`,
        `${updated.id}:v${updated.version}`,
      );
      const result = { id, state, version: updated.version };
      await tx.idempotency.create({
        data: { id: idemId, payloadHash: digest, result },
      });
      return result;
    },
    { timeout: 20000 },
  );
}
export const csvCell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[\s]*[=+@\-\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
};
export function dateOnlyEnd(s: string) {
  ensure(/^\d{4}-\d{2}-\d{2}$/.test(s), "Date must be YYYY-MM-DD", 400);
  const [year, month, day] = s.split("-").map(Number);
  const checked = new Date(Date.UTC(year, month - 1, day));
  ensure(
    year >= 1900 &&
      checked.getUTCFullYear() === year &&
      checked.getUTCMonth() === month - 1 &&
      checked.getUTCDate() === day,
    "Impossible calendar date",
    400,
  );
  return new Date(`${s}T23:59:59.999+05:30`);
}
