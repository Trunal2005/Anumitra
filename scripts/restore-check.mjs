import "dotenv/config";
import { config } from "dotenv";
config({ path: ".local/migration.env", quiet: true });
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { Client } from "pg";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
const backups = path.resolve(".local/backups");
const latest = readdirSync(backups).sort().at(-1);
if (!latest) throw new Error("Create a backup first");
const source = path.join(backups, latest);
const name = "anumitra_restore_" + randomBytes(5).toString("hex");
const original = new URL(
  process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL,
);
const admin = new Client({ connectionString: original.href });
await admin.connect();
await admin.query(`CREATE DATABASE ${name}`);
const pg = process.env.PG_BIN ?? "C:/Program Files/PostgreSQL/18/bin";
const result = spawnSync(
  path.join(pg, process.platform === "win32" ? "pg_restore.exe" : "pg_restore"),
  [
    "-h",
    original.hostname,
    "-p",
    original.port,
    "-U",
    decodeURIComponent(original.username),
    "-d",
    name,
    "--exit-on-error",
    path.join(source, "database.dump"),
  ],
  {
    stdio: "inherit",
    env: { ...process.env, PGPASSWORD: decodeURIComponent(original.password) },
  },
);
if (result.status !== 0)
  throw new Error("Restore failed; isolated database retained for inspection");
const restoredUrl = new URL(original);
restoredUrl.pathname = "/" + name;
const restored = new Client({ connectionString: restoredUrl.href });
await restored.connect();
const records = await restored.query(
  'SELECT "storageKey",hash FROM "DocumentVersion"',
);
let verified = 0;
for (const row of records.rows) {
  const file = path.join(source, "private-documents", row.storageKey);
  if (!existsSync(file))
    throw new Error("Backup missing private bytes for " + row.storageKey);
  if (
    createHash("sha256").update(readFileSync(file)).digest("hex") !== row.hash
  )
    throw new Error("Document hash mismatch");
  verified++;
}
const counts = await restored.query(
  'SELECT (SELECT count(*) FROM "Application") AS applications,(SELECT count(*) FROM "Audit") AS audits',
);
await restored.end();
await admin.end();
writeFileSync(
  "docs/evidence/restore-check.json",
  JSON.stringify(
    {
      database: name,
      backup: latest,
      verifiedDocumentFiles: verified,
      counts: counts.rows[0],
      executedAt: new Date(),
      retained: true,
    },
    null,
    2,
  ),
);
console.log(
  `Restored to isolated ${name}; verified ${verified} private files.`,
);
