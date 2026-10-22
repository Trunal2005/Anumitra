import "../safety.ts";
import { test, expect } from "@playwright/test";
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
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
  await expect(page.getByText("Live", { exact: true })).toBeVisible();
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
    page.getByRole("heading", { name: "Application register." }),
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
  await page.getByRole("link", { name: "EVC scheduling", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Expert visits. Coordinated." }),
  ).toBeVisible();
  await page.screenshot({
    path:
      (process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair") +
      "/evc-1440.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Rules & policy", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Rules & policy versions." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Validate & simulate" }).click();
  await expect(page.getByText("VALIDATED ROUTE")).toBeVisible();
  await page.screenshot({
    path:
      (process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair") +
      "/rules-1440.png",
    fullPage: true,
  });
  for (const width of [1280, 768, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/overview");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair"}/overview-${width}.png`,
      fullPage: true,
    });
    if (width <= 768) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("button", { name: "Close navigation" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".mini-orb .outer")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  expect(errors).toEqual([]);
});
test("institution can save and submit a draft through browser forms", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("institution.a@anumitra.test");
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Enter your workspace" }).click();
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
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
  await page
    .getByRole("button", { name: "Upload new immutable version" })
    .click();
  await expect(page.getByLabel("Current document version")).toBeVisible();
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
  const contexts: any[] = [];
  const pages: Record<string, any> = {};
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
    await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
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
    await upload(institution, "Journey lease", "2026-10-22");
    await action(institution, id, "submit");
    await commit(institution);
    const reviewer = await login("reviewer.north");
    await action(reviewer, id, "raise-deficiency");
    await reviewer
      .getByLabel("Checklist item")
      .fill("Fictional lease clarification");
    await commit(reviewer);
    for (const outcome of ["REJECTED", "REJECTED", "ACCEPTED"]) {
      await action(institution, id, "submit-response");
      await commit(institution);
      await action(reviewer, id, "verify-response", outcome);
      await commit(reviewer);
    }
    await action(reviewer, id, "review-document", "ACCEPTED");
    await commit(reviewer);
    await action(reviewer, id, "complete-stage");
    await commit(reviewer);
    const supervisor = await login("supervisor.north");
    await supervisor.goto("/evc");
    await supervisor.getByLabel("Eligible application").selectOption(id);
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
      new Date(+date - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    await supervisor.getByLabel("Start (browser timezone)").fill(local(start));
    await supervisor.getByLabel("End (browser timezone)").fill(local(end));
    await supervisor.getByLabel("EVC member", { exact: true }).check();
    await supervisor
      .getByLabel("Venue / meeting metadata")
      .fill("Fictional on-campus test inspection");
    await supervisor
      .getByLabel("Scheduling / rescheduling reason")
      .fill("Browser EVC scheduling with scoped assigned participant");
    await supervisor.getByRole("button", { name: "Propose visit" }).click();
    const card = supervisor
      .locator(".visit-card")
      .filter({ hasText: "Fictional on-campus test inspection" });
    await expect(card).toBeVisible();
    await card
      .getByLabel("Recorded reason")
      .fill("Confirmed fictional venue and availability");
    await card.getByRole("button", { name: "Confirm visit" }).click();
    await db.demoClock.update({
      where: { id: "current" },
      data: { now: new Date(+end + 1000) },
    });
    const evc = await login("committee.evc");
    await evc.goto("/evc");
    const ec = evc
      .locator(".visit-card")
      .filter({ hasText: "Fictional on-campus test inspection" });
    await ec
      .getByLabel("Report / reason")
      .fill("Inspection completed; fictional evidence checked");
    await ec.getByRole("button", { name: "Submit report" }).click();
    await supervisor.reload();
    const sc = supervisor
      .locator(".visit-card")
      .filter({ hasText: "Fictional on-campus test inspection" });
    await sc
      .getByLabel("Recorded reason")
      .fill("Completion report reviewed and accepted");
    await sc.getByRole("button", { name: "Accept completion report" }).click();
    await action(evc, id, "record-recommendation", "ACCEPTED");
    await commit(evc);
    await action(evc, id, "complete-stage");
    await commit(evc);
    const authority = await login("authority");
    await action(authority, id, "record-authorized-decision", "CONDITIONAL");
    await authority
      .getByLabel("Condition / undertaking")
      .fill("Journey undertaking: submit fictional evidence clarification");
    await authority
      .getByLabel("Condition due (your browser timezone)")
      .fill(local(new Date(+end + 3 * 86400000)));
    await commit(authority);
    await institution.goto("/compliance");
    const obligation = institution
      .locator(".obligation-card")
      .filter({ hasText: "Journey undertaking:" });
    await obligation.getByLabel("Authorized action").selectOption("submit");
    await obligation
      .getByLabel("Evidence explanation / review reason")
      .fill("Fictional undertaking evidence submitted for review");
    await obligation
      .getByRole("button", { name: "Record submit", exact: true })
      .click();
    await supervisor.goto("/compliance");
    const review = supervisor
      .locator(".obligation-card")
      .filter({ hasText: "Journey undertaking:" });
    await review.getByLabel("Authorized action").selectOption("accept");
    await review
      .getByLabel("Evidence explanation / review reason")
      .fill("Verified fictional undertaking evidence");
    await review
      .getByRole("button", { name: "Record accept", exact: true })
      .click();
    await expect(review.getByText("ACCEPTED", { exact: true })).toBeVisible();
    await institution.goto("/applications/" + id);
    await upload(institution, "Journey lease", "2029-12-31", true);
    await supervisor.goto("/documents");
    await supervisor
      .getByPlaceholder("Search authorized documents…")
      .fill(
        (await db.application.findUniqueOrThrow({ where: { id } })).reference,
      );
    const document = supervisor
      .locator(".document-card")
      .filter({ hasText: "Journey lease" });
    await expect(document.getByText("EXPIRED", { exact: true })).toBeVisible();
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
    await supervisor.screenshot({
      path:
        (process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair") +
        "/escalation-retry.png",
      fullPage: true,
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
      .fill("Authorized renewal accepted after browser review");
    await renewed.getByRole("button", { name: "Accept evidence" }).click();
    await expect(renewed.getByText(/Effective v2/)).toBeVisible();
    await expect(renewed.getByText("CURRENT", { exact: true })).toBeVisible();
    await supervisor.goto("/reports");
    await supervisor.getByLabel("Report").selectOption("overdue");
    await supervisor.screenshot({
      path:
        (process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair") +
        "/overdue-report.png",
      fullPage: true,
    });
  } finally {
    await db.demoClock.update({
      where: { id: "current" },
      data: { now: original.now },
    });
    for (const context of contexts) await context.close();
    await db.$disconnect();
  }
});
