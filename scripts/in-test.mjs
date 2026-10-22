import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { assertTestTarget } from "./isolated-env.mjs";
const directory = readFileSync(".local/current-test-target", "utf8").trim();
const env = JSON.parse(readFileSync(path.join(directory, "environment.json")));
assertTestTarget(env.DATABASE_URL);
const child = spawn(process.execPath, process.argv.slice(2), {
  env: { ...process.env, ...env },
  stdio: "inherit",
  windowsHide: true,
});
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
