import "dotenv/config";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { db } from "../packages/db/index.ts";
import { commandSchema, workflowSchema } from "../packages/contracts/index.ts";
import { csvCell, dateOnlyEnd, hash } from "../packages/domain/engine.ts";
import { scan, deliver } from "../packages/domain/alerts.ts";
const base = "http://127.0.0.1:3000/api";
const credentials = JSON.parse(
  await readFile(".local/demo-credentials.json", "utf8"),
);
class Client {
  cookie = "";
  csrf = "";
  user: any;
  async request(url: string, method = "GET", body?: unknown, key?: string) {
    const res = await fetch(base + url, {
      method,
      headers: {
        Cookie: this.cookie,
        "X-CSRF-Token": this.csrf,
        ...(body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      body:
        body instanceof FormData
          ? body
          : body === undefined
            ? undefined
            : JSON.stringify(body),
    });
    const cookie = res.headers.get("set-cookie");
    if (cookie) this.cookie = cookie.split(";")[0];
    const type = res.headers.get("content-type") ?? "";
    const data = type.includes("json") ? await res.json() : await res.text();
    if (data.csrf) this.csrf = data.csrf;
    return { status: res.status, data };
  }
  async login(prefix: string) {
    await this.request("/session");
    const r = await this.request("/login", "POST", {
      email: prefix + "@anumitra.test",
      password: credentials.password,
    });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    this.user = r.data.user;
    return this;
  }
  async ok(url: string, method = "GET", body?: unknown, key?: string) {
    const r = await this.request(url, method, body, key);
    assert.ok(
      r.status < 300,
      `${method} ${url}: ${r.status} ${JSON.stringify(r.data)}`,
    );
    return r.data;
  }
}
const institution = await new Client().login("institution.a");
const other = await new Client().login("institution.b");
const reviewer = await new Client().login("reviewer.north");
const supervisor = await new Client().login("supervisor.north");
const bureau = await new Client().login("bureau");
const authority = await new Client().login("authority");
const admin = await new Client().login("admin");
const evc = await new Client().login("committee.evc");
const options = await institution.ok("/options");
let sequence = 0;
async function newApp(route = "Only Scrutiny") {
  const wf = options.workflows.find((w: any) => w.name === route);
  return institution.ok("/applications", "POST", {
    institutionId: "I01",
    workflowId: wf.id,
    category: "NEW_INSTITUTION",
    cycle: "2026-27",
    data: {
      contact: "test@fiction.test",
      programme: "Engineering",
      intake: 60,
    },
  });
}
async function upload(id: string, documentId?: string) {
  const f = new FormData();
  f.set("title", "Test campus evidence");
  f.set("kind", "LEASE");
  f.set("validUntil", "2027-12-31");
  if (documentId) f.set("documentId", documentId);
  f.set(
    "file",
    new Blob([Buffer.from("%PDF-1.4\n% Fictional test evidence\n%%EOF")], {
      type: "application/pdf",
    }),
    "test.pdf",
  );
  return institution.ok(`/applications/${id}/documents`, "POST", f);
}
async function cmd(
  c: Client,
  id: string,
  command: string,
  extra: Record<string, unknown> = {},
) {
  const r = await c.ok("/applications/" + id);
  return c.ok(
    `/applications/${id}/commands`,
    "POST",
    {
      command,
      expectedVersion: r.version,
      reason: "Test evidence and authorized action recorded",
      ...extra,
    },
    `test-${++sequence}-${randomUUID()}`,
  );
}
after(async () => {
  await db.$disconnect();
});
test("technical user creation, Mailpit recovery, one-time tokens and SSE session invalidation", async () => {
  const email = `recovery-${randomUUID().slice(0, 8)}@anumitra.test`;
  const created = await admin.ok("/admin/users", "POST", {
    name: "Fictional recovery test",
    email,
  });
  const temp = new Client();
  await temp.request("/session");
  await temp.ok("/login", "POST", { email, password: created.initialPassword });
  const stream = await fetch(base + "/events", {
    headers: { Cookie: temp.cookie },
  });
  assert.equal(stream.status, 200);
  const reader = stream.body!.getReader();
  const first = await reader.read();
  assert.match(new TextDecoder().decode(first.value), /event: ready/);
  await admin.ok("/recovery", "POST", { email });
  const messages = await (
    await fetch("http://127.0.0.1:8025/api/v1/messages")
  ).json();
  const found = messages.messages.find(
    (m: any) =>
      m.Subject === "Anumitra local password recovery" &&
      m.To?.some((t: any) => t.Address === email),
  );
  assert.ok(found, "Recovery captured in Mailpit");
  const message = await (
    await fetch("http://127.0.0.1:8025/api/v1/message/" + found.ID)
  ).json();
  const token = message.Text.match(/recovery=([a-f0-9]{64})/)?.[1];
  assert.ok(token);
  const password = "Fictional-Recovered-Password-942!";
  await admin.ok("/recovery/reset", "POST", { token, password });
  assert.equal(
    (await admin.request("/recovery/reset", "POST", { token, password }))
      .status,
    400,
  );
  assert.equal((await temp.request("/applications")).status, 401);
  let received = "";
  for (let i = 0; i < 4 && !received.includes("event: expired"); i++) {
    const chunk = await reader.read();
    if (chunk.done) break;
    received += new TextDecoder().decode(chunk.value);
  }
  assert.match(received, /event: expired/);
  await reader.cancel();
});
test("master and document metadata imports are previewed and preserve evidence gates", async () => {
  const id = "MASTER-" + randomUUID().slice(0, 8);
  const payload = {
    entity: "institutions",
    format: "json",
    content: JSON.stringify([
      { id, name: "Fictional imported institute", regionId: "R1" },
    ]),
    preview: true,
  };
  await admin.ok("/integrations/master", "POST", payload);
  assert.equal(await db.institution.count({ where: { id } }), 0);
  await admin.ok("/integrations/master", "POST", {
    ...payload,
    preview: false,
  });
  const replay = await admin.ok("/integrations/master", "POST", {
    ...payload,
    preview: false,
  });
  assert.equal(replay.results[0].state, "UNCHANGED");
  const app = await newApp();
  const content = JSON.stringify([
    {
      externalId: randomUUID(),
      applicationId: app.id,
      kind: "AFFIDAVIT",
      title: "Pending adapter metadata",
    },
  ]);
  await institution.ok("/integrations/master", "POST", {
    entity: "documentMetadata",
    format: "json",
    content,
    preview: false,
  });
  const doc = await db.document.findFirstOrThrow({
    where: { applicationId: app.id },
  });
  assert.equal(
    await db.documentVersion.count({ where: { documentId: doc.id } }),
    0,
  );
  const current = await institution.ok("/applications/" + app.id);
  assert.equal(
    (
      await institution.request(
        `/applications/${app.id}/commands`,
        "POST",
        {
          command: "submit",
          expectedVersion: current.version,
          reason: "Must not submit metadata without bytes",
        },
        randomUUID(),
      )
    ).status,
    409,
  );
});
test("contracts reject cycles, unsafe stages, status mass assignment and injection", () => {
  assert.equal(
    workflowSchema.safeParse({
      stages: ["SCRUTINY", "SCRUTINY", "AUTHORITY"],
      deadlineDays: 14,
      reminderDays: 3,
      label: "demo",
    }).success,
    false,
  );
  assert.equal(
    workflowSchema.safeParse({
      stages: ["EVAL"],
      deadlineDays: 14,
      reminderDays: 3,
      label: "demo",
    }).success,
    false,
  );
  assert.equal(
    commandSchema.safeParse({ command: "set-status", expectedVersion: 1 })
      .success,
    false,
  );
  assert.match(csvCell('=HYPERLINK("bad")'), /^"'/);
  assert.equal(
    dateOnlyEnd("2026-10-22").toISOString(),
    "2026-10-22T18:29:59.999Z",
  );
});
test("unauthenticated and CSRF requests are denied", async () => {
  const anonymous = new Client();
  assert.equal((await anonymous.request("/applications")).status, 401);
  assert.equal(
    (
      await anonymous.request("/login", "POST", {
        email: "a@b.test",
        password: "x",
      })
    ).status,
    403,
  );
});
test("scope isolation applies to records, documents, summaries, counts and exports", async () => {
  const app = await newApp();
  const v = await upload(app.id);
  for (const url of [
    `/applications/${app.id}`,
    `/documents/${v.id}/content`,
    `/applications/${app.id}/notice`,
  ])
    assert.equal((await other.request(url)).status, 404);
  assert.equal((await admin.request("/applications/" + app.id)).status, 404);
  assert.equal((await evc.request("/applications/" + app.id)).status, 404);
  const south = await db.application.findFirstOrThrow({
    where: { runId: app.runId, institutionId: "I02" },
  });
  assert.equal(
    (await reviewer.request("/applications/" + south.id)).status,
    404,
  );
  const a = await institution.ok("/applications?limit=100");
  const d = await institution.ok("/dashboard");
  const report = await institution.ok("/reports/pendency");
  assert.equal(a.total, d.total);
  assert.equal(a.total, report.total);
  assert.equal((await institution.ok("/applications?open=true")).total, d.open);
  assert.equal(
    (await institution.ok("/applications?upcoming=true")).total,
    d.upcoming,
  );
  assert.ok(a.items.every((x: any) => x.institutionId === "I01"));
  assert.equal(
    (await institution.request("/applications?sort=passwordHash")).status,
    400,
  );
});
test("persistent scrutiny → deficiency → response → targeted re-scrutiny → authority → conditional decision", async () => {
  const app = await newApp();
  const v1 = await upload(app.id);
  await cmd(institution, app.id, "submit");
  const snapshot = await db.snapshot.findFirstOrThrow({
    where: { applicationId: app.id, kind: "SUBMISSION" },
  });
  await cmd(reviewer, app.id, "raise-deficiency", { item: "LEASE" });
  const returned = await institution.ok("/applications/" + app.id);
  assert.equal(returned.state, "AWAITING_RESPONSE");
  const d = returned.deficiencies[0];
  const v2 = await upload(app.id, v1.documentId);
  assert.equal(v2.reviewState, "PENDING");
  assert.equal(
    (await institution.request(`/documents/${v1.id}/content`)).status,
    403,
  );
  assert.equal(
    (await reviewer.request(`/documents/${v1.id}/content`)).status,
    200,
  );
  await cmd(institution, app.id, "submit-response", {
    deficiencyId: d.id,
    documentVersionId: v2.id,
  });
  assert.equal(
    (await reviewer.ok("/applications/" + app.id)).state,
    "RESCRUTINY",
  );
  await cmd(reviewer, app.id, "verify-response", {
    deficiencyId: d.id,
    outcome: "ACCEPTED",
  });
  await cmd(reviewer, app.id, "review-document", {
    documentVersionId: v2.id,
    outcome: "ACCEPTED",
  });
  const before = await reviewer.ok("/applications/" + app.id);
  const payload = {
    command: "complete-stage",
    expectedVersion: before.version,
    reason: "All targeted deficiencies and current evidence verified",
  };
  const key = randomUUID();
  const first = await reviewer.ok(
    `/applications/${app.id}/commands`,
    "POST",
    payload,
    key,
  );
  const second = await reviewer.ok(
    `/applications/${app.id}/commands`,
    "POST",
    payload,
    key,
  );
  assert.deepEqual(first, second);
  assert.equal(
    (
      await reviewer.request(
        `/applications/${app.id}/commands`,
        "POST",
        { ...payload, reason: "Changed payload must fail" },
        key,
      )
    ).status,
    409,
  );
  const r = await authority.ok("/applications/" + app.id);
  assert.equal(r.state, "AUTHORITY");
  const forged = await bureau.request(
    `/applications/${app.id}/commands`,
    "POST",
    {
      command: "record-authorized-decision",
      expectedVersion: r.version,
      reason: "Unauthorized decision attempt",
      outcome: "APPROVED",
    },
    randomUUID(),
  );
  assert.equal(forged.status, 403);
  const due = new Date(+new Date(options.now) + 20 * 86400000).toISOString();
  await cmd(authority, app.id, "record-authorized-decision", {
    outcome: "CONDITIONAL",
    condition: "Submit a safety undertaking",
    dueAt: due,
  });
  const decided = await institution.ok("/applications/" + app.id);
  assert.equal(decided.state, "CONDITIONAL");
  assert.equal(decided.obligations.length, 1);
  assert.equal(decided.obligations[0].state, "OPEN");
  assert.deepEqual(
    (await db.snapshot.findUniqueOrThrow({ where: { id: snapshot.id } }))
      .content,
    snapshot.content,
  );
  assert.ok(decided.history.some((h: any) => h.action === "raise-deficiency"));
  const obligation = decided.obligations[0];
  await institution.ok(`/obligations/${obligation.id}/commands`, "POST", {
    command: "submit",
    reason: "Safety evidence attached for human review",
    documentVersionId: v2.id,
    expectedRevision: obligation.revision,
  });
  const submitted = await db.obligation.findUniqueOrThrow({
    where: { id: obligation.id },
  });
  assert.equal(submitted.state, "SUBMITTED");
  await supervisor.ok(`/obligations/${obligation.id}/commands`, "POST", {
    command: "accept",
    reason: "Verified the safety undertaking",
    expectedRevision: submitted.revision,
  });
  assert.equal(
    (await db.obligation.findUniqueOrThrow({ where: { id: obligation.id } }))
      .state,
    "ACCEPTED",
  );
});
test("contradictory transitions cannot both commit", async () => {
  const a = await newApp();
  const v = await upload(a.id);
  await cmd(institution, a.id, "submit");
  await cmd(reviewer, a.id, "review-document", {
    documentVersionId: v.id,
    outcome: "ACCEPTED",
  });
  const current = await reviewer.ok("/applications/" + a.id);
  const results = await Promise.all(
    ["complete-stage", "raise-deficiency"].map((command) =>
      reviewer.request(
        `/applications/${a.id}/commands`,
        "POST",
        {
          command,
          expectedVersion: current.version,
          reason: "Concurrent command race",
          ...(command === "raise-deficiency" ? { item: "LEASE" } : {}),
        },
        randomUUID(),
      ),
    ),
  );
  assert.equal(results.filter((x) => x.status === 200).length, 1);
  assert.ok(results.some((x) => [404, 409].includes(x.status)));
});
test("internal observations never reach institution history", async () => {
  const a = await newApp();
  await upload(a.id);
  await cmd(institution, a.id, "submit");
  await reviewer.ok(`/applications/${a.id}/notes`, "POST", {
    reason: "INTERNAL_SECRET_OBSERVATION",
  });
  const visible = await institution.ok("/applications/" + a.id);
  assert.equal(
    JSON.stringify(visible).includes("INTERNAL_SECRET_OBSERVATION"),
    false,
  );
});
test("concurrent EVC reservations are serialized and visit completion requires a report", async () => {
  const a = await newApp("Only EVC");
  const b = await newApp("Only EVC");
  await upload(a.id);
  await upload(b.id);
  await cmd(institution, a.id, "submit");
  await cmd(institution, b.id, "submit");
  const offset = 50 + (Date.now() % 100000) / 100000;
  const startAt = new Date(+new Date(options.now) + offset * 86400000),
    endAt = new Date(+startAt + 3600000);
  const payload = {
    mode: "ONLINE",
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    participants: [evc.user.id],
    metadata: "Local demonstration meeting",
    reason: "Test concurrent EVC booking",
  };
  const result = await Promise.all(
    [a, b].map((x) =>
      supervisor.request(`/applications/${x.id}/visits`, "POST", payload),
    ),
  );
  assert.deepEqual(result.map((x) => x.status).sort(), [201, 409]);
  const visit = result.find((x) => x.status === 201)!.data;
  assert.equal(
    (
      await supervisor.request(`/visits/${visit.id}/complete`, "POST", {
        reason: "Cannot skip report review",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await evc.request(`/visits/${visit.id}/report`, "POST", {
        reason: "Cannot report unconfirmed visit",
      })
    ).status,
    409,
  );
  await supervisor.ok(`/visits/${visit.id}/confirm`, "POST", {
    reason: "Participants have confirmed availability",
  });
  assert.equal(
    (
      await evc.request(`/visits/${visit.id}/report`, "POST", {
        reason: "Visit has not happened yet",
      })
    ).status,
    409,
  );
});
test("published versions are immutable; technical admin cannot publish or decide", async () => {
  const draft = await admin.ok("/rules", "POST", {
    name: "Test immutable " + randomUUID().slice(0, 6),
    source: "DEMO test configuration",
    config: {
      stages: ["SCRUTINY", "AUTHORITY"],
      deadlineDays: 14,
      reminderDays: 3,
      label: "DEMO test",
    },
  });
  assert.equal(
    (await admin.request(`/rules/${draft.id}/publish`, "POST", {})).status,
    403,
  );
  await bureau.ok(`/rules/${draft.id}/publish`, "POST", {});
  assert.equal(
    (
      await admin.request(`/rules/${draft.id}/save`, "POST", {
        config: {
          stages: ["EVC", "AUTHORITY"],
          deadlineDays: 20,
          reminderDays: 3,
          label: "DEMO edit",
        },
      })
    ).status,
    403,
  );
  const simulation = await admin.ok(`/rules/${draft.id}/simulate`, "POST", {
    config: {
      stages: ["EVC", "SHC", "AUTHORITY"],
      deadlineDays: 14,
      reminderDays: 3,
      label: "DEMO simulation",
    },
  });
  assert.equal(simulation.valid, true);
});
test("unsafe file content and unsupported types are rejected without database insert", async () => {
  const a = await newApp();
  const f = new FormData();
  f.set("title", "Unsafe file");
  f.set("kind", "OTHER");
  f.set(
    "file",
    new Blob(["<script>bad()</script>"], { type: "application/pdf" }),
    "fake.pdf",
  );
  assert.equal(
    (await institution.request(`/applications/${a.id}/documents`, "POST", f))
      .status,
    400,
  );
  const pdf = new FormData();
  pdf.set("title", "Active PDF");
  pdf.set("kind", "OTHER");
  pdf.set(
    "file",
    new Blob(["%PDF-1.4\n/JavaScript (danger)"], { type: "application/pdf" }),
    "active.pdf",
  );
  assert.equal(
    (await institution.request(`/applications/${a.id}/documents`, "POST", pdf))
      .status,
    400,
  );
  assert.equal(await db.document.count({ where: { applicationId: a.id } }), 0);
});
test("local import preview has no side effects and replay is idempotent", async () => {
  const row = {
    externalId: "contract-" + randomUUID(),
    institutionId: "I01",
    workflowId: options.workflows[0].id,
    category: "EXTENSION",
    cycle: "2026-27",
    contact: "adapter@fiction.test",
    programme: "Civil Engineering",
    intake: 60,
  };
  const payload = {
    format: "json",
    content: JSON.stringify([row]),
    preview: true,
  };
  const preview = await admin.ok("/integrations/import", "POST", payload);
  assert.equal(preview.results[0].state, "VALID_DRAFT");
  assert.equal(
    await db.externalMapping.count({ where: { externalId: row.externalId } }),
    0,
  );
  const first = await admin.ok("/integrations/import", "POST", {
    ...payload,
    preview: false,
  });
  const second = await admin.ok("/integrations/import", "POST", {
    ...payload,
    preview: false,
  });
  assert.equal(first.results[0].applicationId, second.results[0].applicationId);
  const created = await db.application.findUniqueOrThrow({
    where: { id: first.results[0].applicationId },
  });
  assert.equal(created.state, "DRAFT");
  assert.equal(
    (
      await admin.request("/integrations/import", "POST", {
        ...payload,
        preview: false,
        content: JSON.stringify([{ ...row, state: "APPROVED" }]),
      })
    ).status,
    400,
  );
});
test("stale reminders are superseded and valid notifications reach local SMTP", async () => {
  const a = await newApp();
  await upload(a.id);
  await cmd(institution, a.id, "submit");
  const current = await db.application.findUniqueOrThrow({
    where: { id: a.id },
  });
  const stale = await db.outbox.create({
    data: {
      applicationId: a.id,
      recipientId: institution.user.id,
      logicalKey: randomUUID(),
      revision: current.version - 1,
      subjectId: a.id,
      runId: current.runId,
      title: "Stale test reminder",
    },
  });
  await deliver(stale.id);
  assert.equal(
    (await db.outbox.findUniqueOrThrow({ where: { id: stale.id } })).state,
    "SUPERSEDED",
  );
  const valid = await db.outbox.create({
    data: {
      applicationId: a.id,
      recipientId: institution.user.id,
      logicalKey: randomUUID(),
      revision: current.version,
      subjectId: a.id,
      runId: current.runId,
      title: "Anumitra integration SMTP proof",
    },
  });
  await deliver(valid.id);
  assert.equal(
    (await db.outbox.findUniqueOrThrow({ where: { id: valid.id } })).state,
    "SMTP_ACCEPTED",
  );
  assert.equal(
    await db.notification.count({ where: { logicalKey: valid.logicalKey } }),
    1,
  );
  await deliver(valid.id);
  assert.equal(
    await db.deliveryAttempt.count({
      where: { outboxId: valid.id, state: "SMTP_ACCEPTED" },
    }),
    1,
  );
  await scan();
});
test("demo clock rejects ordinary users and session security version invalidates access", async () => {
  assert.equal(
    (await institution.request("/admin/clock", "POST", { days: 1 })).status,
    403,
  );
  const temporary = await new Client().login("reviewer.south");
  await db.user.update({
    where: { id: temporary.user.id },
    data: { securityVersion: { increment: 1 } },
  });
  assert.equal((await temporary.request("/applications")).status, 401);
});
