import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
const credentials = JSON.parse(
  readFileSync(".local/demo-credentials.json", "utf8"),
);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:3000/");
await page.getByLabel("Password", { exact: true }).fill(credentials.password);
await page.getByLabel("Email address").fill("supervisor.north@anumitra.test");
await page.getByRole("button", { name: "Enter your workspace" }).click();
await page.getByRole("heading", { name: /Welcome,/ }).waitFor();
await page.evaluate(() => document.fonts.ready);
const overflow = await page.evaluate(() =>
  [...document.querySelectorAll("body *")]
    .map((e) => ({
      tag: e.tagName,
      class: e.className?.toString(),
      width: e.getBoundingClientRect().width,
      right: e.getBoundingClientRect().right,
    }))
    .filter((e) => e.right > innerWidth + 1 && e.width > 0),
);
await page.screenshot({
  path: "docs/evidence/mobile-inspection.png",
  fullPage: true,
});
console.log(
  JSON.stringify(
    {
      dimensions: await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      })),
      overflow,
      errors,
    },
    null,
    2,
  ),
);
writeFileSync(
  "docs/evidence/mobile-inspection.json",
  JSON.stringify({ overflow, errors }, null, 2),
);
await browser.close();
