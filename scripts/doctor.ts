import "dotenv/config";
import { readiness } from "../packages/domain/readiness.ts";
import { db } from "../packages/db/index.ts";
const result = await readiness();
let api = false;
try {
  api = (
    await fetch(
      (process.env.APP_ORIGIN ?? "http://127.0.0.1:3000") + "/api/health",
      { signal: AbortSignal.timeout(1500) },
    )
  ).ok;
} catch {}
console.log(
  JSON.stringify(
    {
      ...result,
      checks: { api, ...result.checks },
      status: !api ? "api-unavailable" : result.status,
    },
    null,
    2,
  ),
);
await db.$disconnect();
process.exit(
  result.dataAvailable &&
    (!process.argv.includes("--strict") || (api && result.status === "ready"))
    ? 0
    : 1,
);
