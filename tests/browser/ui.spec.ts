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
  readFileSync(".local/demo-credentials.json", "utf8"),
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
    path: "docs/evidence/welcome-1440.png",
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
    path: "docs/evidence/overview-1440.png",
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
    path: "docs/evidence/application-review-1440.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "EVC scheduling", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Expert visits. Coordinated." }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/evidence/evc-1440.png", fullPage: true });
  await page.getByRole("link", { name: "Rules & policy", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Rules & policy versions." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Validate & simulate" }).click();
  await expect(page.getByText("VALIDATED ROUTE")).toBeVisible();
  await page.screenshot({
    path: "docs/evidence/rules-1440.png",
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
      path: `docs/evidence/overview-${width}.png`,
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
