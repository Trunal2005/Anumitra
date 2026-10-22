import type { Application } from "@prisma/client";
import type { Tx } from "../db/index.ts";
export const terminalStates = ["DRAFT", "APPROVED", "CONDITIONAL", "REJECTED"];
export async function transitionAttempt(
  tx: Tx,
  before: Application,
  after: { state: string; stageIndex: number; ownerId: string | null },
  at: Date,
) {
  const open = await tx.stageAttempt.findMany({
    where: { applicationId: before.id, state: "OPEN" },
  });
  if (before.state === after.state) {
    if (open.length === 1 && open[0].ownerId !== after.ownerId)
      await tx.stageAttempt.update({
        where: { id: open[0].id },
        data: { ownerId: after.ownerId },
      });
    return;
  }
  await tx.stageAttempt.updateMany({
    where: { applicationId: before.id, state: "OPEN" },
    data: {
      state: after.state === "AWAITING_RESPONSE" ? "RETURNED" : "COMPLETED",
      endedAt: at,
    },
  });
  if (!terminalStates.includes(after.state))
    await tx.stageAttempt.create({
      data: {
        applicationId: before.id,
        stage: after.state,
        stageIndex: after.stageIndex,
        ownerId: after.state === "AWAITING_RESPONSE" ? null : after.ownerId,
        startedAt: at,
      },
    });
}
