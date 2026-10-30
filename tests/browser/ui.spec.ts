import "../safety.ts";
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import PDFDocument from "pdfkit";
async function evidencePdf() {
  return new Promise<Buffer>((resolve) => {
    const pdf = new PDFDocument();
    const chunks: Buffer[] = [];
    pdf.on("data", (c) => chunks.push(c));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.fontSize(20).text("Fictional browser evidence");
    pdf.fontSize(12).text("Anumitra test only. Not an official document.");
    pdf.end();
  });
}
const credentials = JSON.parse(
  readFileSync(
    (process.env.LOCAL_STATE_PATH ?? ".local") + "/demo-credentials.json",
    "utf8",
  ),
);
const deskHeading = (role: string) =>
  role.startsWith("institution.")
    ? "My action desk"
    : role.startsWith("reviewer.")
      ? "My review desk"
      : role.startsWith("supervisor.")
        ? "Regional action desk"
        : role.startsWith("committee.")
          ? "Committee action desk"
          : role === "authority"
            ? "Authority action desk"
            : role === "bureau"
              ? "Bureau action desk"
              : role === "admin"
                ? "Administration desk"
                : "Audit action desk";
test("welcome and authenticated workspaces use real API and retain responsive design", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Every approval/ }),
  ).toBeVisible();
  await page.screenshot({
    path:
      (process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair") +
      "/welcome-1440.png",
    fullPage: true,
  });
  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      background: s.getPropertyValue("--background").trim(),
      primary: s.getPropertyValue("--primary").trim(),
      body: s.fontFamily,
      heading: getComputedStyle(document.querySelector("h1")!).fontFamily,
    };
  });
  expect(tokens.background).toBe("#030304");
  expect(tokens.primary.toUpperCase()).toBe("#F7931A");
  expect(tokens.body).toContain("Inter");
  expect(tokens.heading).toContain("Space Grotesk");
  await page.getByLabel("Email address").fill("supervisor.north@anumitra.test");
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Enter your workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Regional action desk", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Updates connected", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path:
      (process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair") +
      "/overview-1440.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Applications", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Review queue" }),
  ).toBeVisible();
  await page
    .getByLabel("Search reference or institution")
    .fill("AN-" + credentials.runId.slice(0, 4).toUpperCase());
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.locator("tbody tr").first().getByRole("link").first().click();
  await expect(
    page.getByRole("heading", { name: "Document workspace" }),
  ).toBeVisible();
  await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible();
  await expect(
    page.getByText("Extracted page text (accessible)"),
  ).toBeVisible();
  const note = page.getByLabel("Reason / response (recorded in history)");
  if (await note.isVisible()) {
    await note.fill("Unsaved review input stays through refresh");
    await page
      .getByRole("button", { name: "Refresh records", exact: true })
      .click();
    await expect(note).toHaveValue(
      "Unsaved review input stays through refresh",
    );
  }
  await page.screenshot({
    path:
      (process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair") +
      "/application-review-1440.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "EVC planner", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "EVC planner" }),
  ).toBeVisible();
  await page.screenshot({
    path:
      (process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair") +
      "/evc-1440.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Workflow policies", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Workflow policies" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Validate & simulate" }).click();
  await expect(page.getByText("VALIDATED ROUTE")).toBeVisible();
  await page.screenshot({
    path:
      (process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair") +
      "/rules-1440.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("institution can save and submit a draft through browser forms", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("institution.a@anumitra.test");
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Enter your workspace" }).click();
  await expect(
    page.getByRole("heading", {
      name: deskHeading("institution.a"),
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/applications/new");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Contact email").fill("browser@fiction.test");
  await page
    .getByLabel("Programme", { exact: true })
    .fill("Browser Verification Engineering");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Save persistent draft" }).click();
  await expect(
    page.getByRole("heading", { name: "Document workspace" }),
  ).toBeVisible();
  await page.getByLabel("Document title").fill("Browser evidence");
  await page.getByLabel("File · PDF / PNG / JPEG · up to 10 MB").setInputFiles({
    name: "evidence.pdf",
    mimeType: "application/pdf",
    buffer: await evidencePdf(),
  });
  const applicationPath = "/api" + new URL(page.url()).pathname;
  const uploadedVersion = page
    .waitForResponse(
      (response) =>
        new URL(response.url()).pathname === applicationPath + "/documents" &&
        response.request().method() === "POST",
    )
    .then(async (response) => {
      expect(response.status()).toBe(201);
      return response.json();
    });
  // A click and even HTTP 201 precede the query refresh that renders the selector.
  // Observe the real read containing this version; a stale/SSE read is insufficient.
  const refreshedApplication = page.waitForResponse(async (response) => {
    if (
      new URL(response.url()).pathname !== applicationPath ||
      response.request().method() !== "GET" ||
      response.status() !== 200
    )
      return false;
    const uploaded = await uploadedVersion;
    try {
      const application = await response.json();
      return application.documents.some(
        (document: { versions: { id: string }[] }) =>
          document.versions.some((version) => version.id === uploaded.id),
      );
    } catch {
      return false; // A cancelled read cannot establish the refreshed snapshot.
    }
  });
  const [uploaded] = await Promise.all([
    uploadedVersion,
    refreshedApplication,
    page.getByRole("button", { name: "Upload new immutable version" }).click(),
  ]);
  await expect(page.getByLabel("Current document version")).toBeVisible();
  await expect(page.getByLabel("Current document version")).toHaveValue(
    uploaded.id,
  );
  await page
    .getByRole("button", { name: "Commit Submit", exact: true })
    .click();
  await expect(
    page.getByText(
      "Action committed. State, audit and notification intent saved together.",
    ),
  ).toBeVisible();
  await expect(
    page.locator(".context-strip").getByText("Scrutiny", { exact: true }),
  ).toBeVisible();
});

test("cross-role repair journey: repeated response, EVC, conditional undertaking, effective renewal and escalation retry", async ({
  browser,
}) => {
  test.setTimeout(180000);
  const { db } = await import("../../packages/db/index.ts");
  const { Client } = await import("../helpers.ts");
  const { randomUUID } = await import("node:crypto");
  const original = await db.demoClock.findUniqueOrThrow({
    where: { id: "current" },
  });
  await db.demoClock.update({
    where: { id: "current" },
    data: { runId: randomUUID(), now: original.now },
  });
  const contexts: BrowserContext[] = [];
  const pages: Record<string, Page> = {};
  async function login(role: string) {
    if (pages[role]) return pages[role];
    const context = await browser.newContext({
      baseURL: process.env.TEST_API_ORIGIN,
    });
    contexts.push(context);
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await page.goto("/");
    await page.getByLabel("Email address").fill(role + "@anumitra.test");
    await page
      .getByLabel("Password", { exact: true })
      .fill(credentials.password);
    await page.getByRole("button", { name: "Enter your workspace" }).click();
    await expect(
      page.getByRole("heading", { name: deskHeading(role), exact: true }),
    ).toBeVisible();
    pages[role] = page;
    return page;
  }
  async function action(
    page: any,
    id: string,
    command: string,
    outcome?: string,
  ) {
    await page.goto("/applications/" + id);
    await page.getByLabel("Action").selectOption(command);
    if (outcome) await page.getByLabel("Outcome").selectOption(outcome);
    if (command !== "submit")
      await page
        .getByLabel("Reason / response (recorded in history)")
        .fill("Browser journey authorized evidence and reason");
  }
  async function commit(page: any) {
    const human = page.getByRole("checkbox", {
      name: "I confirm that I reviewed the packet and am recording this human authority decision.",
    });
    if (await human.isVisible()) await human.check();
    const response = page.waitForResponse(
      (r: any) =>
        r.url().includes("/commands") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /^Commit / }).click();
    const result = await response;
    expect(result.status(), await result.text()).toBe(200);
  }
  async function upload(
    page: any,
    title: string,
    expiry: string,
    renew = false,
  ) {
    await page.getByLabel("Document title", { exact: true }).fill(title);
    await page.getByLabel("Valid through (IST)", { exact: true }).fill(expiry);
    if (renew)
      await page
        .getByLabel("Renew existing document")
        .selectOption({ label: "Journey lease" });
    await page
      .getByLabel("File · PDF / PNG / JPEG · up to 10 MB")
      .setInputFiles({
        name: "journey.pdf",
        mimeType: "application/pdf",
        buffer: await evidencePdf(),
      });
    const response = page.waitForResponse(
      (r: any) =>
        r.url().includes("/documents") && r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Upload new immutable version" })
      .click();
    expect((await response).status()).toBe(201);
  }
  try {
    const institution = await login("institution.a");
    await institution.goto("/applications/new");
    await institution
      .getByLabel("Workflow route")
      .selectOption({ label: "Scrutiny + EVC · v1" });
    await institution
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    await institution.getByLabel("Contact email").fill("journey@fiction.test");
    await institution
      .getByLabel("Programme", { exact: true })
      .fill("Fictional repair journey engineering");
    await institution
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    await institution
      .getByRole("button", { name: "Save persistent draft" })
      .click();
    await expect(
      institution.getByRole("heading", { name: "Document workspace" }),
    ).toBeVisible();
    const id = new URL(institution.url()).pathname.split("/").at(-1)!;
    const visitLabel = `Fictional on-campus inspection ${id.slice(0, 8)}`;
    const conditionLabel = `Journey undertaking: fictional campus evidence ${id.slice(0, 8)}`;
    await upload(institution, "Journey lease", "2026-10-22");
    await action(institution, id, "submit");
    await commit(institution);
    const reviewer = await login("reviewer.north");
    await action(reviewer, id, "raise-deficiency");
    await reviewer
      .getByLabel("Checklist item")
      .fill("Fictional lease clarification\nFictional programme clarification");
    await commit(reviewer);
    const reviewerApi = await new Client().login("reviewer.north");
    const checklist = (await reviewerApi.ok("/applications/" + id))
      .deficiencies;
    expect(checklist).toHaveLength(2);
    for (const [round, outcome] of [
      "REJECTED",
      "REJECTED",
      "ACCEPTED",
    ].entries()) {
      await action(institution, id, "submit-response");
      await institution
        .getByLabel("Target deficiency")
        .selectOption(checklist[0].id);
      await commit(institution);
      if (round === 0) {
        await action(institution, id, "submit-response");
        await institution
          .getByLabel("Target deficiency")
          .selectOption(checklist[1].id);
        await commit(institution);
      }
      await action(reviewer, id, "verify-response", outcome);
      await reviewer
        .getByLabel("Target deficiency")
        .selectOption(checklist[0].id);
      await commit(reviewer);
      if (outcome === "REJECTED")
        expect((await reviewerApi.ok("/applications/" + id)).state).toBe(
          "AWAITING_RESPONSE",
        );
    }
    await action(reviewer, id, "verify-response", "ACCEPTED");
    await reviewer
      .getByLabel("Target deficiency")
      .selectOption(checklist[1].id);
    await commit(reviewer);
    await action(reviewer, id, "review-document", "ACCEPTED");
    await commit(reviewer);
    await action(reviewer, id, "complete-stage");
    await commit(reviewer);
    const supervisor = await login("supervisor.north");
    await supervisor.goto("/evc");
    await supervisor
      .getByRole("combobox", { name: "Application", exact: true })
      .selectOption(id);
    const latest = await db.reservation.findFirst({
      where: { active: true },
      orderBy: { endAt: "desc" },
    });
    const start = new Date(
      Math.max(
        +original.now + 3 * 86400000,
        +(latest?.endAt ?? original.now) + 86400000,
      ),
    );
    const end = new Date(+start + 3600000);
    const local = (date: Date) =>
      new Date(+date + 19800000).toISOString().slice(0, 16);
    await supervisor.getByLabel("Start (IST)").fill(local(start));
    await supervisor.getByLabel("End (IST)").fill(local(end));
    await supervisor.getByLabel("EVC member", { exact: true }).check();
    await supervisor.getByLabel("Venue / meeting metadata").fill(visitLabel);
    await supervisor
      .getByLabel("Scheduling / rescheduling reason")
      .fill("Browser EVC scheduling with scoped assigned participant");
    await supervisor.getByRole("button", { name: "Propose visit" }).click();
    const card = supervisor
      .locator(".visit-card")
      .filter({ hasText: visitLabel });
    await expect(card).toBeVisible();
    await card
      .getByLabel("Recorded reason")
      .fill("Confirmed fictional venue and availability");
    const confirmResponse = supervisor.waitForResponse(
      (r) =>
        r.url().includes("/visits/") &&
        r.url().endsWith("/confirm") &&
        r.request().method() === "POST",
    );
    await card.getByRole("button", { name: "Confirm visit" }).click();
    expect((await confirmResponse).status()).toBe(200);
    await db.demoClock.update({
      where: { id: "current" },
      data: { now: new Date(+end + 1000) },
    });
    const evc = await login("committee.evc");
    const appointment = await db.visit.findFirstOrThrow({
      where: { applicationId: id, metadata: visitLabel },
    });
    await evc.goto("/evc?visit=" + appointment.id);
    const ec = evc.locator(".visit-card").filter({ hasText: visitLabel });
    await ec
      .getByLabel("Report / reason")
      .fill("Inspection completed; fictional evidence checked");
    const reportResponse = evc.waitForResponse(
      (r) =>
        r.url().includes("/visits/") &&
        r.url().endsWith("/report") &&
        r.request().method() === "POST",
    );
    await ec.getByRole("button", { name: "Submit report" }).click();
    expect((await reportResponse).status()).toBe(200);
    await supervisor.reload();
    const sc = supervisor
      .locator(".visit-card")
      .filter({ hasText: visitLabel });
    await sc
      .getByLabel("Recorded reason")
      .fill("Completion report reviewed and accepted");
    const completeResponse = supervisor.waitForResponse(
      (r) =>
        r.url().includes("/visits/") &&
        r.url().endsWith("/complete") &&
        r.request().method() === "POST",
    );
    await sc.getByRole("button", { name: "Accept completion report" }).click();
    expect((await completeResponse).status()).toBe(200);
    await action(evc, id, "record-recommendation", "ACCEPTED");
    await commit(evc);
    await action(evc, id, "complete-stage");
    await commit(evc);
    const authority = await login("authority");
    await action(authority, id, "record-authorized-decision", "CONDITIONAL");
    await authority.getByLabel("Condition / undertaking").fill(conditionLabel);
    await authority
      .getByLabel("Condition due (IST)")
      .fill(local(new Date(+end + 3 * 86400000)));
    await commit(authority);
    await institution.goto("/compliance");
    const obligation = institution
      .locator(".obligation-card")
      .filter({ hasText: conditionLabel });
    await obligation.getByLabel("Authorized action").selectOption("submit");
    await obligation
      .getByLabel("Evidence explanation / review reason")
      .fill("Fictional undertaking evidence submitted for review");
    const submitted = institution.waitForResponse(
      (r) =>
        r.url().includes("/obligations/") &&
        r.url().endsWith("/commands") &&
        r.request().method() === "POST",
    );
    await obligation
      .getByRole("button", { name: "Record submit", exact: true })
      .click();
    expect((await submitted).status()).toBe(200);
    await supervisor.goto("/compliance");
    const review = supervisor
      .locator(".obligation-card")
      .filter({ hasText: conditionLabel });
    await review.getByLabel("Authorized action").selectOption("accept");
    await review
      .getByLabel("Evidence explanation / review reason")
      .fill("Verified fictional undertaking evidence");
    const verified = supervisor.waitForResponse(
      (r) =>
        r.url().includes("/obligations/") &&
        r.url().endsWith("/commands") &&
        r.request().method() === "POST",
    );
    await review
      .getByRole("button", { name: "Record accept", exact: true })
      .click();
    expect((await verified).status()).toBe(200);
    await expect(review.getByText("ACCEPTED", { exact: true })).toBeVisible();
    await institution.goto("/applications/" + id);
    await upload(institution, "Journey lease", "2029-12-31", true);
    await expect(institution.locator(".case-brief")).toContainText(
      "Authorized reviewer / supervisor / bureau",
    );
    await expect(institution.locator(".case-brief")).toContainText(
      "Review the latest submission",
    );
    await supervisor.goto("/documents");
    await supervisor
      .getByPlaceholder("Search authorized documents…")
      .fill(
        (await db.application.findUniqueOrThrow({ where: { id } })).reference,
      );
    const document = supervisor
      .locator(".document-card")
      .filter({ hasText: "Journey lease" });
    await expect(document.getByText("Expired", { exact: true })).toBeVisible();
    await expect(
      document.getByText(/Renewal pending verification/),
    ).toBeVisible();
    await expect(document.getByText(/Effective v1/)).toBeVisible();
    await supervisor.screenshot({
      path:
        (process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair") +
        "/renewal-pending.png",
      fullPage: true,
    });
    const api = await new Client().login("supervisor.north");
    await expect
      .poll(
        async () =>
          (await api.ok("/alerts")).escalations.filter(
            (e: any) => e.applicationId === id && e.state === "OPEN",
          ).length,
        { timeout: 60000 },
      )
      .toBeGreaterThan(0);
    await supervisor.goto("/alerts");
    await supervisor.getByText(/Designated escalation events/).click();
    await expect(
      supervisor.getByText(/Level 1 · SUPERVISOR/).first(),
    ).toBeVisible();
    const current = await db.application.findUniqueOrThrow({ where: { id } });
    const user = await db.user.findUniqueOrThrow({
      where: { email: "institution.a@anumitra.test" },
    });
    const intent = await db.outbox.create({
      data: {
        applicationId: id,
        recipientId: user.id,
        logicalKey: randomUUID(),
        revision: current.version,
        subjectId: id,
        runId: current.runId,
        state: "AMBIGUOUS",
        title: "Browser deliberate retry disclosure fixture",
      },
    });
    await supervisor.reload();
    await supervisor
      .getByRole("button", { name: "SMTP & attempt history" })
      .click();
    const delivery = supervisor
      .locator(".delivery")
      .filter({ hasText: intent.title });
    await delivery.locator("summary").click();
    await delivery
      .getByLabel("Authorized retry reason")
      .fill("Operator deliberately requests a retry with duplicate disclosure");
    await delivery.getByRole("checkbox").check();
    await delivery.getByRole("button", { name: "Request retry" }).click();
    await expect
      .poll(
        async () =>
          (await db.outbox.findUniqueOrThrow({ where: { id: intent.id } }))
            .state,
        { timeout: 60000 },
      )
      .toBe("SMTP_ACCEPTED");
    // Capture the exercised delivery, not an unbounded live notification page.
    await delivery.scrollIntoViewIfNeeded();
    await supervisor.screenshot({
      path:
        (process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair") +
        "/escalation-retry.png",
      fullPage: false,
      animations: "disabled",
    });
    await supervisor.goto("/documents");
    await supervisor
      .getByPlaceholder("Search authorized documents…")
      .fill(current.reference);
    const renewed = supervisor
      .locator(".document-card")
      .filter({ hasText: "Journey lease" });
    await renewed
      .getByLabel("Verification reason")
      .fill("Fictional replacement returned for a corrected version");
    await renewed.getByRole("button", { name: "Return evidence" }).click();
    await expect(renewed.getByText("Expired", { exact: true })).toBeVisible();
    await expect(renewed.getByText(/Effective v1/)).toBeVisible();
    await institution.goto("/applications/" + id);
    await upload(institution, "Journey lease", "2029-12-31", true);
    await supervisor.reload();
    await supervisor
      .getByPlaceholder("Search authorized documents…")
      .fill(current.reference);
    await renewed
      .getByLabel("Verification reason")
      .fill("Authorized renewal accepted after browser review");
    await renewed.getByRole("button", { name: "Accept evidence" }).click();
    await expect(renewed.getByText(/Effective v3/)).toBeVisible();
    await expect(renewed.getByText("Current", { exact: true })).toBeVisible();
    await supervisor.goto("/reports");
    await supervisor
      .getByRole("combobox", { name: "Report", exact: true })
      .selectOption("overdue");
    await supervisor.screenshot({
      path:
        (process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair") +
        "/overdue-report.png",
      fullPage: true,
    });
  } finally {
    await db.demoClock.update({
      where: { id: "current" },
      data: { now: original.now, runId: original.runId },
    });
    for (const context of contexts) await context.close().catch(() => {});
    await db.$disconnect();
  }
});

test("the first live revision refreshes a stale initial compliance snapshot", async ({
  page,
}) => {
  test.setTimeout(60000);
  const { db } = await import("../../packages/db/index.ts");
  const { Client } = await import("../helpers.ts");
  try {
    const clock = await db.demoClock.findUniqueOrThrow({
      where: { id: "current" },
    });
    const decision = await db.decision.findFirstOrThrow({
      where: {
        outcome: "CONDITIONAL",
        application: { institutionId: "I01", runId: clock.runId },
      },
      include: {
        application: {
          include: {
            documents: {
              include: { versions: { orderBy: { number: "desc" } } },
            },
          },
        },
      },
    });
    const owner = await db.user.findUniqueOrThrow({
      where: { email: "institution.a@anumitra.test" },
    });
    const supervisor = await db.user.findUniqueOrThrow({
      where: { email: "supervisor.north@anumitra.test" },
    });
    const condition = "SSE initial snapshot race " + Date.now();
    const due = new Date(+clock.now + 86400000);
    const fixture = await db.obligation.create({
      data: {
        applicationId: decision.applicationId,
        decisionId: decision.id,
        condition,
        source: "DEMO synthetic live-update race fixture",
        ownerId: owner.id,
        requiredEvidence: "Fictional case evidence",
        originalDueAt: due,
        dueAt: due,
      },
    });
    // Delay only delivery of live callbacks; requests and server events remain real.
    await page.addInitScript(() => {
      const target = window as any;
      target.__deliverRefresh = false;
      const Native = window.EventSource;
      target.EventSource = class extends Native {
        addEventListener(type: any, listener: any, options?: any) {
          super.addEventListener(
            type,
            type === "refresh"
              ? (event: any) => {
                  if (target.__deliverRefresh) {
                    if (typeof listener === "function")
                      listener.call(this, event);
                    else listener.handleEvent(event);
                  }
                }
              : listener,
            options,
          );
        }
      };
    });
    await page.goto("/");
    await page
      .getByLabel("Email address")
      .fill("supervisor.north@anumitra.test");
    await page
      .getByLabel("Password", { exact: true })
      .fill(credentials.password);
    await page.getByRole("button", { name: "Enter your workspace" }).click();
    await expect(
      page.getByRole("heading", {
        name: deskHeading("supervisor.north"),
        exact: true,
      }),
    ).toBeVisible();
    await page.goto("/compliance?selected=" + fixture.id);
    const card = page
      .locator(".obligation-card")
      .filter({ hasText: condition });
    await expect(card.getByText("OPEN", { exact: true })).toBeVisible();
    const institution = await new Client().login("institution.a");
    await institution.ok(`/obligations/${fixture.id}/commands`, "POST", {
      command: "submit",
      expectedRevision: 1,
      documentVersionId: decision.application.documents[0].versions[0].id,
      reason:
        "Real institutional submission after the initial browser snapshot",
    });
    await expect
      .poll(
        () =>
          db.outbox.count({
            where: {
              recipientId: supervisor.id,
              state: { in: ["QUEUED", "FAILED", "ATTEMPTED"] },
            },
          }),
        { timeout: 25000 },
      )
      .toBe(0);
    await page.evaluate(() => {
      (window as any).__deliverRefresh = true;
    });
    await expect(card.getByText("SUBMITTED", { exact: true })).toBeVisible({
      timeout: 8000,
    });
    await expect(card.getByLabel("Authorized action")).toBeVisible();
  } finally {
    await db.$disconnect();
  }
});

test("readable reports, contextual history, scoped next actors and reviewed simulator provenance use the real API", async ({
  browser,
}) => {
  const { db } = await import("../../packages/db/index.ts");
  const { Client } = await import("../helpers.ts");
  const { randomUUID } = await import("node:crypto");
  const { scan } = await import("../../packages/domain/alerts.ts");
  const originalClock = await db.demoClock.findUniqueOrThrow({
    where: { id: "current" },
  });
  await db.demoClock.update({
    where: { id: "current" },
    data: { runId: randomUUID(), now: originalClock.now },
  });
  const contexts: BrowserContext[] = [];
  async function signIn(role: string) {
    const context = await browser.newContext({
      baseURL: process.env.TEST_API_ORIGIN,
      viewport: { width: 1440, height: 900 },
    });
    contexts.push(context);
    const page = await context.newPage();
    await page.goto("/");
    await page.getByLabel("Email address").fill(role + "@anumitra.test");
    await page
      .getByLabel("Password", { exact: true })
      .fill(credentials.password);
    const loggedIn = page.waitForResponse(
      (r) => r.url().endsWith("/api/login") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Enter your workspace" }).click();
    expect((await loggedIn).status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: deskHeading(role), exact: true }),
    ).toBeVisible();
    return page;
  }
  const evidence = process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair";
  try {
    const institutionApi = await new Client().login("institution.a");
    const reviewerApi = await new Client().login("reviewer.north");
    const supervisorApi = await new Client().login("supervisor.north");
    const authorityApi = await new Client().login("authority");
    const fixture = await institutionApi.create();
    async function fixtureUpload(
      appId: string,
      documentId?: string,
      expiry = "2026-10-22",
    ) {
      const form = new FormData();
      form.set("kind", "LEASE");
      form.set("title", "Fictional presentation evidence");
      form.set("validUntil", expiry);
      if (documentId) form.set("documentId", documentId);
      form.set(
        "file",
        new Blob([new Uint8Array(await evidencePdf())], {
          type: "application/pdf",
        }),
        "fictional-presentation.pdf",
      );
      return institutionApi.ok(
        `/applications/${appId}/documents`,
        "POST",
        form,
      );
    }
    const first = await fixtureUpload(fixture.id);
    await institutionApi.command(fixture.id, "submit");
    await reviewerApi.command(fixture.id, "review-document", {
      documentVersionId: first.id,
      outcome: "ACCEPTED",
    });
    await reviewerApi.command(fixture.id, "complete-stage");
    await authorityApi.command(fixture.id, "record-authorized-decision", {
      outcome: "CONDITIONAL",
      condition: "Fictional presentation condition",
      dueAt: new Date(+originalClock.now + 7 * 86400000).toISOString(),
    });
    let conditionRecord = await supervisorApi.ok("/applications/" + fixture.id);
    let conditionRow = conditionRecord.obligations[0];
    await institutionApi.ok(
      `/obligations/${conditionRow.id}/commands`,
      "POST",
      {
        command: "submit",
        expectedRevision: conditionRow.revision,
        documentVersionId: first.id,
        reason: "Fictional presentation condition evidence",
      },
    );
    conditionRecord = await supervisorApi.ok("/applications/" + fixture.id);
    conditionRow = conditionRecord.obligations[0];
    await supervisorApi.ok(`/obligations/${conditionRow.id}/commands`, "POST", {
      command: "accept",
      expectedRevision: conditionRow.revision,
      reason: "Fictional presentation evidence verified",
    });
    await db.demoClock.update({
      where: { id: "current" },
      data: { now: new Date(+originalClock.now + 30 * 86400000) },
    });
    await scan();
    const latest = await fixtureUpload(
      fixture.id,
      first.documentId,
      "2029-12-31",
    );
    await supervisorApi.ok(`/documents/${latest.id}/review`, "POST", {
      outcome: "ACCEPTED",
      reason: "Fictional presentation renewal accepted",
    });
    const unreviewed = await institutionApi.create();
    await fixtureUpload(unreviewed.id);
    const page = await signIn("supervisor.north");
    await page.goto("/reports");
    await page
      .getByRole("combobox", { name: "Report", exact: true })
      .selectOption("validity");
    await expect(
      page.getByRole("columnheader", {
        name: "Accepted effective version",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("cell", { name: "No accepted version", exact: true })
        .first(),
    ).toBeVisible();
    await expect(
      page
        .locator("td")
        .filter({ hasText: /^(true|false|NO_ACCEPTED_VERSION)$/ }),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("cell", { name: "No renewal pending", exact: true })
        .first(),
    ).toBeVisible();
    await page.screenshot({
      path: evidence + "/product-reports-1440.png",
      fullPage: true,
    });
    for (const width of [390, 768]) {
      await page.setViewportSize({ width, height: 800 });
      const scroll = page.getByRole("region", {
        name: "Scrollable report table",
      });
      await scroll.focus();
      await expect(scroll).toBeFocused();
      await page.keyboard.press("ArrowRight");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: evidence + `/product-reports-${width}.png`,
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    const run = await db.demoClock.findUniqueOrThrow({
      where: { id: "current" },
    });
    const condition = fixture;
    await page.goto("/applications/" + condition.id);
    await expect(
      page.getByText("No application transition pending", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "History", exact: true }).click();
    await expect(page.locator(".escalation-context").first()).toBeVisible();
    await expect(page.locator(".escalation-context").first()).toContainText(
      "Current event status:",
    );
    await page.screenshot({
      path: evidence + "/product-case-history.png",
      fullPage: true,
    });
    const admin = await signIn("admin");
    await admin.goto("/admin");
    await admin
      .getByRole("button", { name: "Load fictional simulator sample" })
      .click();
    await expect(admin.getByLabel("Local records")).toHaveValue(
      /SIM-INSTITUTE-001/,
    );
    const preview = admin.waitForResponse(
      (r) =>
        r.url().endsWith("/api/integrations/master") &&
        r.request().method() === "POST",
    );
    await admin
      .getByRole("button", { name: "Validate preview", exact: true })
      .click();
    const previewResponse = await preview;
    expect(previewResponse.status()).toBe(200);
    const plan = await previewResponse.json();
    expect(plan.provenance.classification).toBe("FICTIONAL_SIMULATION");
    expect(plan.reviewId).toBeTruthy();
    await admin.screenshot({
      path: evidence + "/product-master-preview.png",
      fullPage: true,
    });
    const committed = admin.waitForResponse(
      (r) =>
        r.url().endsWith("/api/integrations/master") &&
        r.request().method() === "POST",
    );
    await admin
      .getByRole("button", { name: "Commit validated import" })
      .click();
    const committedResponse = await committed;
    expect(committedResponse.status()).toBe(200);
    expect((await committedResponse.json()).results).toHaveLength(2);
    const other = await new Client().login("institution.b");
    const options = await other.ok("/options");
    const foreign = await other.ok("/applications", "POST", {
      institutionId: options.institutions[0].id,
      workflowId: options.workflows.find((w: any) => w.name === "Only Scrutiny")
        .id,
      category: "NEW_INSTITUTION",
      cycle: "2026-27",
      data: {
        contact: "foreign@fiction.test",
        programme: "Fictional scope check",
        intake: 60,
      },
    });
    expect(
      (await institutionApi.request("/applications/" + foreign.id)).status,
    ).toBe(404);
    expect(
      (await institutionApi.request("/integrations/simulator/institutions"))
        .status,
    ).toBe(403);
  } finally {
    await db.demoClock.update({
      where: { id: "current" },
      data: { runId: originalClock.runId, now: originalClock.now },
    });
    for (const context of contexts) await context.close().catch(() => {});
    await db.$disconnect();
  }
});
