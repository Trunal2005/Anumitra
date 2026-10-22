import { readFileSync, writeFileSync, mkdirSync, openSync } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createTestEnvironment, assertTestTarget } from "./isolated-env.mjs";
import { provisionRuntime } from "./runtime-role.mjs";
import pg from "pg";
import { sourceState } from "./source-state.mjs";
import { provisionWorker } from "./worker-role.mjs";
const existing = process.argv.includes("--existing");
let state;
if (existing) {
  const directory = readFileSync(".local/current-test-target", "utf8").trim();
  state = {
    directory,
    env: JSON.parse(readFileSync(path.join(directory, "environment.json"))),
  };
} else state = await createTestEnvironment();
const { env, directory } = state;
assertTestTarget(env.DATABASE_URL);
mkdirSync("docs/evidence/repair", { recursive: true });
function run(args, custom = env, file) {
  const fd = file ? openSync(file, "w") : undefined;
  const result = spawnSync(process.execPath, args, {
    env: { ...process.env, ...custom },
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    ...(fd !== undefined ? { stdio: ["ignore", fd, fd], timeout: 600000 } : {}),
  });
  if (file) process.stdout.write(readFileSync(file, "utf8"));
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (result.status !== 0)
    throw new Error(
      `Verification command failed: ${args.join(" ")} (${result.status})`,
    );
}
if (!existing) {
  run([
    "node_modules/prisma/build/index.js",
    "migrate",
    "deploy",
    "--schema",
    "packages/db/schema.prisma",
  ]);
  run(["--import", "tsx", "packages/db/seed.ts"]);
  const owner = env.DATABASE_URL;
  const runtime = new URL(owner);
  runtime.username = "anumitra_test_runtime_" + Date.now();
  runtime.password = randomBytes(24).toString("hex");
  await provisionRuntime(owner, runtime.href);
  const worker = new URL(runtime);
  worker.username = runtime.username.replace("runtime", "worker");
  worker.password = randomBytes(24).toString("hex");
  const privileges = await provisionWorker(owner, worker.href);
  env.WORKER_DATABASE_URL = worker.href;
  writeFileSync(
    "docs/evidence/repair/worker-privileges.json",
    JSON.stringify(privileges, null, 2),
  );
  env.DATABASE_URL = runtime.href;
  writeFileSync(path.join(directory, "environment.json"), JSON.stringify(env));
}
if (
  !process.argv.includes("--backend") &&
  !process.argv.includes("--skip-build")
) {
  run(["scripts/pdf-assets.mjs"]);
  run(["node_modules/typescript/bin/tsc", "--noEmit"]);
  run(["node_modules/vite/bin/vite.js", "build"]);
}
const runtime = { ...env };
delete runtime.MIGRATION_DATABASE_URL;
const children = [];
function start(args, name, executable = process.execPath) {
  const log = openSync(path.join(directory, name + ".log"), "a");
  const child = spawn(executable, args, {
    env: { ...process.env, ...runtime },
    windowsHide: true,
    stdio: ["ignore", log, log],
  });
  children.push(child);
  return child;
}
async function ready(url) {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Service did not become ready: " + url);
}
const report = {
  source: sourceState(),
  status: "RUNNING",
  startedAt: new Date(),
  sourceRevision: spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).stdout.trim(),
  target: new URL(env.DATABASE_URL).pathname,
  databaseIsDisposable: true,
  services: [],
  checks: [],
};
try {
  if (process.env.TEST_MAILPIT_EXTERNAL !== "true")
    start(
      [
        "--listen",
        "127.0.0.1:8125",
        "--smtp",
        "127.0.0.1:1125",
        "--database",
        path.join(directory, "mailpit.db"),
      ],
      "mailpit",
      path.resolve(process.env.MAILPIT_BIN ?? ".local/mailpit.exe"),
    );
  await ready(env.TEST_MAILPIT_ORIGIN + "/api/v1/info");
  let api = start(["--import", "tsx", "apps/api/src/index.ts"], "api");
  await ready(env.TEST_API_ORIGIN + "/api/health");
  report.services = ["isolated PostgreSQL", "isolated API", "isolated Mailpit"];
  if (process.argv.includes("--repair-only")) {
    run(
      [
        "--import",
        "tsx",
        "--test",
        "--test-concurrency=1",
        "tests/repair.test.ts",
      ],
      runtime,
      "docs/evidence/repair/regressions.tap",
    );
    report.checks.push("repair regressions passed");
  } else {
    if (!process.argv.includes("--browser-only")) {
      run(
        [
          "--import",
          "tsx",
          "--test",
          "--test-concurrency=1",
          "tests/integration.test.ts",
          "tests/operations.test.ts",
          "tests/repair.test.ts",
        ],
        runtime,
        "docs/evidence/repair/backend.tap",
      );
      report.checks.push("backend/operations/repair tests passed");
    }
    if (!process.argv.includes("--backend")) {
      const connection = new pg.Client({ connectionString: env.DATABASE_URL });
      await connection.connect();
      const sampleQuery =
        'SELECT id,version,"workflowId" FROM "Application" ORDER BY id';
      const before = JSON.stringify((await connection.query(sampleQuery)).rows);
      api.kill();
      await new Promise((r) => {
        api.once("exit", r);
        setTimeout(r, 3000);
      });
      api = start(["--import", "tsx", "apps/api/src/index.ts"], "api-restart");
      await ready(env.TEST_API_ORIGIN + "/api/health");
      if (before !== JSON.stringify((await connection.query(sampleQuery)).rows))
        throw new Error("Case persistence changed across API restart");
      await connection.end();
      report.checks.push(
        "API restart preserved all case IDs, versions and policy pins",
      );
      const worker = start(
        ["--import", "tsx", "apps/worker/src/index.ts"],
        "worker-browser",
      );
      for (let i = 0; i < 240; i++) {
        const health = await (
          await fetch(env.TEST_API_ORIGIN + "/api/health")
        ).json();
        if (health.status === "ready") break;
        if (i === 239)
          throw new Error("Worker/SMTP readiness did not become ready");
        await new Promise((r) => setTimeout(r, 250));
      }
      run(
        [
          "node_modules/@playwright/test/cli.js",
          "test",
          ...(process.argv.includes("--journey-only")
            ? ["--grep", "cross-role"]
            : []),
        ],
        runtime,
        "docs/evidence/repair/browser.txt",
      );
      report.checks.push("browser passed");
      worker.kill();
    }
  }
  report.status = "PASSED";
} catch (error) {
  report.status = "FAILED";
  report.error = error.message;
  throw error;
} finally {
  for (const child of children.reverse()) {
    child.kill("SIGTERM");
    await new Promise((r) => {
      if (child.exitCode !== null) return r();
      child.once("exit", r);
      setTimeout(r, 2000);
    });
  }
  report.finishedAt = new Date();
  writeFileSync(
    "docs/evidence/repair/verification.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    "Disposable target retained for inspection; normal demo untouched.",
  );
}
