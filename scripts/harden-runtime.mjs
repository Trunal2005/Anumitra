import "dotenv/config";
import { config } from "dotenv";
config({ path: ".local/migration.env", quiet: true });
import { Client } from "pg";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
const ownerUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
const owner = new Client({ connectionString: ownerUrl });
await owner.connect();
const password = randomBytes(24).toString("hex");
if (
  !(await owner.query("SELECT 1 FROM pg_roles WHERE rolname='anumitra_app'"))
    .rowCount
)
  await owner.query(`CREATE ROLE anumitra_app LOGIN PASSWORD '${password}'`);
else await owner.query(`ALTER ROLE anumitra_app PASSWORD '${password}'`);
await owner.query("GRANT CONNECT ON DATABASE anumitra TO anumitra_app");
await owner.query("CREATE SCHEMA IF NOT EXISTS pgboss");
await owner.query("GRANT USAGE ON SCHEMA public, pgboss TO anumitra_app");
await owner.query("GRANT CREATE ON SCHEMA pgboss TO anumitra_app");
await owner.query(
  "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, pgboss TO anumitra_app",
);
await owner.query(
  "GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public, pgboss TO anumitra_app",
);
await owner.query(
  "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgboss TO anumitra_app",
);
await owner.query(
  'REVOKE UPDATE, DELETE ON "Audit", "Snapshot", "Decision", "DocumentVersion" FROM anumitra_app',
);
await owner.query(
  'GRANT UPDATE ("reviewState", "scanState") ON "DocumentVersion" TO anumitra_app',
);
await owner.end();
const runtime = new URL(ownerUrl);
runtime.username = "anumitra_app";
runtime.password = password;
const content = readFileSync(".env", "utf8")
  .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${runtime.href}`)
  .replace(/^MIGRATION_DATABASE_URL=.*\r?\n?/m, "");
writeFileSync(".env", content);
writeFileSync(".local/migration.env", `MIGRATION_DATABASE_URL=${ownerUrl}\n`);
console.log(
  "Runtime role created with no schema ownership or immutable-history mutation privileges. Owner URL retained locally for migrations only. Restart API and worker.",
);
