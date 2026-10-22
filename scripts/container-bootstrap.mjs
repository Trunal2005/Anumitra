import { spawnSync } from "node:child_process";
import { provisionRuntime } from "./runtime-role.mjs";
import { provisionWorker } from "./worker-role.mjs";
if (!process.env.MIGRATION_DATABASE_URL || !process.env.RUNTIME_DATABASE_URL)
  throw new Error("Separate owner/runtime connection strings are required");
const ownerEnv = {
  ...process.env,
  DATABASE_URL: process.env.MIGRATION_DATABASE_URL,
};
for (const args of [
  [
    "node_modules/prisma/build/index.js",
    "migrate",
    "deploy",
    "--schema",
    "packages/db/schema.prisma",
  ],
  ["--import", "tsx", "packages/db/seed.ts"],
]) {
  const r = spawnSync(process.execPath, args, {
    env: ownerEnv,
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
await provisionRuntime(
  process.env.MIGRATION_DATABASE_URL,
  process.env.RUNTIME_DATABASE_URL,
);
if (!process.env.WORKER_DATABASE_URL)
  throw new Error("Separate restricted worker URL is required");
await provisionWorker(
  process.env.MIGRATION_DATABASE_URL,
  process.env.WORKER_DATABASE_URL,
);
console.log(
  "Schema/seed prepared; restricted runtime account verified. Owner credentials are not passed to API/worker.",
);
