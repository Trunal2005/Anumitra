// Run explicitly with: npx tsx --test tests/operations.test.ts
import "dotenv/config";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../packages/db/index.ts";
import {
  clock,
  command,
  getApp,
  runId,
  scope,
} from "../packages/domain/engine.ts";
import { schedule, visitCommand } from "../packages/domain/visits.ts";
import { deliver, scan } from "../packages/domain/alerts.ts";
const actors = await db.user.findMany({ include: { grants: true } });
const actor = (prefix: string) =>
  actors.find((u) => u.email === `${prefix}@anumitra.test`)!;
const institution = actor("institution.a"),
  reviewer = actor("reviewer.north"),
  supervisor = actor("supervisor.north"),
  authority = actor("authority");
let n = 0;
async function act(who: any, id: string, cmd: string, extra: any = {}) {
  const a = await getApp(who, id);
  return command(
    who,
    id,
    {
      command: cmd,
      expectedVersion: a.version,
      reason: "Verified operation scenario with evidence",
      ...extra,
    },
    `${randomUUID()}-${++n}`,
  );
}
async function create(route: string) {
  const wf = await db.workflow.findFirstOrThrow({
    where: { name: route, state: "PUBLISHED" },
  });
  const app = await db.application.create({
    data: {
      reference: "OP-" + randomUUID().slice(0, 8),
      institutionId: "I01",
      workflowId: wf.id,
      runId: await runId(),
      category: "NEW_INSTITUTION",
      data: {
        contact: "operation@fiction.test",
        programme: "Engineering",
        intake: 60,
      },
    },
  });
  const example = await db.documentVersion.findFirstOrThrow({
    include: { document: true },
  });
  const doc = await db.document.create({
    data: { applicationId: app.id, title: "Operation evidence", kind: "LEASE" },
  });
  const storage = path.resolve(process.env.STORAGE_PATH ?? "storage/private");
  const storageKey = randomUUID();
  await writeFile(
    path.join(storage, storageKey),
    await readFile(path.join(storage, example.storageKey)),
    { flag: "wx" },
  );
  const v = await db.documentVersion.create({
    data: {
      documentId: doc.id,
      number: 1,
      storageKey,
      mime: "application/pdf",
      size: example.size,
      hash: example.hash,
    },
  });
  return { app, v };
}
after(async () => db.$disconnect());
test("all five route families preserve recommendation/decision separation", async () => {
  const original = await clock();
  try {
    for (const route of [
      "Only Scrutiny",
      "Scrutiny + EVC",
      "Only EVC",
      "EVC + SAC",
      "EVC + SHC",
    ]) {
      const { app, v } = await create(route);
      await act(institution, app.id, "submit");
      await db.documentVersion.update({
        where: { id: v.id },
        data: { reviewState: "ACCEPTED" },
      });
      let current = await getApp(supervisor, app.id);
      if (current.state === "SCRUTINY") {
        await act(reviewer, app.id, "complete-stage");
        current = await getApp(supervisor, app.id);
      }
      if (current.state === "EVC") {
        const now = await clock();
        const latest = await db.reservation.findFirst({
          where: { userId: actor("committee.evc").id, active: true },
          orderBy: { endAt: "desc" },
        });
        const startAt = new Date(
            Math.max(+now + 86400000, latest ? +latest.endAt + 86400000 : 0),
          ),
          endAt = new Date(+startAt + 3600000);
        const visit = await schedule(supervisor, app.id, {
          mode: "HYBRID",
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          participants: [actor("committee.evc").id],
          metadata: "Fictional native meeting",
          reason: "Operation scenario EVC visit",
        });
        await visitCommand(
          supervisor,
          visit.id,
          "confirm",
          "Availability and venue confirmed",
        );
        await db.demoClock.update({
          where: { id: "current" },
          data: { now: new Date(+endAt + 1000) },
        });
        await visitCommand(
          actor("committee.evc"),
          visit.id,
          "report",
          "Visit performed; inspected fictional evidence",
        );
        await visitCommand(
          supervisor,
          visit.id,
          "complete",
          "Independent report review completed",
        );
        await act(actor("committee.evc"), app.id, "record-recommendation", {
          outcome: "ACCEPTED",
        });
        assert.equal(
          await db.decision.count({ where: { applicationId: app.id } }),
          0,
        );
        await act(actor("committee.evc"), app.id, "complete-stage");
        current = await getApp(supervisor, app.id);
      }
      if (["SAC", "SHC"].includes(current.state)) {
        const member = actor("committee." + current.state.toLowerCase());
        await act(member, app.id, "record-recommendation", {
          outcome: "ACCEPTED",
        });
        assert.equal(
          await db.decision.count({ where: { applicationId: app.id } }),
          0,
        );
        await act(member, app.id, "complete-stage");
      }
      assert.equal((await getApp(authority, app.id)).state, "AUTHORITY");
      await act(authority, app.id, "record-authorized-decision", {
        outcome: "APPROVED",
      });
      assert.equal((await getApp(institution, app.id)).state, "APPROVED");
    }
  } finally {
    await db.demoClock.update({
      where: { id: "current" },
      data: { now: original },
    });
  }
});
test("SMTP failures have bounded attempts and stale obligation revisions are suppressed", async () => {
  const app = await db.application.findFirstOrThrow({
    where: { runId: await runId(), institutionId: "I01" },
  });
  const oldPort = process.env.SMTP_PORT;
  process.env.SMTP_PORT = "1";
  try {
    const o = await db.outbox.create({
      data: {
        applicationId: app.id,
        recipientId: institution.id,
        logicalKey: randomUUID(),
        revision: app.version,
        subjectId: app.id,
        runId: app.runId,
        title: "SMTP failure injection",
      },
    });
    for (let i = 0; i < 4; i++) await deliver(o.id);
    const result = await db.outbox.findUniqueOrThrow({
      where: { id: o.id },
      include: { deliveries: true },
    });
    assert.equal(result.state, "EXHAUSTED");
    assert.equal(result.attempts, 4);
    assert.equal(
      result.deliveries.filter((a) => a.state === "FAILED").length,
      3,
    );
  } finally {
    process.env.SMTP_PORT = oldPort;
  }
  const o = await db.obligation.findFirstOrThrow({
    where: { application: { runId: await runId() } },
  });
  const owner = await db.application.findUniqueOrThrow({
    where: { id: o.applicationId },
  });
  const stale = await db.outbox.create({
    data: {
      applicationId: owner.id,
      recipientId: actor("bureau").id,
      logicalKey: randomUUID(),
      subjectType: "OBLIGATION",
      subjectId: o.id,
      revision: o.revision - 1,
      runId: owner.runId,
      title: "Old obligation revision",
    },
  });
  await deliver(stale.id);
  assert.equal(
    (await db.outbox.findUniqueOrThrow({ where: { id: stale.id } })).state,
    "SUPERSEDED",
  );
});
test("demo scans are logically unique and database blocks immutable audit edits", async () => {
  await scan();
  const before = await db.outbox.count();
  await scan();
  assert.equal(await db.outbox.count(), before);
  const a = await db.audit.findFirstOrThrow();
  await assert.rejects(
    db.audit.update({
      where: { id: a.id },
      data: { reason: "Forbidden history rewrite" },
    }),
  );
});
