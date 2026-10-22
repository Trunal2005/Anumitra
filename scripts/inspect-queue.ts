import "dotenv/config";
import { db } from "../packages/db/index.ts";
console.log(
  "Outbox:",
  await db.outbox.groupBy({ by: ["state"], _count: true }),
);
console.log(
  "Recovery records:",
  await db.outbox.findMany({
    where: { logicalKey: { startsWith: "recovery-" } },
    select: {
      id: true,
      state: true,
      jobId: true,
      attempts: true,
      deliveries: true,
    },
  }),
);
console.log(
  "Queue states:",
  await db.$queryRawUnsafe(
    "SELECT name,state,count(*)::int FROM pgboss.job GROUP BY name,state",
  ),
);
console.log(
  "Failed jobs:",
  await db.$queryRawUnsafe(
    "SELECT state,output FROM pgboss.job WHERE state='failed' LIMIT 3",
  ),
);
await db.$disconnect();
