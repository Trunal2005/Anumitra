import { parse } from "dotenv";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import pg from "pg";
export function assertTestTarget(url) {
  const u = new URL(url);
  if (
    !["127.0.0.1", "localhost", "postgres"].includes(u.hostname) ||
    !/^\/anumitra_test_[a-z0-9_]+$/.test(u.pathname)
  )
    throw new Error("Refusing non-local or unmarked test database");
  return u;
}
export async function createTestEnvironment() {
  const base = existsSync(".env") ? parse(readFileSync(".env")) : {};
  const migration = existsSync(".local/migration.env")
    ? parse(readFileSync(".local/migration.env"))
    : {};
  const ownerUrl =
    process.env.MIGRATION_DATABASE_URL ?? migration.MIGRATION_DATABASE_URL;
  if (!ownerUrl)
    throw new Error(
      "Provide local MIGRATION_DATABASE_URL or run the native bootstrap first. Tests never reuse the normal application database.",
    );
  const owner = new URL(ownerUrl);
  if (!["localhost", "127.0.0.1"].includes(owner.hostname))
    throw new Error("Test provisioning requires loopback PostgreSQL");
  const name = "anumitra_test_" + Date.now();
  const target = new URL(owner);
  target.pathname = "/" + name;
  assertTestTarget(target.href);
  const conn = new pg.Client({ connectionString: ownerUrl });
  await conn.connect();
  await conn.query(`CREATE DATABASE "${name}"`);
  await conn.end();
  const directory = path.resolve(".local/test-runs/" + name);
  mkdirSync(directory, { recursive: true });
  const env = {
    ...base,
    DATABASE_URL: target.href,
    MIGRATION_DATABASE_URL: target.href,
    ANUMITRA_TEST_TARGET: "disposable",
    LOCAL_STATE_PATH: directory,
    STORAGE_PATH: path.join(directory, "private"),
    PORT: "3100",
    APP_ORIGIN: "http://127.0.0.1:3100",
    TEST_API_ORIGIN: "http://127.0.0.1:3100",
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "1125",
    TEST_MAILPIT_ORIGIN: "http://127.0.0.1:8125",
    SESSION_SECRET: randomBytes(48).toString("hex"),
    DEMO_MODE: "true",
    NODE_ENV: "test",
    TEST_EVIDENCE_DIR: "docs/evidence/repair",
  };
  writeFileSync(path.join(directory, "environment.json"), JSON.stringify(env));
  writeFileSync(".local/current-test-target", directory);
  return { env, directory, name };
}
