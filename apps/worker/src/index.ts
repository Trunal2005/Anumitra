import "dotenv/config";
import PgBoss from "pg-boss";
import pg from "pg";
import { db } from "../../../packages/db/index.ts";
import { scan, deliver } from "../../../packages/domain/alerts.ts";
const coordinator = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});
await coordinator.connect();
const lease = await coordinator.query(
  "SELECT pg_try_advisory_lock(hashtext('anumitra-notification-coordinator')) AS locked",
);
if (!lease.rows[0].locked) {
  await coordinator.end();
  throw new Error(
    "Anumitra notification coordinator is already running. Stop it before starting another.",
  );
}
const boss = new PgBoss(process.env.DATABASE_URL!);
boss.on("error", (e) => console.error("Queue error", e.message));
await boss.start();
await boss.createQueue("notification");
await boss.work<{ id: string }>(
  "notification",
  { batchSize: 20, pollingIntervalSeconds: 1 },
  async (jobs) => {
    await Promise.all(jobs.map((job) => deliver(job.data.id)));
  },
);
// A committed ATTEMPTED marker left by a previous process is ambiguous, not successful.
await db.outbox.updateMany({
  where: { state: "ATTEMPTED" },
  data: { state: "AMBIGUOUS" },
});
let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    await scan();
    const pending = await db.outbox.findMany({
      where: {
        OR: [{ state: "QUEUED", jobId: null }, { state: "FAILED" }],
        nextAt: { lte: new Date() },
      },
      take: 100,
      orderBy: { nextAt: "asc" },
    });
    for (const o of pending) {
      const jobId = await boss.send(
        "notification",
        { id: o.id },
        {
          singletonKey: o.id,
          singletonSeconds: 30,
          retryLimit: 3,
          retryDelay: 2,
          retryBackoff: true,
          priority: o.title.includes("OVERDUE_ESCALATION") ? 5 : 0,
        },
      );
      if (jobId)
        await db.outbox.update({ where: { id: o.id }, data: { jobId } });
    }
    const assigned = await db.outbox.findMany({
      where: { state: "QUEUED", jobId: { not: null } },
      take: 100,
      orderBy: { createdAt: "asc" },
    });
    for (const intent of assigned) {
      const job = await boss.getJobById("notification", intent.jobId!);
      if (!job || ["failed", "cancelled"].includes(job.state)) {
        await db.$transaction([
          db.outbox.update({
            where: { id: intent.id },
            data: {
              state: intent.attempts >= 3 ? "EXHAUSTED" : "FAILED",
              jobId: null,
              attempts: { increment: 1 },
              nextAt: new Date(Date.now() + 5000),
            },
          }),
          db.deliveryAttempt.create({
            data: {
              outboxId: intent.id,
              state: "TRANSPORT_FAILED",
              detail:
                "Durable queue job missing or exhausted; relay will retry within its bound",
            },
          }),
        ]);
      }
    }
  } catch (e) {
    console.error("Worker scan failed", e instanceof Error ? e.message : e);
  } finally {
    running = false;
  }
}
const timer = setInterval(tick, 3000);
await tick();
console.log(
  "Anumitra worker ready; durable PostgreSQL queue, local Mailpit only.",
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    clearInterval(timer);
    await boss.stop({ graceful: true });
    await db.$disconnect();
    await coordinator.end();
    process.exit(0);
  });
