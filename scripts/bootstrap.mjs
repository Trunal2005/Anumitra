import { spawnSync, spawn } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
mkdirSync(".local", { recursive: true });
const pg =
  process.env.PG_BIN ??
  (process.platform === "win32"
    ? "C:/Program Files/PostgreSQL/18/bin"
    : "/usr/lib/postgresql/18/bin");
const bin = (n) =>
  path.join(pg, n + (process.platform === "win32" ? ".exe" : ""));
function run(cmd, args, env = process.env) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32" && cmd === "npm.cmd",
  });
  if (r.status !== 0) throw new Error(`${cmd} failed (${r.status})`);
}
if (!existsSync(".env")) {
  const password = randomBytes(24).toString("hex");
  writeFileSync(".local/pg-password", password);
  writeFileSync(
    ".env",
    `DATABASE_URL=postgresql://anumitra:${password}@127.0.0.1:55432/anumitra\nSESSION_SECRET=${randomBytes(48).toString("hex")}\nDEMO_MODE=true\nNODE_ENV=development\nHOST=127.0.0.1\nPORT=3000\nAPP_ORIGIN=http://127.0.0.1:3000\nSMTP_HOST=127.0.0.1\nSMTP_PORT=1025\nSTORAGE_PATH=storage/private\n`,
  );
}
const { config } = await import("dotenv");
config();
if (!existsSync(".local/db/PG_VERSION"))
  run(bin("initdb"), [
    "-D",
    ".local/db",
    "-U",
    "anumitra",
    "--auth=scram-sha-256",
    "--pwfile=.local/pg-password",
    "--encoding=UTF8",
    "--locale=C",
  ]);
const status = spawnSync(bin("pg_ctl"), ["-D", ".local/db", "status"], {
  stdio: "ignore",
});
if (status.status !== 0)
  run(bin("pg_ctl"), [
    "-D",
    ".local/db",
    "-l",
    ".local/postgres.log",
    "-o",
    "-p 55432 -h 127.0.0.1",
    "-w",
    "start",
  ]);
const { Client } = await import("pg");
const root = new Client({
  connectionString: process.env.DATABASE_URL.replace(
    /\/anumitra$/,
    "/postgres",
  ),
});
await root.connect();
if (
  !(await root.query("select 1 from pg_database where datname='anumitra'"))
    .rowCount
)
  await root.query("CREATE DATABASE anumitra");
await root.end();
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
run(npm, ["run", "db:generate"]);
run(npm, ["run", "db:migrate"]);
run(npm, ["run", "db:seed"]);
if (!existsSync(".local/migration.env")) run(npm, ["run", "db:harden"]);
run(npm, ["run", "build"]);
if (existsSync(".local/mailpit.exe")) {
  const log = await import("node:fs");
  const out = log.openSync(".local/mailpit.log", "a");
  const child = spawn(
    path.resolve(".local/mailpit.exe"),
    [
      "--listen",
      "127.0.0.1:8025",
      "--smtp",
      "127.0.0.1:1025",
      "--database",
      path.resolve(".local/mailpit.db"),
    ],
    { detached: true, stdio: ["ignore", out, out], windowsHide: true },
  );
  child.unref();
}
console.log(
  "Ready. npm start + npm run worker; http://127.0.0.1:3000; Mailpit http://127.0.0.1:8025; credentials: .local/demo-credentials.json",
);
