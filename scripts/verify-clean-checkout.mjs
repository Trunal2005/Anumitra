import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  openSync,
} from "node:fs";
import { spawnSync, spawn } from "node:child_process";
import path from "node:path";
import { parse } from "dotenv";
const root = process.cwd(),
  destination = path.resolve(".local/clean-checkout-" + Date.now());
if (!destination.startsWith(path.join(root, ".local") + path.sep))
  throw new Error("Unsafe checkout target");
const files = spawnSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .stdout.trim()
  .split(/\r?\n/);
mkdirSync(destination, { recursive: true });
for (const file of files) {
  if (file.startsWith(".local/") || file.startsWith("node_modules/"))
    throw new Error("Private file unexpectedly in checkout manifest");
  const target = path.join(destination, file);
  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(path.join(root, file), target);
}
const owner =
  process.env.MIGRATION_DATABASE_URL ??
  parse(readFileSync(".local/migration.env")).MIGRATION_DATABASE_URL;
const env = { ...process.env, MIGRATION_DATABASE_URL: owner };
const results = [];
function run(command, args, expected = 0) {
  const result = spawnSync(command, args, {
    cwd: destination,
    env,
    encoding: "utf8",
    shell: process.platform === "win32" && command === "npm.cmd",
    maxBuffer: 20 * 1024 * 1024,
  });
  writeFileSync(
    path.join(destination, "check-" + results.length + ".log"),
    (result.stdout ?? "") + (result.stderr ?? ""),
  );
  if (result.status !== expected)
    throw new Error(
      `Clean checkout ${command} ${args.join(" ")} failed; inspect private check log`,
    );
  results.push(args.join(" "));
  console.log("Clean checkout passed: " + args.join(" "));
}
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
run(npm, ["ci"]);
run(npm, ["run", "db:generate"]);
run(npm, ["run", "build"]);
run(process.execPath, ["scripts/prepare-test.mjs"]);
const directory = readFileSync(
  path.join(destination, ".local/current-test-target"),
  "utf8",
).trim();
const isolated = JSON.parse(
  readFileSync(path.join(directory, "environment.json"), "utf8"),
);
Object.assign(env, isolated);
// A second additive migrate/seed must preserve the existing test namespace.
run(process.execPath, ["scripts/migrate.mjs"]);
run(process.execPath, ["--import", "tsx", "packages/db/seed.ts"]);
writeFileSync(
  path.join(destination, ".env"),
  "DATABASE_URL=" +
    isolated.DATABASE_URL +
    "\nSESSION_SECRET=" +
    isolated.SESSION_SECRET +
    "\n",
);
const refusal = spawnSync(process.execPath, ["scripts/bootstrap.mjs"], {
  cwd: destination,
  env,
  encoding: "utf8",
});
if (
  refusal.status === 0 ||
  !((refusal.stderr ?? "") + (refusal.stdout ?? "")).includes(
    "Refusing to overwrite credentials",
  )
)
  throw new Error("Missing private cluster/password refusal failed");
results.push("existing .env without private cluster/password safely refused");
writeFileSync(
  "docs/evidence/repair/clean-checkout.json",
  JSON.stringify(
    {
      executedAt: new Date(),
      sourceFiles: files.length,
      isolatedDatabase: new URL(isolated.DATABASE_URL).pathname,
      checks: results,
      dependencyInstall: true,
      normalDemoUntouched: true,
      retainedPrivateCheckout: true,
    },
    null,
    2,
  ),
);
console.log(
  "Clean checkout installation/build/new database/second migrate-seed verification passed.",
);
