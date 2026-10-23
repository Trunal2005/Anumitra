import { readFileSync, writeFileSync, openSync, closeSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import net from "node:net";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { assertTestTarget } from "../../../scripts/isolated-env.mjs";
import { sourceState } from "../../../scripts/source-state.mjs";
import { createHash } from "node:crypto";
const implementation = sourceState();
assert.equal(
  implementation.sourceDigest,
  "8ab13929135abb6c076b208ee604acbace3ededfcb543056559e34b7d742a542",
  "This audit probe requires its reviewed implementation source",
);
const directory = readFileSync(".local/current-test-target", "utf8").trim();
const environment = JSON.parse(
  readFileSync(path.join(directory, "environment.json"), "utf8"),
);
assertTestTarget(environment.DATABASE_URL);
assert.equal(environment.ANUMITRA_TEST_TARGET, "disposable");
await new Promise((resolve, reject) => {
  const socket = net.createServer();
  socket.once("error", reject);
  socket.listen(3100, "127.0.0.1", () => socket.close(resolve));
});
Object.assign(process.env, environment);
const runtime = { ...process.env };
delete runtime.MIGRATION_DATABASE_URL;
delete runtime.RUNTIME_DATABASE_URL;
delete runtime.PGPASSWORD;
const log = openSync(path.join(directory, "audit-api.log"), "a");
const api = spawn(
  process.execPath,
  ["--import", "tsx", "apps/api/src/index.ts"],
  { env: runtime, windowsHide: true, stdio: ["ignore", log, log] },
);
closeSync(log);
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(environment.TEST_API_ORIGIN + "/api/health")).ok) break;
    } catch {}
    if (i === 99) throw Error("Owned isolated API unavailable");
    await new Promise((r) => setTimeout(r, 200));
  }
  const { Client, credentials } = await import("../../../tests/helpers.ts");
  const authority = await new Client().login("authority");
  const supervisor = await new Client().login("supervisor.north");
  const institution = await new Client().login("institution.a");
  const reviewer = await new Client().login("reviewer.north");
  const options = await institution.ok("/options");
  const fixture = await institution.create("Only Scrutiny");
  const evidence = await institution.upload(
    fixture.id,
    undefined,
    new Date(Date.parse(options.now) + 365 * 86400000)
      .toISOString()
      .slice(0, 10),
  );
  await institution.command(fixture.id, "submit");
  await reviewer.command(fixture.id, "review-document", {
    documentVersionId: evidence.id,
    outcome: "ACCEPTED",
  });
  await reviewer.command(fixture.id, "complete-stage");
  await authority.command(fixture.id, "record-authorized-decision", {
    outcome: "CONDITIONAL",
    condition: "Fictional repeatable audit undertaking " + fixture.id,
    dueAt: new Date(Date.parse(options.now) + 7 * 86400000).toISOString(),
  });
  const obligations = await authority.ok("/obligations");
  const before = obligations.find(
    (o) => o.state === "OPEN" && o.applicationId === fixture.id,
  );
  assert.ok(
    before,
    "Authenticated fixture must create its decision-linked open obligation",
  );
  const future = new Date(
    Math.ceil(
      (Math.max(Date.now(), Date.parse(before.dueAt)) + 30 * 86400000) / 60000,
    ) * 60000,
  );
  const localDate = new Date(+future + 330 * 60000).toISOString().slice(0, 16);
  const denied = await supervisor.request(
    `/obligations/${before.id}/commands`,
    "POST",
    {
      command: "extend",
      expectedRevision: before.revision,
      dueAt: future.toISOString(),
      reason: "Fictional supervisor must not extend authority conditions",
    },
  );
  assert.equal(denied.status, 403);
  const invalid = await authority.request(
    `/obligations/${before.id}/commands`,
    "POST",
    {
      command: "extend",
      expectedRevision: before.revision,
      dueAt: before.dueAt,
      reason: "Fictional unchanged deadline is not an extension",
    },
  );
  assert.equal(invalid.status, 409);
  assert.equal(invalid.data.error, "Extension must be later");
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    timezoneId: "Asia/Kolkata",
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(environment.TEST_API_ORIGIN);
  await page.getByLabel("Email address").fill("authority@anumitra.test");
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Enter your workspace" }).click();
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
  await page.goto(environment.TEST_API_ORIGIN + "/compliance");
  const card = page
    .locator(".obligation-card")
    .filter({
      has: page.getByRole("link", {
        name: before.application.reference,
        exact: true,
      }),
    })
    .filter({ hasText: before.condition });
  await expect(card).toHaveCount(1);
  async function commit(command, revision) {
    const response = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname ===
          `/api/obligations/${before.id}/commands` &&
        r.request().method() === "POST",
    );
    const read = page.waitForResponse(async (r) => {
      if (
        new URL(r.url()).pathname !== "/api/obligations" ||
        r.request().method() !== "GET" ||
        r.status() !== 200
      )
        return false;
      try {
        return (await r.json()).some(
          (o) => o.id === before.id && o.revision === revision,
        );
      } catch {
        return false;
      }
    });
    const [saved] = await Promise.all([
      response,
      read,
      card
        .getByRole("button", { name: "Record " + command, exact: true })
        .click(),
    ]);
    assert.equal(saved.status(), 200);
    return saved.json();
  }
  await card.getByLabel("Authorized action").selectOption("extend");
  await card.getByLabel("Revised due (browser timezone)").fill(localDate);
  await card
    .getByLabel("Evidence explanation / review reason")
    .fill("Fictional authority extension through actual browser form");
  const extended = await commit("extend", before.revision + 1);
  assert.equal(extended.dueAt, future.toISOString());
  assert.equal(extended.originalDueAt, before.originalDueAt);
  assert.equal(extended.revisions.length, before.revisions.length + 1);
  const displayed =
    future.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " IST";
  await expect(card.getByText(displayed, { exact: true })).toBeVisible();
  await card.screenshot({
    path: "docs/evidence/audit-2026-10-23/undertaking-extension.png",
  });
  await card.getByLabel("Authorized action").selectOption("waive");
  await card
    .getByLabel("Evidence explanation / review reason")
    .fill("Fictional authority reasoned waiver through actual browser form");
  const waived = await commit("waive", before.revision + 2);
  assert.equal(waived.state, "WAIVED");
  await expect(card.getByText("WAIVED", { exact: true })).toBeVisible();
  await expect(card.getByLabel("Authorized action")).toHaveCount(0);
  const closed = await authority.request(
    `/obligations/${before.id}/commands`,
    "POST",
    {
      command: "extend",
      expectedRevision: waived.revision,
      dueAt: new Date(+future + 86400000).toISOString(),
      reason: "Fictional closed condition must stay closed",
    },
  );
  assert.equal(closed.status, 409);
  assert.equal(closed.data.error, "Closed condition cannot change");
  const application = await authority.ok(
    "/applications/" + before.applicationId,
  );
  assert.ok(application.history.some((a) => a.action === "obligation-extend"));
  assert.ok(application.history.some((a) => a.action === "obligation-waive"));
  assert.deepEqual(errors, []);
  const report = {
    checkedAt: new Date(),
    applicationSourceCommit: implementation.gitHead,
    sourceDigest: implementation.sourceDigest,
    probeSha256: createHash("sha256")
      .update(readFileSync(new URL(import.meta.url)))
      .digest("hex"),
    isolatedDatabase: new URL(environment.DATABASE_URL).pathname,
    normalDemoTouched: false,
    checks: [
      "Supervisor extension denied 403",
      "Non-later authority extension denied 409",
      "Actual authority UI extension committed 200",
      "Original deadline preserved and revision history appended",
      "Extended deadline rendered in IST",
      "Actual authority UI waiver committed 200",
      "Closed UI action removed and further extension denied 409",
      "Both human actions present in audit",
      "No browser page errors",
    ],
  };
  writeFileSync(
    "docs/evidence/audit-2026-10-23/undertaking-ui.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} finally {
  if (browser) await browser.close();
  api.kill();
  await new Promise((r) => {
    api.once("exit", r);
    setTimeout(r, 3000);
  });
}
