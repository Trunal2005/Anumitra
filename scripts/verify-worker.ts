import "dotenv/config";
import { spawn } from "node:child_process";
import { openSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import PgBoss from "pg-boss";
import { db } from "../packages/db/index.ts";
import { runId } from "../packages/domain/engine.ts";
const app = await db.application.findFirstOrThrow({
  where: { runId: await runId(), institutionId: "I01" },
});
const user = await db.user.findUniqueOrThrow({
  where: { email: "institution.a@anumitra.test" },
});
const create = (state: string, title: string) =>
  db.outbox.create({
    data: {
      applicationId: app.id,
      recipientId: user.id,
      logicalKey: "recovery-" + randomUUID(),
      revision: app.version,
      subjectId: app.id,
      runId: app.runId,
      title,
      state,
    },
  });
const stoppedAt = new Date();
const queued = await create(
  "QUEUED",
  "Anumitra browser-closed worker recovery proof",
);
const ambiguous = await create(
  "ATTEMPTED",
  "Anumitra prior process ambiguous SMTP boundary",
);
const boss = new PgBoss(process.env.DATABASE_URL!);
await boss.start();
await boss.createQueue("notification");
await boss.send(
  "notification",
  { id: queued.id },
  { singletonKey: queued.id, singletonSeconds: 30, priority: 100 },
);
await boss.stop();
// Deliberately leave jobId unacknowledged: recovery must remain logically idempotent.
const log = openSync(".local/worker-verification.log", "a");
const started = Date.now();
const child = spawn(
  process.execPath,
  ["--import", "tsx", path.resolve("apps/worker/src/index.ts")],
  { env: process.env, windowsHide: true, stdio: ["ignore", log, log] },
);
let result;
try {
  for (let i = 0; i < 80; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const delivery = await db.outbox.findUniqueOrThrow({
      where: { id: queued.id },
    });
    if (delivery.state === "SMTP_ACCEPTED") {
      const boundary = await db.outbox.findUniqueOrThrow({
        where: { id: ambiguous.id },
      });
      result = {
        workerStoppedAt: stoppedAt,
        queuedWhileStopped: true,
        transportEnqueuedBeforeOutboxAcknowledgement: true,
        smtpState: delivery.state,
        recoveryMilliseconds: Date.now() - started,
        ambiguousState: boundary.state,
        inboxCount: await db.notification.count({
          where: { logicalKey: queued.logicalKey },
        }),
        acceptanceAttempts: await db.deliveryAttempt.count({
          where: { outboxId: queued.id, state: "SMTP_ACCEPTED" },
        }),
      };
      break;
    }
  }
  if (!result)
    throw new Error(
      "Worker did not recover the committed intent within 40 seconds",
    );
  if (
    result.ambiguousState !== "AMBIGUOUS" ||
    result.inboxCount !== 1 ||
    result.acceptanceAttempts !== 1
  )
    throw new Error("Recovery invariant failed");
  writeFileSync(
    "docs/evidence/worker-recovery.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
} finally {
  child.kill("SIGTERM");
  await db.$disconnect();
}
