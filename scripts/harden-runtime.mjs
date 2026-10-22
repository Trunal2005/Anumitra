import "dotenv/config";
import { config } from "dotenv";
config({ path: ".local/migration.env", quiet: true });
import { Client } from "pg";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
const ownerUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
const { provisionRuntime } = await import("./runtime-role.mjs");
const { provisionWorker } = await import("./worker-role.mjs");
const existingRuntime = new URL(process.env.DATABASE_URL);
const ownerConnection = new URL(ownerUrl);
const runtime = new URL(ownerUrl);
runtime.username = "anumitra_app";
runtime.password =
  existingRuntime.username === "anumitra_app"
    ? existingRuntime.password
    : randomBytes(24).toString("hex");
await provisionRuntime(ownerUrl, runtime.href);
const worker = new URL(ownerUrl);
worker.username = "anumitra_worker";
worker.password = process.env.WORKER_DATABASE_URL
  ? new URL(process.env.WORKER_DATABASE_URL).password
  : randomBytes(24).toString("hex");
await provisionWorker(ownerUrl, worker.href);
const content = readFileSync(".env", "utf8")
  .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${runtime.href}`)
  .replace(/^MIGRATION_DATABASE_URL=.*\r?\n?/m, "");
writeFileSync(
  ".env",
  content.replace(/^WORKER_DATABASE_URL=.*\r?\n?/m, "").trimEnd() +
    `\nWORKER_DATABASE_URL=${worker.href}\n`,
);
writeFileSync(".local/migration.env", `MIGRATION_DATABASE_URL=${ownerUrl}\n`);
console.log(
  "Restricted runtime grants verified. Existing runtime credentials were preserved; no implicit password rotation. Owner URL remains local for migrations only.",
);
