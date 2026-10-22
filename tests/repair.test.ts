import "./safety.ts";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile, open } from "node:fs/promises";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import pg from "pg";
import { db } from "../packages/db/index.ts";
import { Client, uploadForm } from "./helpers.ts";
import {
  clock,
  dateOnlyEnd,
  hash,
  getApp,
  runId,
  notify,
} from "../packages/domain/engine.ts";
import { ageing } from "../packages/domain/ageing.ts";
import { scan, deliver } from "../packages/domain/alerts.ts";
import { deadlineSubjects } from "../packages/domain/deadlines.ts";
import { scope, eligible } from "../packages/domain/permissions.ts";
import { documentCompliance } from "../packages/domain/documents.ts";
const institution = await new Client().login("institution.a"),
  supervisor = await new Client().login("supervisor.north"),
  reviewer = await new Client().login("reviewer.north"),
  bureau = await new Client().login("bureau"),
  authority = await new Client().login("authority");
const actors = await db.user.findMany({ include: { grants: true } });
const actor = (prefix: string) =>
  actors.find((u) => u.email === prefix + "@anumitra.test")!;
const original = await clock();
async function time(now: Date) {
  await db.demoClock.update({ where: { id: "current" }, data: { now } });
}
async function prepared() {
  const app = await institution.create();
  const version = await institution.upload(app.id, undefined, "2027-12-31");
  await institution.command(app.id, "submit");
  return { app, version };
}
async function waitFor(
  check: () => Promise<boolean>,
  label: string,
  ms = 25000,
) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.fail("Timed out: " + label);
}
after(async () => {
  await time(original);
  await db.$disconnect();
});

test("calendar validation rejects impossible dates and preserves leap-year IST end of day", () => {
  for (const date of ["2026-02-31", "2026-02-29", "2026-13-10", "2026-04-31"])
    assert.throws(() => dateOnlyEnd(date));
  assert.equal(
    dateOnlyEnd("2028-02-29").toISOString(),
    "2028-02-29T18:29:59.999Z",
  );
  assert.equal(
    dateOnlyEnd("2026-02-28").toISOString(),
    "2026-02-28T18:29:59.999Z",
  );
});

test("authenticated institution-only officials, intersected dimensions, multi-grant union and bounded delegation", async () => {
  const own = await db.application.findFirstOrThrow({
    where: { institutionId: "I01", runId: await runId() },
    include: { institution: true, documents: { include: { versions: true } } },
  });
  const other = await db.application.findFirstOrThrow({
    where: { institutionId: "I02", runId: await runId() },
    include: { documents: { include: { versions: true } } },
  });
  for (const role of ["SUPERVISOR", "BUREAU", "AUTHORITY", "AUDITOR"]) {
    const email = `repair-${role.toLowerCase()}-${randomUUID().slice(0, 6)}@anumitra.test`;
    const user = await db.user.create({
      data: {
        email,
        name: "Fictional bounded official",
        passwordHash: actor("bureau").passwordHash,
        grants: { create: { role, institutionId: "I01" } },
      },
    });
    const client = await new Client().login(email);
    assert.equal((await client.request("/applications/" + own.id)).status, 200);
    assert.equal(
      (await client.request("/applications/" + other.id)).status,
      404,
    );
    const report = await client.ok("/reports/pendency");
    assert.ok(!JSON.stringify(report).includes(other.reference));
    if (other.documents[0])
      assert.equal(
        (
          await client.request(
            "/documents/" + other.documents[0].versions[0].id + "/content",
          )
        ).status,
        404,
      );
    const userActor = await db.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { grants: true },
    });
    assert.ok(Object.keys(scope(userActor)).length > 0);
    if (role === "BUREAU") {
      const result = await client.request("/admin/grants", "POST", {
        userId: actor("auditor").id,
        role: "AUTHORITY",
        global: true,
      });
      assert.equal(result.status, 403);
    }
  }
  const scoped = {
    ...actor("supervisor.north"),
    grants: [
      {
        ...actor("supervisor.north").grants[0],
        institutionId: "I01",
        regionId: "R-SOUTH",
        bureau: null,
        global: false,
      },
    ],
  };
  assert.equal(
    await db.application.count({
      where: { AND: [{ id: own.id }, scope(scoped)] },
    }),
    0,
  );
  assert.equal(eligible(scoped, own, "SCRUTINY"), false);
  scoped.grants.push({
    ...scoped.grants[0],
    regionId: own.institution.regionId,
  });
  assert.equal(
    await db.application.count({
      where: { AND: [{ id: own.id }, scope(scoped)] },
    }),
    1,
  );
  for (const input of [
    { role: "INSTITUTION" },
    { role: "COMMITTEE", regionId: own.institution.regionId },
    { role: "AUDITOR", global: true, institutionId: "I01" },
  ])
    assert.ok(
      (
        await bureau.request("/admin/grants", "POST", {
          userId: actor("auditor").id,
          ...input,
        })
      ).status >= 400,
    );
  const { app } = await prepared();
  const current = await supervisor.ok("/applications/" + app.id);
  assert.equal(
    (
      await supervisor.request(
        `/applications/${app.id}/commands`,
        "POST",
        {
          command: "assign",
          expectedVersion: current.version,
          ownerId: actor("reviewer.south").id,
          reason: "Cross-region assignment must be denied",
        },
        randomUUID(),
      )
    ).status,
    403,
  );
});

test("two rejected responses create disjoint waiting/review intervals, immutable snapshots, replay and concurrency gates", async () => {
  await time(original);
  const { app, version } = await prepared();
  const start = await clock();
  const tick = async (days: number) => time(new Date(+start + days * 86400000));
  await tick(1);
  await reviewer.command(app.id, "raise-deficiency", {
    items: ["LEASE", "CAMPUS"],
  });
  let record = await supervisor.ok("/applications/" + app.id);
  assert.equal(record.deficiencies.length, 2);
  const d = record.deficiencies[0],
    other = record.deficiencies[1];
  await institution.command(app.id, "submit-response", {
    deficiencyId: other.id,
    documentVersionId: version.id,
  });
  for (let cycle = 0; cycle < 3; cycle++) {
    await tick(2 + cycle * 2);
    await institution.command(app.id, "submit-response", {
      deficiencyId: d.id,
      documentVersionId: version.id,
    });
    record = await supervisor.ok("/applications/" + app.id);
    assert.equal(record.state, "RESCRUTINY");
    assert.equal(
      record.attempts.filter((t: any) => t.state === "OPEN").length,
      1,
    );
    await tick(3 + cycle * 2);
    await reviewer.command(app.id, "verify-response", {
      deficiencyId: d.id,
      outcome: cycle < 2 ? "REJECTED" : "ACCEPTED",
    });
    record = await supervisor.ok("/applications/" + app.id);
    assert.equal(record.state, cycle < 2 ? "AWAITING_RESPONSE" : "RESCRUTINY");
    assert.equal(
      record.attempts.filter((t: any) => t.state === "OPEN")[0].stage,
      record.state,
    );
  }
  await reviewer.command(app.id, "verify-response", {
    deficiencyId: other.id,
    outcome: "ACCEPTED",
  });
  const stored = await getApp(actor("supervisor.north"), app.id);
  const ordered = stored.attempts.sort((a, b) => +a.startedAt - +b.startedAt);
  assert.equal(ordered.length, 7);
  for (let i = 1; i < ordered.length; i++)
    assert.equal(+ordered[i - 1].endedAt!, +ordered[i].startedAt);
  const age = ageing(stored, await clock());
  assert.equal(age.institutionDays, 3);
  assert.equal(age.officialDays, 4);
  assert.equal(
    stored.snapshots.filter((s) => s.kind === "SUBMISSION").length,
    1,
  );
  assert.equal(stored.snapshots.filter((s) => s.kind === "RESPONSE").length, 4);
  assert.equal(
    stored.deficiencies
      .find((x) => x.id === d.id)
      ?.responses.filter((r) => r.reviewOutcome === "REJECTED").length,
    2,
  );
  const body = {
      command: "review-document",
      expectedVersion: stored.version,
      reason: "Concurrent authorized verification",
      documentVersionId: version.id,
      outcome: "ACCEPTED",
    },
    key = randomUUID();
  const requests = ["ACCEPTED", "REJECTED"].map((outcome) => ({
    body: { ...body, outcome },
    key: randomUUID(),
  }));
  const results = await Promise.all(
    requests.map((r) =>
      reviewer.request(
        `/applications/${app.id}/commands`,
        "POST",
        r.body,
        r.key,
      ),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const winner = results.findIndex((r) => r.status === 200);
  assert.deepEqual(
    await reviewer.ok(
      `/applications/${app.id}/commands`,
      "POST",
      requests[winner].body,
      requests[winner].key,
    ),
    results[winner].data,
  );
  assert.equal(
    (
      await reviewer.request(
        `/applications/${app.id}/commands`,
        "POST",
        requests[winner].body,
        randomUUID(),
      )
    ).status,
    409,
  );
  await time(original);
});

test("pending and rejected renewals preserve effective expiry; acceptance switches the deadline subject", async () => {
  const { app, version } = await prepared();
  await reviewer.command(app.id, "review-document", {
    documentVersionId: version.id,
    outcome: "ACCEPTED",
  });
  const doc = await db.documentVersion.findUniqueOrThrow({
    where: { id: version.id },
  });
  await time(new Date("2028-01-03T00:00:00Z"));
  await db.application.update({
    where: { id: app.id },
    data: { state: "CONDITIONAL" },
  });
  const pending = await institution.upload(
    app.id,
    doc.documentId,
    "2030-12-31",
  );
  let loaded = await getApp(actor("supervisor.north"), app.id);
  let compliance = documentCompliance(
    loaded.documents[0].versions,
    await clock(),
  );
  assert.equal(compliance.effective?.id, version.id);
  assert.equal(compliance.status, "EXPIRED");
  assert.equal(compliance.renewalPending, true);
  await scan();
  let subjects = await deadlineSubjects({ id: app.id }, await clock());
  assert.ok(subjects.some((s) => s.type === "DOCUMENT" && s.id === version.id));
  const report = await supervisor.ok("/reports/validity");
  assert.ok(JSON.stringify(report).includes("EXPIRED"));
  const overdue = await supervisor.ok("/reports/overdue");
  assert.ok(JSON.stringify(overdue).includes(version.id));
  const oldIntents = await db.outbox.findMany({
    where: { subjectType: "DOCUMENT", subjectId: version.id, state: "QUEUED" },
    select: { id: true },
  });
  assert.ok(oldIntents.length > 0);
  await supervisor.ok(`/documents/${pending.id}/review`, "POST", {
    documentVersionId: pending.id,
    outcome: "REJECTED",
    reason: "Rejected renewal retains expired effective lease",
  });
  assert.equal(
    await db.outbox.count({
      where: { id: { in: oldIntents.map((o) => o.id) }, state: "QUEUED" },
    }),
    oldIntents.length,
  );
  assert.ok(
    await db.escalation.count({
      where: { subjectId: version.id, state: "OPEN" },
    }),
  );
  subjects = await deadlineSubjects({ id: app.id }, await clock());
  assert.ok(subjects.some((s) => s.id === version.id));
  const next = await institution.upload(app.id, doc.documentId);
  subjects = await deadlineSubjects({ id: app.id }, await clock());
  assert.ok(subjects.some((s) => s.id === version.id));
  await supervisor.ok(`/documents/${next.id}/review`, "POST", {
    documentVersionId: next.id,
    outcome: "REJECTED",
    reason: "No expiry supplied; renewal not acceptable",
  });
  const accepted = await institution.upload(
    app.id,
    doc.documentId,
    "2031-01-01",
  );
  await supervisor.ok(`/documents/${accepted.id}/review`, "POST", {
    documentVersionId: accepted.id,
    outcome: "ACCEPTED",
    reason: "Authorized accepted renewal switch regression",
  });
  subjects = await deadlineSubjects({ id: app.id }, await clock());
  assert.ok(!subjects.some((s) => s.id === version.id));
  assert.ok(subjects.some((s) => s.id === accepted.id));
  await scan();
  assert.equal(
    await db.escalation.count({
      where: { subjectId: version.id, state: { in: ["OPEN", "UNASSIGNED"] } },
    }),
    0,
  );
  await time(original);
});

test("upload rejects invalid metadata, foreign ownership, forbidden stage and database rollback without orphan bytes", async () => {
  const app = await institution.create();
  const files = async () =>
    (await readdir(process.env.STORAGE_PATH!))
      .filter((f) => !f.startsWith("."))
      .sort();
  let before = await files();
  assert.equal(
    (
      await institution.request(
        `/applications/${app.id}/documents`,
        "POST",
        uploadForm(undefined, "2026-02-31"),
      )
    ).status,
    400,
  );
  assert.deepEqual(await files(), before);
  const foreign = await db.document.findFirstOrThrow({
    where: { application: { institutionId: "I02" } },
  });
  assert.equal(
    (
      await institution.request(
        `/applications/${app.id}/documents`,
        "POST",
        uploadForm(foreign.id),
      )
    ).status,
    404,
  );
  assert.deepEqual(await files(), before);
  const state = JSON.parse(
    await readFile(
      path.join(process.env.LOCAL_STATE_PATH!, "environment.json"),
      "utf8",
    ),
  );
  const owner = new pg.Client({
    connectionString: state.MIGRATION_DATABASE_URL,
  });
  await owner.connect();
  try {
    await owner.query(
      `CREATE FUNCTION repair_reject_version() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fictional rollback injection'; END $$`,
    );
    await owner.query(
      `CREATE TRIGGER repair_reject_version BEFORE INSERT ON "DocumentVersion" FOR EACH ROW EXECUTE FUNCTION repair_reject_version()`,
    );
    assert.equal(
      (
        await institution.request(
          `/applications/${app.id}/documents`,
          "POST",
          uploadForm(),
        )
      ).status,
      500,
    );
    assert.deepEqual(await files(), before);
    assert.equal(
      await db.document.count({ where: { applicationId: app.id } }),
      0,
    );
  } finally {
    await owner.query(
      'DROP TRIGGER IF EXISTS repair_reject_version ON "DocumentVersion"',
    );
    await owner.query("DROP FUNCTION IF EXISTS repair_reject_version()");
    await owner.end();
  }
  const initialUpload = await institution.upload(app.id);
  const firstVersion = await db.documentVersion.findUniqueOrThrow({
    where: { id: initialUpload.id },
  });
  const renewed = await Promise.all([
    institution.upload(app.id, firstVersion.documentId),
    institution.upload(app.id, firstVersion.documentId),
  ]);
  assert.deepEqual(
    (
      await db.documentVersion.findMany({
        where: { documentId: firstVersion.documentId },
        orderBy: { number: "asc" },
      })
    ).map((v) => v.number),
    [1, 2, 3],
  );
  assert.equal(new Set(renewed.map((v) => v.storageKey)).size, 2);

  await institution.command(app.id, "submit");
  before = await files();
  assert.equal(
    (
      await institution.request(
        `/applications/${app.id}/documents`,
        "POST",
        uploadForm(),
      )
    ).status,
    409,
  );
  assert.deepEqual(await files(), before);
});

test("policy publication binds saved revision/hash, audits draft save and prevents stale lifecycle races", async () => {
  const template = await db.workflow.findFirstOrThrow({
    where: { state: "PUBLISHED" },
  });
  let draft = await bureau.ok("/rules", "POST", {
    name: "Repair policy " + randomUUID(),
    source: "DEMO unverified repair policy",
    config: template.config,
  });
  const simulate = await bureau.ok(`/rules/${draft.id}/simulate`, "POST", {});
  assert.ok(
    (
      await bureau.request(`/rules/${draft.id}/publish`, "POST", {
        expectedRevision: draft.revision,
        expectedHash: simulate.savedHash,
        config: { ...(template.config as any), deadlineDays: 99 },
      })
    ).status >= 400,
  );
  draft = await bureau.ok(`/rules/${draft.id}/save`, "POST", {
    expectedRevision: draft.revision,
    config: { ...(template.config as any), deadlineDays: 19 },
  });
  assert.equal(
    await db.audit.count({
      where: { action: "rule-save", reason: { contains: draft.id } },
    }),
    1,
  );
  const body = {
    expectedRevision: draft.revision,
    expectedHash: draft.contentHash,
  };
  const results = await Promise.all([
    bureau.request(`/rules/${draft.id}/publish`, "POST", body),
    bureau.request(`/rules/${draft.id}/save`, "POST", {
      ...body,
      config: template.config,
    }),
  ]);
  assert.equal(results.filter((r) => r.status === 200).length, 1);
  const saved = await db.workflow.findUniqueOrThrow({
    where: { id: draft.id },
  });
  if (saved.state === "DRAFT")
    await bureau.ok(`/rules/${draft.id}/publish`, "POST", {
      expectedRevision: saved.revision,
      expectedHash: (await bureau.ok(`/rules/${draft.id}/simulate`, "POST", {}))
        .savedHash,
    });
  assert.equal(
    (
      await bureau.request(`/rules/${draft.id}/save`, "POST", {
        expectedRevision: saved.revision,
        config: template.config,
      })
    ).status,
    403,
  );
});

test("actual pg-boss completed failed job retries in a new generation with one inbox and retained attempt history", async () => {
  const { app } = await prepared();
  const record = await db.application.findUniqueOrThrow({
    where: { id: app.id },
  });
  await db.outbox.updateMany({
    where: { state: { in: ["QUEUED", "FAILED"] } },
    data: { state: "SUPERSEDED" },
  });
  await db.$transaction((tx) =>
    notify(
      tx,
      record,
      "Repair worker recovery test",
      randomUUID(),
      "APPLICATION",
      app.id,
      record.version,
      ["INSTITUTION"],
    ),
  );
  const intent = await db.outbox.findFirstOrThrow({
    where: { applicationId: app.id, state: "QUEUED" },
  });
  const children: ChildProcess[] = [];
  const worker = async (port: string) => {
    const log = await open(
      path.join(process.env.LOCAL_STATE_PATH!, "repair-worker.log"),
      "a",
    );
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "apps/worker/src/index.ts"],
      {
        env: { ...process.env, SMTP_PORT: port },
        windowsHide: true,
        stdio: ["ignore", log.fd, log.fd],
      },
    );
    children.push(child);
    await log.close();
    return child;
  };
  const stop = async (child: ChildProcess) => {
    child.kill();
    await new Promise<void>((resolve) => {
      child.once("exit", () => resolve());
      setTimeout(resolve, 2000);
    });
  };
  try {
    const failing = await worker("1199");
    await waitFor(async () => {
      const row = await db.outbox.findUniqueOrThrow({
        where: { id: intent.id },
      });
      if (row.state !== "FAILED" || !row.jobId) return false;
      const job: any[] =
        await db.$queryRaw`SELECT state FROM pgboss.job WHERE id=${row.jobId}::uuid`;
      return job[0]?.state === "completed";
    }, "SMTP failure with completed transport");
    await stop(failing);
    let row = await db.outbox.findUniqueOrThrow({ where: { id: intent.id } });
    const oldJob = row.jobId;
    const retried = await supervisor.ok(`/deliveries/${row.id}/retry`, "POST", {
      expectedGeneration: row.generation,
      reason: "Deliberate retry after failed local SMTP",
    });
    row = await db.outbox.findUniqueOrThrow({ where: { id: intent.id } });
    assert.equal(row.generation, 2);
    assert.equal(row.jobId, null);
    assert.ok(row.attempts >= 1);
    const healthy = await worker(process.env.SMTP_PORT!);
    await waitFor(
      async () =>
        (await db.outbox.findUniqueOrThrow({ where: { id: intent.id } }))
          .state === "SMTP_ACCEPTED",
      "new generation accepted by Mailpit",
    );
    await stop(healthy);
    row = await db.outbox.findUniqueOrThrow({ where: { id: intent.id } });
    assert.notEqual(row.jobId, oldJob);
    assert.equal(
      await db.notification.count({ where: { logicalKey: row.logicalKey } }),
      1,
    );
    const history = await db.deliveryAttempt.findMany({
      where: { outboxId: row.id },
    });
    assert.ok(history.some((h) => h.generation === 1 && h.state === "FAILED"));
    assert.ok(
      history.some((h) => h.generation === 2 && h.state === "SMTP_ACCEPTED"),
    );

    await db.outbox.update({
      where: { id: row.id },
      data: { state: "EXHAUSTED" },
    });
    await supervisor.ok(`/deliveries/${row.id}/retry`, "POST", {
      expectedGeneration: 2,
      reason: "Retry an exhausted intent using a new generation",
    });
    const environment = JSON.parse(
      await readFile(
        path.join(process.env.LOCAL_STATE_PATH!, "environment.json"),
        "utf8",
      ),
    );
    const owner = new pg.Client({
      connectionString: environment.MIGRATION_DATABASE_URL,
    });
    await owner.connect();
    try {
      await owner.query(
        `CREATE FUNCTION repair_smtp_ack_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.state='SMTP_ACCEPTED' AND NEW."outboxId"='${row.id}' THEN RAISE EXCEPTION 'Synthetic acknowledgement failure after SMTP acceptance'; END IF; RETURN NEW; END $$`,
      );
      await owner.query(
        'CREATE TRIGGER repair_smtp_ack_failure BEFORE INSERT ON "DeliveryAttempt" FOR EACH ROW EXECUTE FUNCTION repair_smtp_ack_failure()',
      );
      const uncertain = await worker(process.env.SMTP_PORT!);
      await waitFor(
        async () =>
          (await db.outbox.findUniqueOrThrow({ where: { id: row.id } }))
            .state === "AMBIGUOUS",
        "SMTP acceptance with failed acknowledgement persistence",
      );
      await stop(uncertain);
    } finally {
      await owner.query(
        'DROP TRIGGER IF EXISTS repair_smtp_ack_failure ON "DeliveryAttempt"',
      );
      await owner.query("DROP FUNCTION IF EXISTS repair_smtp_ack_failure()");
      await owner.end();
    }
    assert.ok(
      (
        await supervisor.request(`/deliveries/${row.id}/retry`, "POST", {
          expectedGeneration: 3,
          reason: "Ambiguous retry without disclosure",
        })
      ).status >= 400,
    );
    await supervisor.ok(`/deliveries/${row.id}/retry`, "POST", {
      expectedGeneration: 3,
      acknowledgeDuplicate: true,
      reason: "Operator acknowledges possible duplicate SMTP delivery",
    });
    const recovered = await worker(process.env.SMTP_PORT!);
    await waitFor(
      async () =>
        (await db.outbox.findUniqueOrThrow({ where: { id: row.id } })).state ===
        "SMTP_ACCEPTED",
      "deliberate retry after uncertain acceptance",
    );
    await stop(recovered);
    const final = await db.outbox.findUniqueOrThrow({ where: { id: row.id } });
    assert.equal(final.generation, 4);
    assert.equal(
      await db.notification.count({ where: { logicalKey: row.logicalKey } }),
      1,
    );
    assert.ok(
      await db.deliveryAttempt.count({
        where: { outboxId: row.id, generation: 3, state: "AMBIGUOUS" },
      }),
    );
    const interrupted = await db.outbox.create({
      data: {
        applicationId: app.id,
        recipientId: actor("institution.a").id,
        logicalKey: randomUUID(),
        revision: record.version,
        subjectId: app.id,
        runId: record.runId,
        state: "ATTEMPTED",
        title: "Synthetic worker interruption at committed attempt boundary",
      },
    });
    const restarted = await worker(process.env.SMTP_PORT!);
    await waitFor(
      async () =>
        (await db.outbox.findUniqueOrThrow({ where: { id: interrupted.id } }))
          .state === "AMBIGUOUS",
      "restart conservatively recovers interrupted attempt",
    );
    await stop(restarted);
    assert.ok(
      await db.deliveryAttempt.count({
        where: { outboxId: interrupted.id, state: "AMBIGUOUS" },
      }),
    );
  } finally {
    for (const child of children)
      if (child.exitCode === null) await stop(child);
  }
});

test("negative verification is deliberately referred for a human rejection; old committee recommendations cannot satisfy a new attempt", async () => {
  const { app, version } = await prepared();
  await reviewer.command(app.id, "review-document", {
    documentVersionId: version.id,
    outcome: "REJECTED",
  });
  const current = await supervisor.ok("/applications/" + app.id);
  const denied = await authority.request(
    `/applications/${app.id}/commands`,
    "POST",
    {
      command: "record-authorized-decision",
      expectedVersion: current.version,
      outcome: "REJECTED",
      reason: "Cannot decide before human authority stage",
    },
    randomUUID(),
  );
  assert.equal(denied.status, 403);
  assert.ok(
    (
      await reviewer.request(
        `/applications/${app.id}/commands`,
        "POST",
        {
          command: "complete-stage",
          expectedVersion: current.version,
          reason: "Positive progression cannot bypass adverse evidence",
        },
        randomUUID(),
      )
    ).status >= 400,
  );
  await reviewer.command(app.id, "refer-adverse");
  await authority.command(app.id, "record-authorized-decision", {
    outcome: "REJECTED",
  });
  const rejected = await getApp(actor("authority"), app.id);
  assert.equal(rejected.state, "REJECTED");
  assert.equal(rejected.attempts.filter((x) => x.state === "OPEN").length, 0);
  assert.ok(
    JSON.stringify(rejected.decisions[0]?.snapshot).includes("REJECTED"),
  );
  const evc = await new Client().login("committee.evc");
  const second = await institution.create("Only EVC");
  const evidence = await institution.upload(second.id);
  await institution.command(second.id, "submit");
  await supervisor.ok(`/documents/${evidence.id}/review`, "POST", {
    outcome: "REJECTED",
    reason: "Recorded adverse EVC evidence for human consideration",
  });
  await db.visit.create({
    data: {
      applicationId: second.id,
      state: "COMPLETED",
      mode: "ONLINE",
      startAt: original,
      endAt: new Date(+original + 1000),
      metadata: "Fictional completed inspection fixture",
      reason: "Test fixture for current-attempt prerequisite",
      report: "Inspected; adverse evidence retained",
    },
  });
  await db.recommendation.create({
    data: {
      applicationId: second.id,
      actorId: actor("committee.evc").id,
      stage: "EVC",
      attemptId: randomUUID(),
      outcome: "REJECTED",
      reason: "Historical recommendation must not satisfy current attempt",
    },
  });
  const before = await evc.ok("/applications/" + second.id);
  assert.ok(
    (
      await evc.request(
        `/applications/${second.id}/commands`,
        "POST",
        {
          command: "complete-stage",
          expectedVersion: before.version,
          reason: "Historical recommendation is insufficient",
        },
        randomUUID(),
      )
    ).status >= 400,
  );
  await evc.command(second.id, "record-recommendation", {
    outcome: "REJECTED",
  });
  await evc.command(second.id, "complete-stage");
  assert.equal(
    (await authority.ok("/applications/" + second.id)).state,
    "AUTHORITY",
  );
  await authority.command(second.id, "record-authorized-decision", {
    outcome: "REJECTED",
  });
});

test("escalation grace preserves overdue visibility, routes designated officials, deduplicates notes and audits acknowledgement/closure", async () => {
  await time(original);
  const base = await db.workflow.findFirstOrThrow({
    where: { name: "Only Scrutiny", state: "PUBLISHED" },
  });
  let draft = await bureau.ok("/rules", "POST", {
    name: "Grace regression " + randomUUID(),
    source: "DEMO grace and stage windows",
    config: {
      ...(base.config as any),
      windows: { SCRUTINY: 2, RESPONSE: 5 },
      escalationLevels: [
        { afterDays: 2, role: "SUPERVISOR" },
        { afterDays: 4, role: "BUREAU" },
      ],
    },
  });
  const sim = await bureau.ok(`/rules/${draft.id}/simulate`, "POST", {});
  await bureau.ok(`/rules/${draft.id}/publish`, "POST", {
    expectedRevision: draft.revision,
    expectedHash: sim.savedHash,
  });
  const app = await institution.create(draft.name);
  await institution.upload(app.id);
  await institution.command(app.id, "submit");
  const submitted = await db.application.findUniqueOrThrow({
    where: { id: app.id },
  });
  assert.equal(+submitted.dueAt!, +original + 2 * 86400000);
  await time(new Date(+original + 3 * 86400000));
  await scan();
  assert.equal(
    await db.escalation.count({
      where: { subjectType: "APPLICATION", subjectId: app.id },
    }),
    0,
  );
  const report = await supervisor.ok("/reports/overdue");
  assert.ok(report.rows.some((r: any) => r.subjectId === app.id));
  assert.ok(
    await db.outbox.count({
      where: {
        subjectId: app.id,
        eventKind: "DEADLINE",
        title: { contains: "OVERDUE" },
      },
    }),
  );
  await time(new Date(+original + 4 * 86400000));
  await scan();
  const event = await db.escalation.findFirstOrThrow({
    where: { subjectId: app.id, level: 1 },
  });
  assert.equal(event.recipientRole, "SUPERVISOR");
  assert.ok(
    (event.recipientIds as string[]).includes(actor("supervisor.north").id),
  );
  assert.ok(!(event.recipientIds as string[]).includes(actor("auditor").id));
  const count = await db.outbox.count({
    where: { subjectId: app.id, eventKind: "DEADLINE" },
  });
  await supervisor.command(app.id, "assign", {
    ownerId: actor("reviewer.north").id,
  });
  await scan();
  assert.equal(
    await db.outbox.count({
      where: { subjectId: app.id, eventKind: "DEADLINE" },
    }),
    count,
  );
  assert.equal(
    (await db.application.findUniqueOrThrow({ where: { id: app.id } }))
      .deadlineRevision,
    submitted.deadlineRevision,
  );
  await supervisor.ok(`/escalations/${event.id}/acknowledge`, "POST", {
    expectedState: event.state,
    reason: "Responsible official reviewed the overdue subject",
  });
  await scan();
  assert.equal(
    (await db.escalation.findUniqueOrThrow({ where: { id: event.id } })).state,
    "ACKNOWLEDGED",
  );
  await reviewer.command(app.id, "raise-deficiency", {
    item: "Lease needs corrected evidence",
  });
  assert.equal(
    (await db.escalation.findUniqueOrThrow({ where: { id: event.id } })).state,
    "RESOLVED",
  );
  assert.equal(
    await db.outbox.count({
      where: { subjectId: app.id, eventKind: "DEADLINE", state: "QUEUED" },
    }),
    0,
  );
  assert.ok(
    await db.audit.count({
      where: { applicationId: app.id, action: "escalation-acknowledged" },
    }),
  );
  await time(original);
});

test("consolidated overdue reconciles post-decision undertakings and effective documents on one case", async () => {
  await time(original);
  const { app, version } = await prepared();
  await reviewer.command(app.id, "review-document", {
    documentVersionId: version.id,
    outcome: "ACCEPTED",
  });
  await reviewer.command(app.id, "complete-stage");
  await authority.command(app.id, "record-authorized-decision", {
    outcome: "CONDITIONAL",
    condition: "Fictional additional campus undertaking",
    dueAt: new Date(+original + 86400000).toISOString(),
  });
  await time(new Date("2028-01-03T00:00:00Z"));
  await scan();
  const obligation = await db.obligation.findFirstOrThrow({
    where: { applicationId: app.id },
  });
  const before = await supervisor.ok("/reports/overdue");
  const rows = before.rows.filter((r: any) => r.reference === app.reference);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r: any) => r.subjectType).sort(), [
    "DOCUMENT",
    "OBLIGATION",
  ]);
  assert.equal(before.countUnit, "deadline subjects");
  const filtered = await supervisor.ok("/applications?overdue=true&limit=100");
  assert.ok(filtered.items.some((r: any) => r.id === app.id));
  const csv = await supervisor.ok("/reports/overdue?format=csv");
  assert.ok(csv.includes(obligation.id) && csv.includes(version.id));
  await authority.ok(`/obligations/${obligation.id}/commands`, "POST", {
    command: "waive",
    expectedRevision: obligation.revision,
    reason: "Human authority reasoned waiver for synthetic condition",
  });
  assert.equal(
    await db.outbox.count({
      where: {
        subjectId: obligation.id,
        state: "QUEUED",
        eventKind: "DEADLINE",
      },
    }),
    0,
  );
  const after = await supervisor.ok("/reports/overdue");
  assert.equal(
    after.rows.filter((r: any) => r.reference === app.reference).length,
    1,
  );
  await time(original);
});

test("compatible policy migration preserves due time, revises deadline identity and retains pins through retirement", async () => {
  await time(original);
  const { app } = await prepared();
  const current = await bureau.ok("/applications/" + app.id);
  let draft = await bureau.ok("/rules", "POST", {
    name: "Migration fixture " + randomUUID(),
    source: "DEMO compatible policy migration",
    config: {
      ...current.workflow.config,
      deadlineDays: 21,
      windows: { SCRUTINY: 21 },
    },
  });
  const sim = await bureau.ok(`/rules/${draft.id}/simulate`, "POST", {});
  await bureau.ok(`/rules/${draft.id}/publish`, "POST", {
    expectedRevision: draft.revision,
    expectedHash: sim.savedHash,
  });
  const migrated = await bureau.ok(
    `/applications/${app.id}/migrate-policy`,
    "POST",
    {
      workflowId: draft.id,
      expectedVersion: current.version,
      reason: "Explicit migration keeps the current due time for fairness",
    },
  );
  assert.equal(migrated.dueAt, current.dueAt);
  assert.equal(migrated.deadlineRevision, current.deadlineRevision + 1);
  assert.equal(migrated.workflowId, draft.id);
  const incompatible = await db.workflow.findFirstOrThrow({
    where: { name: "Only EVC", state: "PUBLISHED" },
  });
  assert.equal(
    (
      await bureau.request(`/applications/${app.id}/migrate-policy`, "POST", {
        workflowId: incompatible.id,
        expectedVersion: migrated.version,
        reason: "Incompatible current-stage migration must be rejected",
      })
    ).status,
    409,
  );
  const saved = await db.workflow.findUniqueOrThrow({
    where: { id: draft.id },
  });
  const simulated = await bureau.ok(`/rules/${draft.id}/simulate`, "POST", {});
  const body = {
    expectedRevision: saved.revision,
    expectedHash: simulated.savedHash,
  };
  const retired = await Promise.all([
    bureau.request(`/rules/${draft.id}/retire`, "POST", body),
    bureau.request(`/rules/${draft.id}/retire`, "POST", body),
  ]);
  assert.deepEqual(retired.map((r) => r.status).sort(), [200, 409]);
  assert.equal(
    (await bureau.ok("/applications/" + app.id)).workflowId,
    draft.id,
  );
  assert.ok(
    await db.audit.count({
      where: { applicationId: app.id, action: "migrate-policy" },
    }),
  );
});

test("authenticated mixed grants preserve per-case internal visibility and scoped SSE counts", async () => {
  const own = await db.application.findFirstOrThrow({
      where: { institutionId: "I01", runId: await runId() },
    }),
    other = await db.application.findFirstOrThrow({
      where: { institutionId: "I02", runId: await runId() },
    });
  const email = "mixed-" + randomUUID() + "@anumitra.test";
  await db.user.create({
    data: {
      email,
      name: "Fictional mixed-role official",
      passwordHash: actor("bureau").passwordHash,
      grants: {
        create: [
          { role: "AUTHORITY", institutionId: "I01" },
          { role: "INSTITUTION", institutionId: "I02" },
        ],
      },
    },
  });
  const client = await new Client().login(email);
  const internal = await db.audit.create({
    data: {
      applicationId: own.id,
      actorId: actor("supervisor.north").id,
      scope: { test: true },
      action: "repair-private-note",
      reason:
        "Synthetic internal observation visible through the official grant only",
      correlationId: randomUUID(),
    },
  });
  const otherInternal = await db.audit.create({
    data: {
      applicationId: other.id,
      actorId: actor("supervisor.south").id,
      scope: { test: true },
      action: "repair-private-note",
      reason: "Synthetic institution-private internal observation",
      correlationId: randomUUID(),
    },
  });
  const ownView = await client.ok("/applications/" + own.id),
    otherView = await client.ok("/applications/" + other.id);
  assert.ok(ownView.history.some((h: any) => h.id === internal.id));
  assert.ok(!otherView.history.some((h: any) => h.id === otherInternal.id));
  const audits = await client.ok("/audits");
  assert.ok(audits.some((h: any) => h.id === internal.id));
  assert.ok(!audits.some((h: any) => h.id === otherInternal.id));
  const expected = await db.application.count({
    where: { runId: await runId(), institutionId: { in: ["I01", "I02"] } },
  });
  const controller = new AbortController();
  const response = await fetch(process.env.TEST_API_ORIGIN + "/api/events", {
    headers: { Cookie: client.cookie },
    signal: controller.signal,
  });
  const reader = response.body!.getReader();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    let data = "";
    while (!data.includes("event: refresh")) {
      const chunk = await reader.read();
      assert.equal(chunk.done, false);
      data += new TextDecoder().decode(chunk.value);
    }
    const event = JSON.parse(
      data.split("event: refresh\ndata: ")[1].split("\n")[0],
    );
    assert.equal(event.count, expected);
  } finally {
    clearTimeout(timer);
    await reader.cancel();
    controller.abort();
  }
});

test("acceptance atomically resolves missing-acceptance alerts and a reviewed version cannot be rewritten", async () => {
  await time(original);
  const { app, version } = await prepared();
  const doc = await db.documentVersion.findUniqueOrThrow({
    where: { id: version.id },
  });
  await time(new Date(+original + 8 * 86400000));
  await scan();
  assert.ok(
    await db.outbox.count({
      where: {
        subjectType: "DOCUMENT_REVIEW",
        subjectId: doc.documentId,
        state: "QUEUED",
      },
    }),
  );
  await reviewer.command(app.id, "review-document", {
    documentVersionId: version.id,
    outcome: "ACCEPTED",
  });
  assert.equal(
    await db.outbox.count({
      where: {
        subjectType: "DOCUMENT_REVIEW",
        subjectId: doc.documentId,
        state: "QUEUED",
      },
    }),
    0,
  );
  assert.equal(
    await db.escalation.count({
      where: {
        subjectType: "DOCUMENT_REVIEW",
        subjectId: doc.documentId,
        state: { in: ["OPEN", "UNASSIGNED"] },
      },
    }),
    0,
  );
  assert.equal(
    (
      await supervisor.request(`/documents/${version.id}/review`, "POST", {
        outcome: "REJECTED",
        reason: "Cannot replace an immutable prior verification",
      })
    ).status,
    409,
  );
  const review = await db.documentReview.findFirstOrThrow({
    where: { versionId: version.id },
  });
  await assert.rejects(
    db.documentReview.update({
      where: { id: review.id },
      data: { outcome: "REJECTED" },
    }),
  );
  assert.equal(
    (await db.documentVersion.findUniqueOrThrow({ where: { id: version.id } }))
      .reviewState,
    "ACCEPTED",
  );
  await time(original);
});

test("reasoned visit cancellation atomically closes reminders, releases reservations and restores scheduling monitoring", async () => {
  await time(original);
  const app = await institution.create("Only EVC");
  await institution.upload(app.id);
  await institution.command(app.id, "submit");
  const before = await db.application.findUniqueOrThrow({
    where: { id: app.id },
  });
  const latest = await db.reservation.findFirst({
    where: { active: true },
    orderBy: { endAt: "desc" },
  });
  const start = new Date(
      Math.max(
        +original + 3 * 86400000,
        +(latest?.endAt ?? original) + 86400000,
      ),
    ),
    end = new Date(+start + 3600000);
  const visit = await supervisor.ok(`/applications/${app.id}/visits`, "POST", {
    mode: "ONLINE",
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    participants: [actor("committee.evc").id],
    metadata: "Fictional cancellation fixture",
    reason: "Coordinated appointment for cancellation regression",
  });
  await time(new Date(+start + 1000));
  await scan();
  assert.ok(
    await db.outbox.count({
      where: { subjectType: "VISIT", subjectId: visit.id, state: "QUEUED" },
    }),
  );
  assert.equal(
    (
      await authority.request(`/visits/${visit.id}/cancel`, "POST", {
        reason: "Authority role alone cannot schedule/cancel visits",
      })
    ).status,
    403,
  );
  await supervisor.ok(`/visits/${visit.id}/cancel`, "POST", {
    reason: "Committee availability changed; retain appointment history",
  });
  assert.equal(
    (await db.visit.findUniqueOrThrow({ where: { id: visit.id } })).state,
    "CANCELLED",
  );
  assert.equal(
    await db.reservation.count({ where: { visitId: visit.id, active: true } }),
    0,
  );
  assert.equal(
    await db.outbox.count({
      where: { subjectType: "VISIT", subjectId: visit.id, state: "QUEUED" },
    }),
    0,
  );
  assert.equal(
    await db.escalation.count({
      where: {
        subjectType: "VISIT",
        subjectId: visit.id,
        state: { in: ["OPEN", "UNASSIGNED"] },
      },
    }),
    0,
  );
  const after = await db.application.findUniqueOrThrow({
    where: { id: app.id },
  });
  assert.equal(after.deadlineRevision, before.deadlineRevision + 1);
  assert.equal(+after.dueAt!, +before.dueAt!);
  assert.ok(
    (await deadlineSubjects({ id: app.id }, await clock())).some(
      (s) => s.type === "APPLICATION",
    ),
  );
  assert.equal(
    (
      await supervisor.request(`/visits/${visit.id}/cancel`, "POST", {
        reason: "Duplicate cancellation cannot change deadline again",
      })
    ).status,
    409,
  );
  await time(original);
});
