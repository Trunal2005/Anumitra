import "dotenv/config";
import PgBoss from "pg-boss";
import pg from "pg";
if (process.env.WORKER_DATABASE_URL)
  process.env.DATABASE_URL = process.env.WORKER_DATABASE_URL;
const { db } = await import("../../../packages/db/index.ts");
const { scan, deliver } = await import("../../../packages/domain/alerts.ts");
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
// Recover before accepting work: an interrupted SMTP attempt may already have been accepted.
await db.$transaction(async (tx) => {
  for (const intent of await tx.outbox.findMany({
    where: { state: "ATTEMPTED" },
  })) {
    await tx.outbox.update({
      where: { id: intent.id },
      data: { state: "AMBIGUOUS" },
    });
    await tx.deliveryAttempt.create({
      data: {
        outboxId: intent.id,
        generation: intent.generation,
        state: "AMBIGUOUS",
        detail:
          "Worker restarted after a committed attempt marker; prior SMTP acceptance is unknown",
      },
    });
  }
});
await boss.work<{ id: string; generation?: number }>(
  "notification",
  { batchSize: 20, pollingIntervalSeconds: 1 },
  async (jobs) => {
    await Promise.all(
      jobs.map((job) => deliver(job.data.id, job.data.generation ?? 1)),
    );
  },
);
let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    await db.workerHeartbeat.upsert({
      where: { id: "notification" },
      create: { id: "notification", status: "SCANNING" },
      update: { status: "SCANNING" },
    });
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
        { id: o.id, generation: o.generation },
        {
          singletonKey: `${o.id}:g${o.generation}:a${o.generationAttempts}`,
          singletonSeconds: 30,
          retryLimit: 3,
          retryDelay: 2,
          retryBackoff: true,
          priority: o.title.includes("ESCALATION") ? 5 : 0,
        },
      );
      if (jobId)
        await db.outbox.update({
          where: { id: o.id, generation: o.generation },
          data: { jobId },
        });
    }
    const assigned = await db.outbox.findMany({
      where: { state: "QUEUED", jobId: { not: null } },
      take: 100,
      orderBy: { createdAt: "asc" },
    });
    for (const intent of assigned) {
      const job = await boss.getJobById("notification", intent.jobId!);
      if (!job || ["failed", "cancelled", "completed"].includes(job.state)) {
        await db.$transaction(async (tx) => {
          const changed = await tx.outbox.updateMany({
            where: {
              id: intent.id,
              generation: intent.generation,
              state: "QUEUED",
              jobId: intent.jobId,
            },
            data: {
              state: intent.generationAttempts >= 3 ? "EXHAUSTED" : "FAILED",
              jobId: null,
              attempts: { increment: 1 },
              generationAttempts: { increment: 1 },
              nextAt: new Date(Date.now() + 5000),
            },
          });
          if (changed.count)
            await tx.deliveryAttempt.create({
              data: {
                outboxId: intent.id,
                generation: intent.generation,
                state: "TRANSPORT_FAILED",
                detail:
                  "Durable queue job missing or exhausted; relay will retry within its bound",
              },
            });
        });
      }
    }
    await db.workerHeartbeat.update({
      where: { id: "notification" },
      data: { status: "READY" },
    });
  } catch (e) {
    console.error("Worker scan failed", e instanceof Error ? e.message : e);
  } finally {
    running = false;
  }
}
const timer = setInterval(tick, 3000);
const heartbeatTimer = setInterval(() => {
  db.workerHeartbeat
    .upsert({
      where: { id: "notification" },
      create: { id: "notification", status: running ? "SCANNING" : "READY" },
      update: { status: running ? "SCANNING" : "READY" },
    })
    .catch((e) => console.error("Heartbeat failed", e.message));
}, 5000);
await tick();
console.log(
  "Anumitra worker ready; durable PostgreSQL queue, local Mailpit only.",
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    clearInterval(timer);
    clearInterval(heartbeatTimer);
    await db.workerHeartbeat.updateMany({
      where: { id: "notification" },
      data: { status: "STOPPED" },
    });
    await boss.stop({ graceful: true });
    await db.$disconnect();
    await coordinator.end();
    process.exit(0);
  });
