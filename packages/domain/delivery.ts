import { db } from "../db/index.ts";
import { type Actor, audit, can, ensure, getApp } from "./engine.ts";
import { z } from "zod";
export async function retryDelivery(a: Actor, id: string, input: unknown) {
  const c = z
    .object({
      reason: z.string().min(5).max(2000),
      expectedGeneration: z.number().int().positive(),
      acknowledgeDuplicate: z.boolean().optional(),
    })
    .parse(input);
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Outbox" WHERE id=${id} FOR UPDATE`;
    const o = await tx.outbox.findUniqueOrThrow({ where: { id } });
    const app = await getApp(a, o.applicationId, tx);
    ensure(
      can(a, app, ["SUPERVISOR", "BUREAU"]),
      "Retry permission required",
      403,
    );
    ensure(
      o.generation === c.expectedGeneration,
      "Retry generation changed; refresh delivery history",
    );
    ensure(
      ["FAILED", "EXHAUSTED", "AMBIGUOUS"].includes(o.state),
      "Delivery is not retryable",
    );
    ensure(
      o.state !== "AMBIGUOUS" || c.acknowledgeDuplicate,
      "Uncertain SMTP acceptance: acknowledge that retry may create a duplicate email",
      400,
    );
    const result = await tx.outbox.update({
      where: { id },
      data: {
        state: "QUEUED",
        jobId: null,
        generation: { increment: 1 },
        generationAttempts: 0,
        nextAt: new Date(),
      },
    });
    await tx.deliveryAttempt.create({
      data: {
        outboxId: id,
        generation: result.generation,
        state: "RETRY_AUTHORIZED",
        detail: `${c.reason}; previous state ${o.state}; prior generation ${o.generation}${o.state === "AMBIGUOUS" ? "; operator accepted possible duplicate delivery" : ""}`,
      },
    });
    await audit(
      tx,
      a,
      app,
      "retry-notification",
      `Generation ${result.generation}: ${c.reason}; prior attempts retained`,
    );
    return { ok: true, generation: result.generation };
  });
}
