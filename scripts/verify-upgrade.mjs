import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { parse } from "dotenv";
import pg from "pg";
import { postgresBin } from "./platform.mjs";
import { assertTestTarget } from "./isolated-env.mjs";
const config = parse(readFileSync(".env")),
  migration = parse(readFileSync(".local/migration.env"));
const source = new URL(migration.MIGRATION_DATABASE_URL),
  runtime = new URL(config.DATABASE_URL);
if (
  !["127.0.0.1", "localhost"].includes(source.hostname) ||
  source.pathname !== runtime.pathname ||
  source.pathname !== "/anumitra"
)
  throw new Error(
    "Normal upgrade verification requires the explicitly named local Anumitra database",
  );
const backup = path.resolve(".local/backups/pre-repair-2026-10-23");
if (!backup.startsWith(path.resolve(".local") + path.sep))
  throw new Error("Unsafe backup path");
const owner = new pg.Client({ connectionString: source.href });
await owner.connect();
const queries = {
  cases:
    'SELECT id,reference,state,version,"ownerId","workflowId",data,"dueAt","runId" FROM "Application" ORDER BY id',
  snapshots: 'SELECT * FROM "Snapshot" ORDER BY id',
  decisions: 'SELECT * FROM "Decision" ORDER BY id',
  versions: 'SELECT * FROM "DocumentVersion" ORDER BY id',
  audits: 'SELECT * FROM "Audit" ORDER BY id',
};
const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
async function snapshot(client) {
  const result = {};
  for (const [name, query] of Object.entries(queries)) {
    const rows = (await client.query(query)).rows;
    result[name] = new Map(rows.map((row) => [row.id, digest(row)]));
  }
  return result;
}
const before = await snapshot(owner);
const apply = process.argv.includes("--apply-normal");
let client = owner,
  target = source;
try {
  if (!apply) {
    const name = "anumitra_test_upgrade_" + Date.now();
    target = new URL("/" + name, source);
    assertTestTarget(target.href);
    await owner.query(`CREATE DATABASE "${name}"`);
    const restore = spawnSync(
      path.join(
        postgresBin(),
        process.platform === "win32" ? "pg_restore.exe" : "pg_restore",
      ),
      [
        "-h",
        source.hostname,
        "-p",
        source.port,
        "-U",
        decodeURIComponent(source.username),
        "-d",
        name,
        "--exit-on-error",
        "--no-owner",
        "--no-acl",
        path.join(backup, "database.dump"),
      ],
      {
        env: {
          ...process.env,
          PGPASSWORD: decodeURIComponent(source.password),
        },
        encoding: "utf8",
      },
    );
    if (restore.status !== 0)
      throw new Error("Isolated pre-repair restore failed: " + restore.stderr);
    client = new pg.Client({ connectionString: target.href });
    await client.connect();
  }
  const migrate = spawnSync(process.execPath, ["scripts/migrate.mjs"], {
    env: {
      ...process.env,
      DATABASE_URL: target.href,
      MIGRATION_DATABASE_URL: target.href,
    },
    encoding: "utf8",
  });
  if (migrate.status !== 0)
    throw new Error("Additive upgrade failed: " + migrate.stderr);
  console.log(migrate.stdout);
  const after = await snapshot(client);
  const checks = {};
  for (const name of Object.keys(before)) {
    for (const [id, hash] of before[name])
      if (after[name].get(id) !== hash)
        throw new Error("Original " + name + " record changed during upgrade");
    checks[name] = { preserved: before[name].size, after: after[name].size };
  }
  const invalid = (
    await client.query(
      `SELECT count(*) FROM "Application" a WHERE (SELECT count(*) FROM "StageAttempt" t WHERE t."applicationId"=a.id AND t.state='OPEN') <> CASE WHEN a.state IN ('DRAFT','APPROVED','CONDITIONAL','REJECTED') THEN 0 ELSE 1 END`,
    )
  ).rows[0].count;
  if (Number(invalid))
    throw new Error("Stage interval invariant failed after populated upgrade");
  const versions = (
    await client.query('SELECT "storageKey",hash FROM "DocumentVersion"')
  ).rows;
  const storage = apply
    ? path.resolve(config.STORAGE_PATH ?? "storage/private")
    : path.join(backup, "private-documents");
  for (const row of versions)
    if (
      createHash("sha256")
        .update(readFileSync(path.join(storage, row.storageKey)))
        .digest("hex") !== row.hash
    )
      throw new Error("Preserved private file hash mismatch");
  writeFileSync(
    "docs/evidence/repair/" +
      (apply ? "demo-upgrade" : "populated-upgrade") +
      ".json",
    JSON.stringify(
      {
        executedAt: new Date(),
        mode: apply
          ? "AUTHORIZED_ADDITIVE_NORMAL_UPGRADE"
          : "ISOLATED_RESTORE_UPGRADE",
        database: target.pathname,
        preserved: checks,
        invalidStageIntervalCounts: Number(invalid),
        verifiedPrivateFiles: versions.length,
        retained: true,
      },
      null,
      2,
    ),
  );
  console.log(
    "Populated additive upgrade and original records/private hashes verified.",
  );
} finally {
  if (client !== owner) await client.end();
  await owner.end();
}
