import { createTestEnvironment } from "./isolated-env.mjs";
import { spawnSync } from "node:child_process";
const { env, directory, name } = await createTestEnvironment();
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
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log(
  "Isolated test target prepared: " + name + "; state directory: " + directory,
);
