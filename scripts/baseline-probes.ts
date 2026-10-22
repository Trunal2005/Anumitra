import { writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { db } from "../packages/db/index.ts";
import {
  scope,
  clock,
  runId,
  command,
  dateOnlyEnd,
} from "../packages/domain/engine.ts";
import { scan, deliver } from "../packages/domain/alerts.ts";
import PgBoss from "pg-boss";
if (process.env.ANUMITRA_TEST_TARGET !== "disposable")
  throw new Error("Only disposable test target allowed");
const actors = await db.user.findMany({ include: { grants: true } });
const user = (p: string) =>
  actors.find((u) => u.email === p + "@anumitra.test")!;
const fake = {
  ...user("authority"),
  grants: [
    {
      ...user("authority").grants[0],
      institutionId: "I01",
      regionId: null,
      bureau: null,
    },
  ],
};
const scopeResult = scope(fake);
const dates = ["2026-02-31", "2026-02-29", "2026-02-28"].map((value) => ({
  value,
  result: dateOnlyEnd(value).toString(),
}));
const wf = await db.workflow.findFirstOrThrow({
  where: { name: "Only Scrutiny", version: 1 },
});
const app = await db.application.create({
  data: {
    reference: "BASELINE-" + randomUUID().slice(0, 8),
    runId: await runId(),
    institutionId: "I01",
    workflowId: wf.id,
    category: "NEW_INSTITUTION",
    data: {
      contact: "fiction@test.test",
      programme: "Engineering",
      intake: 60,
    },
  },
});
const d = await db.document.create({
  data: {
    applicationId: app.id,
    title: "Baseline fictional lease",
    kind: "LEASE",
  },
});
const v1 = await db.documentVersion.create({
  data: {
    documentId: d.id,
    number: 1,
    storageKey: randomUUID(),
    mime: "application/pdf",
    size: 30,
    hash: "baseline-metadata-only",
    validUntil: new Date("2026-01-01"),
    reviewState: "ACCEPTED",
  },
});
const act = async (actor: any, cmd: string, extra: any = {}) =>
  command(
    actor,
    app.id,
    {
      command: cmd,
      expectedVersion: (
        await db.application.findUniqueOrThrow({ where: { id: app.id } })
      ).version,
      reason: "Baseline reproduced finding",
      ...extra,
    },
    randomUUID(),
  );
await act(user("institution.a"), "submit");
await act(user("reviewer.north"), "raise-deficiency", { item: "LEASE" });
const deficiency = await db.deficiency.findFirstOrThrow({
  where: { applicationId: app.id },
});
await act(user("institution.a"), "submit-response", {
  deficiencyId: deficiency.id,
  documentVersionId: v1.id,
});
await act(user("reviewer.north"), "verify-response", {
  deficiencyId: deficiency.id,
  outcome: "REJECTED",
});
const attempts = await db.stageAttempt.findMany({
  where: { applicationId: app.id, state: "OPEN" },
  select: { stage: true, state: true },
});
const v2 = await db.documentVersion.create({
  data: {
    documentId: d.id,
    number: 2,
    storageKey: randomUUID(),
    mime: "application/pdf",
    size: 30,
    hash: "baseline-metadata-only",
    validUntil: new Date("2028-01-01"),
    reviewState: "PENDING",
  },
});
await scan();
const expiredReminderCount = await db.outbox.count({
  where: { subjectId: v1.id },
});
const current = await db.application.findUniqueOrThrow({
  where: { id: app.id },
});
const o = await db.outbox.create({
  data: {
    applicationId: app.id,
    recipientId: user("institution.a").id,
    logicalKey: randomUUID(),
    revision: current.version,
    subjectId: app.id,
    runId: current.runId,
    title: "Baseline actual SMTP failure",
  },
});
const oldPort = process.env.SMTP_PORT;
process.env.SMTP_PORT = "1";
const boss = new PgBoss(process.env.DATABASE_URL!);
await boss.start();
await boss.createQueue("notification");
await boss.work<{ id: string }>(
  "notification",
  { batchSize: 1, pollingIntervalSeconds: 1 },
  async (jobs) => {
    for (const j of jobs) await deliver(j.data.id);
  },
);
const jobId = await boss.send("notification", { id: o.id }, { priority: 100 });
await db.outbox.update({ where: { id: o.id }, data: { jobId } });
let job;
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 200));
  job = await boss.getJobById("notification", jobId!);
  if (job?.state === "completed") break;
}
const failed = await db.outbox.findUniqueOrThrow({ where: { id: o.id } });
await db.outbox.update({
  where: { id: o.id },
  data: { state: "QUEUED", attempts: 0, nextAt: new Date() },
});
const selected = await db.outbox.count({
  where: { id: o.id, state: "QUEUED", jobId: null },
});
await boss.stop();
process.env.SMTP_PORT = oldPort;
const result = {
  sourceRevision: "08758db7c45a687dd753fef678537e231ca75c14",
  executedAt: new Date(),
  target: new URL(process.env.DATABASE_URL!).pathname,
  officialInstitutionScope: scopeResult,
  dates,
  openAttemptsAfterRejectedResponse: attempts,
  expiredAcceptedVersionReminderCountWithPendingRenewal: expiredReminderCount,
  completedTransportRetry: {
    jobState: job?.state,
    intentAfterSmtp: failed.state,
    selectedByQueuedRelayAfterRetry: selected,
  },
};
await writeFile(
  "docs/evidence/repair/baseline-probes.json",
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
await db.$disconnect();
