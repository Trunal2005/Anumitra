import { z } from "zod";
import { db } from "../db/index.ts";
import {
  type Actor,
  audit,
  can,
  clock,
  ensure,
  getApp,
  notify,
} from "./engine.ts";
const visitSchema = z.object({
  mode: z.enum(["PHYSICAL", "ONLINE", "HYBRID"]),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  participants: z.array(z.string()).min(1).max(10),
  metadata: z.string().min(3).max(1000),
  reason: z.string().min(5).max(2000),
  visitId: z.string().optional(),
});
export async function schedule(a: Actor, id: string, input: unknown) {
  const c = visitSchema.parse(input);
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id=${id} FOR UPDATE`;
      const app = await getApp(a, id, tx);
      ensure(
        can(a, app, ["SUPERVISOR", "BUREAU"]),
        "Only scoped coordinators schedule",
        403,
      );
      ensure(app.state === "EVC", "Case is not EVC eligible");
      const startAt = new Date(c.startAt),
        endAt = new Date(c.endAt);
      ensure(
        startAt < endAt && startAt > (await clock(tx)),
        "Choose a future positive time range",
      );
      ensure(
        new Set(c.participants).size === c.participants.length,
        "Duplicate participants",
        400,
      );
      for (const userId of [...c.participants].sort()) {
        await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${userId}))`;
        const u = await tx.user.findUnique({
          where: { id: userId },
          include: { grants: true },
        });
        ensure(
          u?.grants.some(
            (g) =>
              g.role === "COMMITTEE" &&
              g.committee === "EVC" &&
              (!g.regionId || g.regionId === app.institution.regionId),
          ),
          "Participant lacks EVC grant",
          403,
        );
        ensure(
          await tx.availability.count({
            where: { userId, startAt: { lte: startAt }, endAt: { gte: endAt } },
          }),
          "Participant has not declared availability",
        );
        ensure(
          !(await tx.reservation.count({
            where: {
              userId,
              active: true,
              startAt: { lt: endAt },
              endAt: { gt: startAt },
              ...(c.visitId ? { visitId: { not: c.visitId } } : {}),
            },
          })),
          "Participant already reserved for an overlapping visit",
        );
      }
      let visit;
      if (c.visitId) {
        const old = app.visits.find((v) => v.id === c.visitId);
        ensure(old && old.state !== "COMPLETED", "Visit cannot be rescheduled");
        await tx.reservation.updateMany({
          where: { visitId: old.id },
          data: { active: false },
        });
        visit = await tx.visit.update({
          where: { id: old.id },
          data: {
            state: "RESCHEDULED",
            startAt,
            endAt,
            mode: c.mode,
            metadata: c.metadata,
            reason: c.reason,
            history: [
              ...(old.history as any[]),
              {
                startAt: old.startAt.toISOString(),
                endAt: old.endAt.toISOString(),
                reason: c.reason,
              },
            ],
          },
        });
      } else {
        ensure(
          !app.visits.some(
            (v) => !["CANCELLED", "COMPLETED"].includes(v.state),
          ),
          "Reschedule the existing visit",
        );
        visit = await tx.visit.create({
          data: {
            applicationId: id,
            mode: c.mode,
            startAt,
            endAt,
            metadata: c.metadata,
            reason: c.reason,
          },
        });
      }
      await tx.reservation.createMany({
        data: c.participants.map((userId) => ({
          visitId: visit.id,
          userId,
          startAt,
          endAt,
        })),
      });
      const updated = await tx.application.update({
        where: { id },
        data: { version: { increment: 1 } },
      });
      await audit(
        tx,
        a,
        updated,
        "schedule-evc",
        c.reason,
        app.state,
        "PUBLIC",
      );
      await notify(
        tx,
        updated,
        `${app.reference}: EVC scheduled`,
        `${visit.id}:${startAt.toISOString()}`,
      );
      return visit;
    },
    { timeout: 20000 },
  );
}
export async function visitCommand(
  a: Actor,
  id: string,
  operation: string,
  reason: string,
) {
  ensure(
    reason?.trim().length >= 5,
    "Reason/report must have at least five characters",
    400,
  );
  return db.$transaction(async (tx) => {
    const v = await tx.visit.findUnique({ where: { id } });
    ensure(v, "Visit unavailable", 404);
    await tx.$queryRaw`SELECT id FROM "Application" WHERE id=${v.applicationId} FOR UPDATE`;
    const app = await getApp(a, v.applicationId, tx);
    const participant = await tx.reservation.count({
      where: { visitId: id, userId: a.id, active: true },
    });
    if (operation === "confirm") {
      ensure(
        can(a, app, ["SUPERVISOR", "BUREAU"]),
        "Coordinator permission required",
        403,
      );
      ensure(
        ["PROPOSED", "RESCHEDULED"].includes(v.state),
        "Visit must be proposed",
      );
      await tx.visit.update({ where: { id }, data: { state: "CONFIRMED" } });
    } else if (operation === "report") {
      ensure(
        participant &&
          a.grants.some((g) => g.role === "COMMITTEE" && g.committee === "EVC"),
        "Assigned EVC participant required",
        403,
      );
      ensure(v.state === "CONFIRMED", "Confirm visit before reporting");
      ensure(v.endAt <= (await clock(tx)), "Visit has not ended");
      await tx.visit.update({
        where: { id },
        data: { state: "REPORT_PENDING", report: reason },
      });
    } else if (operation === "complete") {
      ensure(
        can(a, app, ["SUPERVISOR", "BUREAU"]),
        "Completion reviewer required",
        403,
      );
      ensure(v.state === "REPORT_PENDING" && v.report, "Report required");
      await tx.visit.update({ where: { id }, data: { state: "COMPLETED" } });
    } else ensure(false, "Unknown visit command", 400);
    const updated = await tx.application.update({
      where: { id: app.id },
      data: { version: { increment: 1 } },
    });
    await audit(
      tx,
      a,
      updated,
      `evc-${operation}`,
      reason,
      app.state,
      "PUBLIC",
    );
    await notify(
      tx,
      updated,
      `${app.reference}: EVC ${operation}`,
      `${id}:${operation}`,
    );
    return { ok: true };
  });
}
