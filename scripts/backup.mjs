import "dotenv/config";
import { spawnSync } from "node:child_process";
import { mkdirSync, cpSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
const target = path.resolve(
  process.argv[2] ??
    `.local/backups/${new Date().toISOString().replaceAll(":", "-")}`,
);
if (existsSync(target)) throw new Error("Backup destination must be new");
if (
  target.startsWith(path.resolve("dist")) ||
  !target.startsWith(path.resolve(".local") + path.sep)
)
  throw new Error("Backups must be inside private .local");
mkdirSync(target, { recursive: true });
const pg = process.env.PG_BIN ?? "C:/Program Files/PostgreSQL/18/bin";
const url = new URL(process.env.DATABASE_URL);
const args = [
  "-h",
  url.hostname,
  "-p",
  url.port,
  "-U",
  decodeURIComponent(url.username),
  "-d",
  url.pathname.slice(1),
  "-Fc",
  "-f",
  path.join(target, "database.dump"),
];
const result = spawnSync(
  path.join(pg, process.platform === "win32" ? "pg_dump.exe" : "pg_dump"),
  args,
  {
    stdio: "inherit",
    env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) },
  },
);
if (result.status !== 0) throw new Error("Backup failed");
cpSync(
  path.resolve(process.env.STORAGE_PATH ?? "storage/private"),
  path.join(target, "private-documents"),
  { recursive: true },
);
writeFileSync(
  path.join(target, "manifest.json"),
  JSON.stringify(
    {
      product: "Anumitra",
      time: new Date(),
      format: "pg_dump custom + exact private bytes",
      restore:
        "Restore to a fresh isolated database; do not overwrite a running instance.",
    },
    null,
    2,
  ),
);
console.log("Backup saved to private .local location.");
