import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
export function postgresBin() {
  if (
    process.env.PG_BIN &&
    existsSync(
      path.join(
        process.env.PG_BIN,
        process.platform === "win32" ? "pg_ctl.exe" : "pg_ctl",
      ),
    )
  )
    return process.env.PG_BIN;
  if (process.platform === "win32") {
    const root = path.join(
      process.env.ProgramFiles ?? "C:/Program Files",
      "PostgreSQL",
    );
    if (existsSync(root)) {
      for (const version of readdirSync(root).sort(
        (a, b) => Number(b) - Number(a),
      )) {
        const bin = path.join(root, version, "bin");
        if (existsSync(path.join(bin, "pg_ctl.exe"))) return bin;
      }
    }
  }
  const config = spawnSync("pg_config", ["--bindir"], { encoding: "utf8" });
  if (
    config.status === 0 &&
    existsSync(path.join(config.stdout.trim(), "pg_ctl"))
  )
    return config.stdout.trim();
  throw new Error(
    "PostgreSQL binaries unavailable. Install PostgreSQL and set PG_BIN to its bin directory. No existing data/configuration was changed.",
  );
}
