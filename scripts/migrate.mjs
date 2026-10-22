import "dotenv/config";
import { config } from "dotenv";
config({ path: ".local/migration.env", quiet: true });
import { spawnSync } from "node:child_process";
const r = spawnSync(
  process.execPath,
  [
    "node_modules/prisma/build/index.js",
    "migrate",
    "deploy",
    "--schema",
    "packages/db/schema.prisma",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL,
    },
  },
);
process.exit(r.status ?? 1);
