import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "apps/api/src/index.ts"],
  {
    env: { ...process.env, NODE_ENV: "production", DEMO_MODE: "true" },
    encoding: "utf8",
  },
);
const refused =
  result.status !== 0 &&
  (result.stderr + result.stdout).includes(
    "Production cannot enable demo mode",
  );
if (!refused) throw new Error("Production demo guard did not refuse startup");
writeFileSync(
  "docs/evidence/production-guard.json",
  JSON.stringify(
    {
      executedAt: new Date(),
      demoProductionStartupRefused: true,
      exitCode: result.status,
    },
    null,
    2,
  ),
);
console.log("Production demo-mode startup correctly refused.");
