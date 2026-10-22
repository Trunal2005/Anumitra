import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  cpSync,
  existsSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import pg from "pg";
import { assertTestTarget } from "./isolated-env.mjs";
import { postgresBin } from "./platform.mjs";
const env = JSON.parse(
  readFileSync(
    path.join(process.env.LOCAL_STATE_PATH, "environment.json"),
    "utf8",
  ),
);
const source = assertTestTarget(env.MIGRATION_DATABASE_URL);
const bin = postgresBin();
const target = path.join(process.env.LOCAL_STATE_PATH, "backup-" + Date.now());
mkdirSync(target);
function utility(name, args) {
  const result = spawnSync(
    path.join(bin, name + (process.platform === "win32" ? ".exe" : "")),
    [
      "-h",
      source.hostname,
      "-p",
      source.port,
      "-U",
      decodeURIComponent(source.username),
      ...args,
    ],
    {
      env: { ...process.env, PGPASSWORD: decodeURIComponent(source.password) },
      encoding: "utf8",
    },
  );
  if (result.status !== 0) throw new Error(`${name} failed: ${result.stderr}`);
}
utility("pg_dump", [
  "-d",
  source.pathname.slice(1),
  "-Fc",
  "-f",
  path.join(target, "database.dump"),
]);
cpSync(env.STORAGE_PATH, path.join(target, "private"), { recursive: true });
const owner = new pg.Client({ connectionString: source.href });
await owner.connect();
const name = "anumitra_test_restore_" + Date.now();
assertTestTarget(new URL("/" + name, source).href);
await owner.query(`CREATE DATABASE "${name}"`);
utility("pg_restore", [
  "-d",
  name,
  "--exit-on-error",
  "--no-owner",
  "--no-acl",
  path.join(target, "database.dump"),
]);
const restored = new pg.Client({
  connectionString: new URL("/" + name, source).href,
});
await restored.connect();
let verified = 0;
try {
  const rows = (
    await restored.query('SELECT "storageKey",hash FROM "DocumentVersion"')
  ).rows;
  for (const row of rows) {
    const file = path.join(target, "private", row.storageKey);
    if (
      !existsSync(file) ||
      createHash("sha256").update(readFileSync(file)).digest("hex") !== row.hash
    )
      throw new Error("Backup private document hash mismatch");
    verified++;
  }
  const query =
    'SELECT (SELECT count(*) FROM "Application") AS applications,(SELECT count(*) FROM "Audit") AS audits,(SELECT count(*) FROM "DocumentVersion") AS versions';
  const before = (await owner.query(query)).rows[0],
    after = (await restored.query(query)).rows[0];
  if (JSON.stringify(before) !== JSON.stringify(after))
    throw new Error("Restored record counts differ");
  writeFileSync(
    "docs/evidence/repair/restore.json",
    JSON.stringify(
      {
        executedAt: new Date(),
        source: source.pathname,
        restoredDatabase: name,
        retained: true,
        verifiedPrivateFiles: verified,
        sourceCounts: before,
        restoredCounts: after,
      },
      null,
      2,
    ),
  );
  console.log(
    `Backup/restore passed: ${verified} private files verified in a separate retained test database.`,
  );
} finally {
  await owner.end();
  await restored.end();
}
