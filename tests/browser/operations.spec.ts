import "../safety.ts";
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import PDFDocument from "pdfkit";
const credential = JSON.parse(
  fs.readFileSync(
    path.join(process.env.LOCAL_STATE_PATH!, "demo-credentials.json"),
    "utf8",
  ),
);
const heading = (role: string) =>
  role.startsWith("institution")
    ? "My action desk"
    : role.startsWith("reviewer")
      ? "My review desk"
      : role.startsWith("supervisor")
        ? "Regional action desk"
        : role.startsWith("committee")
          ? "Committee action desk"
          : role === "authority"
            ? "Authority action desk"
            : role === "bureau"
              ? "Bureau action desk"
              : "Administration desk";
async function signIn(page: Page, role: string) {
  await page.goto("/");
  const signedIn = page.getByRole("button", { name: "Sign out", exact: true });
  const email = page.getByLabel("Email address", { exact: true });
  // Read the rendered state of this navigation; an earlier in-flight session
  // response may belong to the document that navigation just destroyed.
  await expect(signedIn.or(email)).toBeVisible();
  if (await signedIn.isVisible()) {
    await signedIn.click();
    await expect(email).toBeVisible();
  }
  await page.getByLabel("Email address").fill(role + "@anumitra.test");
  await page.getByLabel("Password", { exact: true }).fill(credential.password);
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/login") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Enter your workspace" }).click();
  expect((await response).status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: heading(role), exact: true }),
  ).toBeVisible();
}
async function pdf() {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument();
    const bytes: Buffer[] = [];
    doc.on("data", (chunk) => bytes.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(bytes)));
    doc.fontSize(20).text("Fictional Anumitra evaluator evidence");
    doc
      .fontSize(12)
      .text("Synthetic test document. Not an official lease or approval.");
    doc.end();
  });
}
const evidence = () => process.env.TEST_EVIDENCE_DIR ?? "docs/evidence/repair";
async function capture(page: Page, name: string) {
  fs.mkdirSync(evidence() + "/operations", { recursive: true });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: evidence() + "/operations/" + name + ".png",
    fullPage: ["rules-after", "authority-decision-packet"].includes(name),
    animations: "disabled",
  });
}

test("role-specific desks expose scoped tasks, deterministic counts and update connectivity", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const context = await browser.newContext({
    baseURL: process.env.TEST_API_ORIGIN,
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    for (const role of [
      "institution.a",
      "reviewer.north",
      "supervisor.north",
      "committee.evc",
      "authority",
      "bureau",
    ]) {
      await signIn(page, role);
      const response = await page.request.get("/api/action-desk");
      expect(response.status()).toBe(200);
      const desk = await response.json();
      await expect(
        page.getByRole("heading", { name: "Priority worklist", exact: true }),
      ).toBeVisible();
      expect(desk.totalTasks).toBe(desk.tasks.length);
      expect(new Set(desk.tasks.map((t: any) => t.id)).size).toBe(
        desk.tasks.length,
      );
      await expect(
        page.getByText("Updates connected", { exact: true }),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test("specialised workspaces: role desks, queue drilldowns, source provenance, visual policy controls and accessible layouts", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const context = await browser.newContext({
    baseURL: process.env.TEST_API_ORIGIN,
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await signIn(page, "supervisor.north");
    await capture(page, "action-desk-after");
    const shell = await page.locator(".app-shell").evaluate((e) => ({
      background: getComputedStyle(e).backgroundColor,
      color: getComputedStyle(e).color,
    }));
    expect(shell.background).toBe("rgb(243, 245, 247)");
    expect(shell.color).toBe("rgb(23, 37, 54)");
    const backlog = await (await page.request.get("/api/action-desk")).json();
    if (backlog.backlog.length) {
      const row = backlog.backlog[0];
      await page
        .getByRole("region", { name: "Scoped stage and region backlog" })
        .locator(
          `a[href*="region=${row.regionId}"][href*="state=${row.stage}"]`,
        )
        .click();
      const count = await (
        await page.request.get(
          "/api/review-queue?" + new URL(page.url()).searchParams,
        )
      ).json();
      expect(count.total).toBe(row.count);
    }
    await page.goto("/applications");
    const filtered = page.waitForResponse(
      (r) =>
        r.url().includes("/api/review-queue?") &&
        r.url().includes("state=SCRUTINY"),
    );
    await page
      .getByRole("combobox", { name: "Stage", exact: true })
      .selectOption("SCRUTINY");
    const data = await (await filtered).json();
    expect(data.items.every((r: any) => r.state === "SCRUTINY")).toBe(true);
    await expect(
      page.getByRole("button", { name: /State: Scrutiny/ }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Clear filters", exact: true })
      .click();
    await expect(
      page.getByRole("combobox", { name: "Stage", exact: true }),
    ).toHaveValue("");
    await capture(page, "applications-after");
    const current = await (
      await page.request.get("/api/review-queue?state=SCRUTINY&limit=1")
    ).json();
    expect(current.items.length).toBe(1);
    await page.goto("/applications/" + current.items[0].id);
    await expect(
      page.getByRole("heading", { name: "Document workspace", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".workflow-rail")).toHaveCSS(
      "grid-column",
      "1 / -1",
    );
    await expect(page.locator(".task-actions")).toBeVisible();
    await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible();
    await capture(page, "case-review-after");
    await page.goto("/evc");
    await page
      .getByRole("button", { name: "Accessible agenda", exact: true })
      .click();
    const visitButton = page
      .getByRole("button", { name: "View appointment", exact: true })
      .first();
    if (await visitButton.isVisible()) {
      await visitButton.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("dialog", { name: "Expert visit details" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(visitButton).toBeFocused();
    }
    await page.getByRole("button", { name: "Week", exact: true }).click();
    await capture(page, "evc-after");
    await page.goto("/documents");
    await expect(page.locator(".selected-document")).toBeVisible();
    await expect(
      page.getByText("Accepted effective evidence", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Latest submitted evidence", { exact: true }),
    ).toBeVisible();
    await capture(page, "documents-after");
    await signIn(page, "committee.evc");
    await page.goto("/committees");
    await expect(
      page.getByRole("heading", { name: "Committee agenda", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".queue-table")).toHaveCount(0);
    await expect(page.getByText(/Assigned-case agenda/)).toBeVisible();
    await capture(page, "committee-after");
    await signIn(page, "bureau");
    const rules = await (await page.request.get("/api/rules")).json();
    const published = rules.rules.find(
      (r: any) => r.name === "Only Scrutiny" && r.state === "PUBLISHED",
    );
    expect(published).toBeTruthy();
    await page.goto("/rules?selected=" + published.id);
    await expect(page.getByLabel("Route name", { exact: true })).toBeDisabled();
    const created = page.waitForResponse(
      (r) => r.url().endsWith("/api/rules") && r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Create next draft", exact: true })
      .click();
    expect((await created).status()).toBe(201);
    await expect(page.getByLabel("Route name", { exact: true })).toBeEnabled();
    await page
      .getByRole("combobox", { name: "Add eligible stage", exact: true })
      .selectOption("EVC");
    await page
      .getByRole("button", { name: "Add stage before authority", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Move Evc earlier", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    expect(
      await page.locator(".visual-route-editor li>strong").allTextContents(),
    ).toEqual(["Evc", "Scrutiny", "Authority"]);
    const blocked = page.waitForResponse((r) => r.url().endsWith("/simulate"));
    await page.getByRole("button", { name: "Validate & simulate" }).click();
    expect(
      (await (await blocked).json()).evaluation.steps.some(
        (s: any) => s.state === "BLOCKED",
      ),
    ).toBe(true);
    await page
      .getByRole("checkbox", { name: "Accepted lease evidence present" })
      .check();
    await page
      .getByRole("checkbox", { name: "EVC completion report accepted" })
      .check();
    await page
      .getByRole("checkbox", {
        name: "Current-attempt recommendation recorded",
      })
      .check();
    const ready = page.waitForResponse((r) => r.url().endsWith("/simulate"));
    await page.getByRole("button", { name: "Validate & simulate" }).click();
    const simulation = await (await ready).json();
    expect(simulation.evaluation.mutatesRecords).toBe(false);
    expect(
      simulation.evaluation.steps.every(
        (s: any) => s.state === "HUMAN_ACTION_REQUIRED",
      ),
    ).toBe(true);
    await capture(page, "rules-after");
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test("public references retain field-level sources, historical year and missing-year disclosure", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const context = await browser.newContext({
    baseURL: process.env.TEST_API_ORIGIN,
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await signIn(page, "bureau");
    await page.goto("/references");
    await expect(
      page.getByRole("heading", {
        name: "Public institution references",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("1-14068819", { exact: true }).last(),
    ).toBeVisible();
    const links = page.getByRole("link", {
      name: "View source · page 1",
      exact: true,
    });
    expect(await links.count()).toBeGreaterThan(0);
    expect(await links.first().getAttribute("href")).toBe(
      "https://vit.edu.in/wp-content/uploads/2026/01/EOA_VIT-2025-26-1.pdf#page=1",
    );
    await capture(page, "public-references");
    await page
      .getByRole("combobox", { name: "Historical academic year" })
      .selectOption("2026-27");
    await expect(page.getByText(/No source-reviewed profile/)).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test("responsive workspaces preserve keyboard focus, sampled contrast and 200 percent enlargement", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const context = await browser.newContext({
    baseURL: process.env.TEST_API_ORIGIN,
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await signIn(page, "supervisor.north");
    for (const width of [1280, 768, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/overview");
      await expect(
        page.getByRole("heading", {
          name: "Regional action desk",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("region", { name: "Scoped stage and region backlog" }),
      ).toBeVisible();
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
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".app-shell")
        .evaluate((e) => getComputedStyle(e).animationName),
    ).toBe("none");
    await expect(page.locator(".app-shell .orb-scene")).toHaveCount(0);

    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        "/overview",
        "/applications",
        "/documents",
        "/evc",
        "/rules",
        "/references",
      ]) {
        await page.goto(route);
        await expect(page.locator("h1")).toBeVisible();
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          )
          .toBe(true);
        await capture(page, route.slice(1) + "-" + width);
      }
      const region = page.getByRole("region", {
        name: "Field-level public reference provenance",
      });
      await region.focus();
      await expect(region).toBeFocused();
      await page.keyboard.press("ArrowRight");
    }
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/applications");
    await expect(page.locator(".ops-table th").first()).toBeVisible();
    const samples = await page.evaluate(() => {
      const rgba = (s: string) => s.match(/[\d.]+/g)!.map(Number);
      return [
        ".ops-heading h1",
        ".ops-heading p",
        ".queue-search button",
        ".ops-table th",
        ".sidebar .brand",
      ].map((selector) => {
        const element = document.querySelector(selector)!;
        let parent: Element | null = element,
          background = [255, 255, 255];
        while (parent) {
          const value = rgba(getComputedStyle(parent).backgroundColor);
          if (value.length === 3 || value[3] === 1) {
            background = value;
            break;
          }
          if (value[3] !== 0)
            throw Error(
              "Contrast sample requires opaque background: " + selector,
            );
          parent = parent.parentElement;
        }
        return {
          selector,
          foreground: rgba(getComputedStyle(element).color),
          background,
        };
      });
    });
    const luminance = (rgb: number[]) =>
      rgb
        .slice(0, 3)
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
    const contrast = samples.map((s) => {
      const a = luminance(s.foreground),
        b = luminance(s.background);
      return { ...s, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
    });
    for (const sample of contrast)
      expect(sample.ratio, sample.selector).toBeGreaterThanOrEqual(4.5);
    fs.writeFileSync(
      evidence() + "/operations/sampled-contrast.json",
      JSON.stringify(
        {
          benchmark:
            "WCAG relative luminance, sampled opaque text/background pairs only; not certification",
          samples: contrast,
        },
        null,
        2,
      ),
    );
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).zoom,
      ),
    ).toBe("2");
    await expect(
      page.getByRole("button", { name: "Search", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await capture(page, "applications-200-percent-css-zoom");
    await page.evaluate(() => {
      document.documentElement.style.zoom = "";
    });

    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test("continuous evaluator walkthrough uses one real browser page across the guarded institutional review and human decision workflow", async ({
  browser,
}) => {
  test.setTimeout(240000);
  const { db } = await import("../../packages/db/index.ts");
  const original = await db.demoClock.findUniqueOrThrow({
    where: { id: "current" },
  });
  await db.demoClock.update({
    where: { id: "current" },
    data: { runId: randomUUID(), now: original.now },
  });
  const videoDir = process.env.WALKTHROUGH_VIDEO_DIR;
  if (
    videoDir &&
    (!path.isAbsolute(videoDir) ||
      !path.relative(process.cwd(), videoDir).startsWith(".."))
  )
    throw Error("Walkthrough video must be outside the repository");
  if (videoDir) fs.mkdirSync(videoDir, { recursive: true });
  const context = await browser.newContext({
    baseURL: process.env.TEST_API_ORIGIN,
    viewport: { width: 1440, height: 960 },
    ...(videoDir
      ? { recordVideo: { dir: videoDir, size: { width: 1440, height: 960 } } }
      : {}),
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const video = page.video();
  const started = Date.now(),
    notes: { time: number; text: string }[] = [];
  const note = (text: string) =>
    notes.push({ time: Date.now() - started, text });
  const logins: string[] = [];
  let id = "",
    done = false;
  const login = async (role: string) => {
    await signIn(page, role);
    logins.push(role);
  };
  const caseData = async () => {
    const r = await page.request.get("/api/applications/" + id);
    expect(r.status()).toBe(200);
    return r.json();
  };
  async function action(command: string, outcome?: string) {
    await page.goto("/applications/" + id);
    await page
      .getByRole("combobox", { name: "Action", exact: true })
      .selectOption(command);
    if (outcome)
      await page
        .getByRole("combobox", { name: "Outcome", exact: true })
        .selectOption(outcome);
    if (command !== "submit")
      await page
        .getByLabel("Reason / response (recorded in history)")
        .fill("Fictional evaluator evidence and authorized review reason");
  }
  async function commit() {
    const response = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === `/api/applications/${id}/commands` &&
        r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /^Commit / }).click();
    expect((await response).status()).toBe(200);
  }
  async function upload(renew = false) {
    await page
      .getByLabel("Document title", { exact: true })
      .fill("Fictional evaluator lease");
    await page
      .getByLabel("Valid through (IST)", { exact: true })
      .fill(renew ? "2029-12-31" : "2026-10-22");
    if (renew)
      await page
        .getByRole("combobox", { name: "Renew existing document", exact: true })
        .selectOption({ label: "Fictional evaluator lease" });
    await page
      .getByLabel("File · PDF / PNG / JPEG · up to 10 MB")
      .setInputFiles({
        name: "fictional-evaluator.pdf",
        mimeType: "application/pdf",
        buffer: await pdf(),
      });
    const response = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === `/api/applications/${id}/documents` &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Upload new immutable version" })
      .click();
    expect((await response).status()).toBe(201);
    await expect(
      page.getByRole("combobox", {
        name: "Current document version",
        exact: true,
      }),
    ).toBeVisible();
  }
  const ist = (d: Date) => new Date(+d + 19800000).toISOString().slice(0, 16);
  try {
    await login("institution.a");
    note(
      "This is Anumitra, an independent prototype. The institution starts from a task-focused action desk.",
    );
    await page
      .getByRole("link", { name: "New application", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Workflow route", exact: true })
      .selectOption({ label: "Scrutiny + EVC · v1" });
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("Contact email").fill("evaluator@fiction.test");
    await page
      .getByLabel("Programme", { exact: true })
      .fill("Fictional evaluator engineering");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Save persistent draft" }).click();
    await expect(
      page.getByRole("heading", { name: "Document workspace" }),
    ).toBeVisible();
    id = new URL(page.url()).pathname.split("/").at(-1)!;
    await upload();
    await action("submit");
    await commit();
    expect((await caseData()).state).toBe("SCRUTINY");
    note(
      "The institution submits a fictional application with private evidence. The selected policy keeps its own version.",
    );
    await login("reviewer.north");
    await action("raise-deficiency");
    await page
      .getByLabel("Checklist item", { exact: true })
      .fill("Fictional lease clarification\nFictional programme clarification");
    await commit();
    const checklist = (await caseData()).deficiencies;
    expect(checklist).toHaveLength(2);
    note(
      "The reviewer requests two reasoned corrections. Each item has its own evidence response and review.",
    );
    await login("institution.a");
    await expect(
      page.getByRole("region", { name: "Priority action tasks" }),
    ).toContainText("Respond:");
    for (const d of checklist) {
      await action("submit-response");
      await page
        .getByRole("combobox", { name: "Target deficiency", exact: true })
        .selectOption(d.id);
      await commit();
    }
    await login("reviewer.north");
    await action("verify-response", "REJECTED");
    await page
      .getByRole("combobox", { name: "Target deficiency", exact: true })
      .selectOption(checklist[0].id);
    await commit();
    expect((await caseData()).state).toBe("AWAITING_RESPONSE");
    note(
      "Rejecting a response returns the case to institutional waiting. It does not erase the earlier response.",
    );
    await login("institution.a");
    await action("submit-response");
    await page
      .getByRole("combobox", { name: "Target deficiency", exact: true })
      .selectOption(checklist[0].id);
    await commit();
    await login("reviewer.north");
    for (const d of checklist) {
      await action("verify-response", "ACCEPTED");
      await page
        .getByRole("combobox", { name: "Target deficiency", exact: true })
        .selectOption(d.id);
      await commit();
    }
    await action("review-document", "ACCEPTED");
    await commit();
    await action("complete-stage");
    await commit();
    await login("supervisor.north");
    expect((await caseData()).state).toBe("EVC");
    note(
      "Both responses are reviewed, evidence is accepted and the guarded route advances to EVC.",
    );
    await page.goto("/evc?application=" + id);
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
    await page.getByLabel("Start (IST)", { exact: true }).fill(ist(start));
    await page.getByLabel("End (IST)", { exact: true }).fill(ist(end));
    await page.getByLabel("EVC member", { exact: true }).check();
    await page
      .getByLabel("Venue / meeting metadata")
      .fill("Fictional evaluator inspection");
    await page
      .getByLabel("Scheduling / rescheduling reason")
      .fill("Fictional appointment with declared available expert");
    await page
      .getByRole("button", { name: "Propose visit", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Expert visit details" }),
    ).toBeVisible();
    const visit = await db.visit.findFirstOrThrow({
      where: { applicationId: id, metadata: "Fictional evaluator inspection" },
    });
    await page
      .getByLabel("Recorded reason", { exact: true })
      .fill("Fictional venue and availability confirmed");
    const confirmed = page.waitForResponse((r) =>
      r.url().endsWith(`/visits/${visit.id}/confirm`),
    );
    await page
      .getByRole("button", { name: "Confirm visit", exact: true })
      .click();
    expect((await confirmed).status()).toBe(200);
    await page
      .getByRole("button", { name: "Close details", exact: true })
      .click();
    note(
      "The supervisor checks availability, proposes an expert visit and confirms it. The appointment is a fictional demo reservation.",
    );
    await db.demoClock.update({
      where: { id: "current" },
      data: { now: new Date(+end + 1000) },
    });
    await login("committee.evc");
    await page.goto("/evc?visit=" + visit.id);
    await page
      .getByLabel("Report / reason", { exact: true })
      .fill(
        "Fictional inspection report: evidence checked for this demonstration",
      );
    const reported = page.waitForResponse((r) =>
      r.url().endsWith(`/visits/${visit.id}/report`),
    );
    await page
      .getByRole("button", { name: "Submit report", exact: true })
      .click();
    expect((await reported).status()).toBe(200);
    await page
      .getByRole("button", { name: "Close details", exact: true })
      .click();
    await login("supervisor.north");
    await page.goto("/evc?visit=" + visit.id);
    await page
      .getByLabel("Recorded reason", { exact: true })
      .fill("Fictional report completion reviewed and accepted");
    const completed = page.waitForResponse((r) =>
      r.url().endsWith(`/visits/${visit.id}/complete`),
    );
    await page
      .getByRole("button", { name: "Accept completion report", exact: true })
      .click();
    expect((await completed).status()).toBe(200);
    await page
      .getByRole("button", { name: "Close details", exact: true })
      .click();
    await login("committee.evc");
    await page.goto("/committees?selected=" + id);
    await expect(
      page.getByRole("button", { name: "Record recommendation", exact: true }),
    ).toBeVisible();
    await capture(page, "committee-recommendation-ready");
    await page
      .getByLabel("Recommendation / completion reason", { exact: true })
      .fill("Fictional current-attempt recommendation after report acceptance");
    const recommendation = page.waitForResponse(
      (r) => new URL(r.url()).pathname === `/api/applications/${id}/commands`,
    );
    await page
      .getByRole("button", { name: "Record recommendation", exact: true })
      .click();
    expect((await recommendation).status()).toBe(200);
    await expect(
      page.getByLabel("Recommendation / completion reason", { exact: true }),
    ).toHaveValue("");
    await page
      .getByLabel("Recommendation / completion reason", { exact: true })
      .fill("Fictional committee consideration completed");
    const progressed = page.waitForResponse(
      (r) => new URL(r.url()).pathname === `/api/applications/${id}/commands`,
    );
    await page
      .getByRole("button", { name: "Complete committee stage", exact: true })
      .click();
    expect((await progressed).status()).toBe(200);
    note(
      "The expert report, completion acceptance, recommendation and stage completion are separate recorded actions.",
    );
    await login("authority");
    await action("record-authorized-decision", "CONDITIONAL");
    await expect(
      page.getByRole("heading", { name: "Decision-ready packet", exact: true }),
    ).toBeVisible();
    const condition = "Fictional evaluator condition";
    await page
      .getByLabel("Condition / undertaking", { exact: true })
      .fill(condition);
    await page
      .getByLabel("Condition due (IST)", { exact: true })
      .fill(ist(new Date(+end + 5 * 86400000)));
    const human = page.getByRole("checkbox", {
      name: "I confirm that I reviewed the packet and am recording this human authority decision.",
    });
    await expect(human).not.toBeChecked();
    await human.check();
    await capture(page, "authority-decision-packet");
    await commit();
    expect((await caseData()).state).toBe("CONDITIONAL");
    note(
      "The competent authority reviews the decision packet and explicitly records a human conditional decision.",
    );
    const obligation = await db.obligation.findFirstOrThrow({
      where: { applicationId: id },
    });
    await login("institution.a");
    await page.goto("/compliance?selected=" + obligation.id);
    await page
      .getByRole("combobox", { name: "Authorized action", exact: true })
      .selectOption("submit");
    await page
      .getByLabel("Evidence explanation / review reason")
      .fill("Fictional undertaking evidence submitted for official review");
    const submitted = page.waitForResponse((r) =>
      r.url().includes(`/obligations/${obligation.id}/commands`),
    );
    await page
      .getByRole("button", { name: "Record submit", exact: true })
      .click();
    expect((await submitted).status()).toBe(200);
    await expect(
      page.locator(".obligation-card").getByText("SUBMITTED", { exact: true }),
    ).toBeVisible();
    await capture(page, "undertaking-submitted");
    await login("supervisor.north");
    await page.goto("/compliance?selected=" + obligation.id);
    await page
      .getByRole("combobox", { name: "Authorized action", exact: true })
      .selectOption("accept");
    await page
      .getByLabel("Evidence explanation / review reason")
      .fill("Fictional undertaking evidence checked and accepted");
    const accepted = page.waitForResponse((r) =>
      r.url().includes(`/obligations/${obligation.id}/commands`),
    );
    await page
      .getByRole("button", { name: "Record accept", exact: true })
      .click();
    expect((await accepted).status()).toBe(200);
    await expect(
      page.locator(".obligation-card").getByText("ACCEPTED", { exact: true }),
    ).toBeVisible();
    await capture(page, "undertaking-accepted");
    note(
      "Submitted undertaking evidence is not yet accepted compliance. The authorized reviewer records acceptance separately.",
    );
    await login("institution.a");
    await page.goto("/applications/" + id);
    await upload(true);
    const document = await db.document.findFirstOrThrow({
      where: { applicationId: id, title: "Fictional evaluator lease" },
    });
    await login("supervisor.north");
    await page.goto("/documents?selected=" + document.id);
    await expect(
      page.locator(".selected-document").getByText("Expired", { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator(".selected-document")
        .getByText(/Renewal pending verification/),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Preview / compare files", exact: true })
      .click();
    await expect(
      page.locator(".compare-previews canvas[data-rendered=true]"),
    ).toHaveCount(2);
    await page
      .getByLabel("Verification reason", { exact: true })
      .fill("Fictional replacement returned for a corrected evidence version");
    const returned = page.waitForResponse(
      (r) => r.url().endsWith("/review") && r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Return evidence", exact: true })
      .click();
    expect((await returned).status()).toBe(200);
    await expect(
      page.locator(".selected-document").getByText("Expired", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Effective v1", { exact: true })).toBeVisible();
    await capture(page, "rejected-renewal-preserves-effective-v1");
    note(
      "The accepted version remains expired while a replacement is pending or rejected. The two versions can be compared side by side.",
    );
    await page.goto("/alerts");
    await expect
      .poll(
        async () => {
          const r = await page.request.get("/api/alerts");
          return (await r.json()).escalations.some(
            (e: any) => e.applicationId === id && e.level === 1,
          );
        },
        { timeout: 30000 },
      )
      .toBe(true);
    await page.getByText(/Designated escalation events/).click();
    await expect(page.getByText(/Level 1 · SUPERVISOR/).first()).toBeVisible();
    await page.goto("/reports");
    await page
      .getByRole("combobox", { name: "Report", exact: true })
      .selectOption("overdue");
    await expect(
      page.getByRole("region", { name: "Scrollable report table" }),
    ).toContainText("Document");
    note(
      "Designated escalation and subject-level overdue reports support accountable follow-up. They do not issue penalties or revoke approval.",
    );
    await page.goto("/references");
    await expect(
      page.getByText(/Historical reference collection/),
    ).toBeVisible();
    note(
      "Public reference facts are read-only and source-linked. Their historical year is explicit, and they never create fictional visits or live approvals.",
    );
    done = true;
  } finally {
    await db.demoClock.update({
      where: { id: "current" },
      data: { runId: original.runId, now: original.now },
    });
    await context.close();
    await db.$disconnect();
    const output = {
      completed: done,
      continuity: { browserContexts: 1, pages: 1 },
      logins,
      notes,
      fictional: true,
      normalDemoTouched: false,
      videoRecorded: !!videoDir,
    };
    fs.mkdirSync(evidence() + "/operations", { recursive: true });
    fs.writeFileSync(
      evidence() + "/operations/continuous-walkthrough.json",
      JSON.stringify(output, null, 2),
    );
    if (video && videoDir) {
      await video.saveAs(
        path.join(
          videoDir,
          done
            ? "Anumitra-operations-walkthrough.webm"
            : "Anumitra-incomplete-walkthrough.webm",
        ),
      );
      const stamp = (n: number) =>
        new Date(n).toISOString().slice(11, 23).replace(".", ",");
      const subtitles = notes
        .map(
          (n, i) =>
            `${i + 1}\n${stamp(n.time)} --> ${stamp(notes[i + 1]?.time ?? n.time + 8000)}\n${n.text}\n`,
        )
        .join("\n");
      fs.writeFileSync(
        path.join(videoDir, "Anumitra-operations-walkthrough.srt"),
        subtitles,
      );
    }
  }
});
