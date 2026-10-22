import "dotenv/config";
import { db } from "../packages/db/index.ts";
import { seedRun } from "../packages/db/seed.ts";
if (process.env.DEMO_MODE !== "true" || !process.argv.includes("--new-run"))
  throw new Error(
    "Requires DEMO_MODE=true and --new-run. Previous history is preserved; only the active demo namespace changes.",
  );
try {
  console.log(await seedRun());
} finally {
  await db.$disconnect();
}
