import { db } from "../db/index.ts";
import { audit, clock, getApp, notify, runId } from "./engine.ts";
import { transport } from "./mail.ts";
import { deadlineSubjects } from "./deadlines.ts";
import { resolveRecipients } from "./recipients.ts";
import { workflowSchema } from "../contracts/index.ts";
export async function scan() {
  const now = await clock();
  const currentRun = await runId();
  const subjects = await deadlineSubjects({ runId: currentRun }, now);
  const live = new Set(subjects.map((s) => `${s.type}:${s.id}:${s.revision}`));
  for (const subject of subjects) {
    const horizon = +now + subject.policy.reminderDays * 86400000;
    if (+subject.due > horizon) continue;
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id=${subject.applicationId} FOR UPDATE`;
      const current = (
        await deadlineSubjects({ id: subject.applicationId }, now, tx)
      ).find(
        (s) =>
          s.type === subject.type &&
          s.id === subject.id &&
          s.revision === subject.revision &&
          s.policyId === subject.policyId &&
          +s.due === +subject.due,
      );
      if (!current) return; // A scan snapshot must not recreate invalidated work after a concurrent lifecycle change.
      const app = await tx.application.findUniqueOrThrow({
        where: { id: subject.applicationId },
        include: { institution: true },
      });
      const identity = `policy:${subject.policyId}:${subject.type}:${subject.id}:${subject.revision}`;
      if (+now <= +subject.due)
        await notify(
          tx,
          app,
          `${app.reference}: UPCOMING · ${subject.label}`,
          `${identity}:UPCOMING`,
          subject.type,
          subject.id,
          subject.revision,
          subject.policy.recipients ?? ["INSTITUTION", "ASSIGNEE"],
          "DEADLINE",
        );
      else {
        await notify(
          tx,
          app,
          `${app.reference}: OVERDUE · ${subject.label}`,
          `${identity}:OVERDUE`,
          subject.type,
          subject.id,
          subject.revision,
          subject.policy.recipients ?? ["INSTITUTION", "ASSIGNEE"],
          "DEADLINE",
        );
        const levels = subject.policy.escalationLevels ?? [
          {
            afterDays: subject.policy.escalationDays ?? 0,
            role: "SUPERVISOR" as const,
          },
          {
            afterDays: (subject.policy.escalationDays ?? 0) + 7,
            role: "BUREAU" as const,
          },
        ];
        for (let i = 0; i < levels.length; i++) {
          const level = levels[i];
          if (+now < +subject.due + level.afterDays * 86400000) continue;
          const recipients = await resolveRecipients(tx, app, [level.role]);
          const key = `${currentRun}:${identity}:L${i + 1}`;
          const old = await tx.escalation.findUnique({
            where: { logicalKey: key },
          });
          let event = old;
          if (!old) {
            event = await tx.escalation.create({
              data: {
                applicationId: app.id,
                subjectType: subject.type,
                subjectId: subject.id,
                deadlineRevision: String(subject.revision),
                policyId: subject.policyId,
                level: i + 1,
                dueAt: subject.due,
                recipientIds: recipients.map((r) => r.id),
                recipientRole: level.role,
                state: recipients.length ? "OPEN" : "UNASSIGNED",
                logicalKey: key,
                reason: recipients.length
                  ? "Configured designated recipients"
                  : "No eligible designated official; coordinator action required",
              },
            });
            await audit(
              tx,
              null,
              app,
              "escalation-created",
              `Level ${i + 1} ${level.role}; subject ${identity}; recipients ${recipients.map((r) => r.id).join(",") || "UNASSIGNED"}`,
              app.state,
              "PUBLIC",
            );
          } else if (
            JSON.stringify(old.recipientIds) !==
            JSON.stringify(recipients.map((r) => r.id))
          ) {
            event = await tx.escalation.update({
              where: { id: old.id },
              data: {
                recipientIds: recipients.map((r) => r.id),
                state: recipients.length ? "OPEN" : "UNASSIGNED",
                reason: "Recipient eligibility changed",
              },
            });
            await audit(
              tx,
              null,
              app,
              "escalation-rerouted",
              `Level ${i + 1}: recipient eligibility changed`,
              app.state,
              "PUBLIC",
            );
          }
          await notify(
            tx,
            app,
            `${app.reference}: ESCALATION L${i + 1} · ${subject.label}`,
            `${identity}:L${i + 1}`,
            subject.type,
            subject.id,
            subject.revision,
            [level.role],
            "DEADLINE",
          );
        }
      }
    });
  }
  const events = await db.escalation.findMany({
    where: { state: { in: ["OPEN", "UNASSIGNED", "ACKNOWLEDGED"] } },
  });
  for (const event of events) {
    const app = await db.application.findUnique({
      where: { id: event.applicationId },
    });
    if (
      app?.runId !== currentRun ||
      app.workflowId !== event.policyId ||
      !live.has(
        `${event.subjectType}:${event.subjectId}:${event.deadlineRevision}`,
      )
    ) {
      await db.$transaction(async (tx) => {
        await tx.escalation.update({
          where: { id: event.id },
          data: {
            state: "RESOLVED",
            resolvedAt: now,
            reason:
              "Deadline subject resolved, revised, superseded or run replaced",
          },
        });
        if (app)
          await audit(
            tx,
            null,
            app,
            "escalation-resolved",
            `Subject ${event.subjectType}:${event.subjectId} revision ${event.deadlineRevision}`,
            app.state,
            "PUBLIC",
          );
      });
    }
  }
}
export async function deliver(id: string, generation = 1) {
  return db
    .$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Outbox" WHERE id=${id} FOR UPDATE`;
        const o = await tx.outbox.findUniqueOrThrow({ where: { id } });
        if (o.state === "FAILED" && o.nextAt > new Date()) return;
        if (o.generation !== generation) return;
        if (
          [
            "ATTEMPTED",
            "SMTP_ACCEPTED",
            "SUPERSEDED",
            "EXHAUSTED",
            "AMBIGUOUS",
          ].includes(o.state)
        )
          return;
        const user = await tx.user.findUnique({
          where: { id: o.recipientId },
          include: { grants: true },
        });
        let valid = !!user && o.runId === (await runId(tx));
        let deadline: Date | null = null;
        let app;
        try {
          if (user) app = await getApp(user, o.applicationId, tx);
        } catch {
          valid = false;
        }
        if (o.eventKind === "DEADLINE" && app) {
          const subjects = await deadlineSubjects(
            { id: app.id },
            await clock(tx),
            tx,
          );
          const subject = subjects.find(
            (s) =>
              s.type === o.subjectType &&
              s.id === o.subjectId &&
              s.revision === o.revision,
          );
          valid = valid && !!subject;
          if (subject)
            valid =
              valid && o.logicalKey.includes(`policy:${subject.policyId}:`);
          if (subject) {
            const now = await clock(tx);
            const kind = o.logicalKey.includes(":UPCOMING:")
              ? "UPCOMING"
              : (o.logicalKey.match(/:L(\d+):/)?.[1] ?? "OVERDUE");
            valid =
              valid &&
              +subject.due <= +now + subject.policy.reminderDays * 86400000;
            if (kind === "UPCOMING") valid = valid && +now <= +subject.due;
            else {
              valid = valid && +now > +subject.due;
              if (/^\d+$/.test(kind)) {
                const levels = subject.policy.escalationLevels ?? [
                  {
                    afterDays: subject.policy.escalationDays ?? 0,
                    role: "SUPERVISOR",
                  },
                  {
                    afterDays: (subject.policy.escalationDays ?? 0) + 7,
                    role: "BUREAU",
                  },
                ];
                valid =
                  valid &&
                  !!levels[Number(kind) - 1] &&
                  +now >=
                    +subject.due +
                      levels[Number(kind) - 1].afterDays * 86400000;
              }
            }
            if (o.recipientRole)
              valid =
                valid &&
                (await resolveRecipients(tx, app, [o.recipientRole])).some(
                  (r) => r.id === user?.id,
                );
          }
        } else if (o.subjectType === "APPLICATION")
          valid = valid && app?.version === o.revision;
        else if (o.subjectType === "OBLIGATION") {
          const item = await tx.obligation.findUnique({
            where: { id: o.subjectId },
          });
          valid =
            valid &&
            item?.revision === o.revision &&
            !["ACCEPTED", "WAIVED"].includes(item?.state ?? "");
        } else if (o.subjectType === "DOCUMENT") {
          const item = app?.documents.find((d) =>
            d.versions.some((v) => v.id === o.subjectId),
          );
          valid =
            valid &&
            item?.versions.find((v) => v.reviewState === "ACCEPTED")?.id ===
              o.subjectId;
        }
        if (!valid) {
          await tx.outbox.update({
            where: { id },
            data: { state: "SUPERSEDED" },
          });
          return;
        }
        await tx.notification.upsert({
          where: { logicalKey: o.logicalKey },
          create: {
            userId: user!.id,
            applicationId: o.applicationId,
            logicalKey: o.logicalKey,
            title: o.title,
          },
          update: {},
        });
        // The attempted marker commits before SMTP in a separate transaction below.
        await tx.outbox.update({
          where: { id },
          data: {
            state: "ATTEMPTED",
            attempts: { increment: 1 },
            generationAttempts: { increment: 1 },
          },
        });
        await tx.deliveryAttempt.create({
          data: {
            outboxId: id,
            generation,
            state: "ATTEMPTED",
            detail:
              "Local SMTP attempt started; acceptance after crash may be ambiguous",
          },
        });
        return {
          to: user!.email,
          title: o.title,
          attempt: o.generationAttempts + 1,
        };
      },
      { timeout: 20000 },
    )
    .then(async (payload) => {
      if (!payload) return;
      let smtpAccepted = false;
      try {
        const r = await transport().sendMail({
          from: "Anumitra <noreply@anumitra.test>",
          to: payload.to,
          subject: payload.title,
          text: `${payload.title}\nIndependent student prototype. Open the local Anumitra inbox for authorized details.`,
          messageId: `<${id}.g${generation}@anumitra.test>`,
        });
        smtpAccepted = true;
        await db.$transaction(async (tx) => {
          await tx.outbox.update({
            where: { id },
            data: { state: "SMTP_ACCEPTED" },
          });
          await tx.deliveryAttempt.create({
            data: {
              outboxId: id,
              generation,
              state: "SMTP_ACCEPTED",
              detail: `Captured by local Mailpit: ${r.messageId}`,
            },
          });
          const o = await tx.outbox.findUniqueOrThrow({
            where: { id },
            include: { application: true },
          });
          await audit(
            tx,
            null,
            o.application,
            "notification-smtp-accepted",
            "Accepted by local SMTP sink",
          );
        });
      } catch (e) {
        const exhausted = payload.attempt >= 4;
        await db.$transaction([
          db.outbox.update({
            where: { id },
            data: {
              state: smtpAccepted
                ? "AMBIGUOUS"
                : exhausted
                  ? "EXHAUSTED"
                  : "FAILED",
              nextAt: new Date(
                Date.now() + Math.pow(2, payload.attempt) * 1000,
              ),
            },
          }),
          db.deliveryAttempt.create({
            data: {
              outboxId: id,
              generation,
              state: smtpAccepted
                ? "AMBIGUOUS"
                : exhausted
                  ? "EXHAUSTED"
                  : "FAILED",
              detail: String(e).slice(0, 500),
            },
          }),
        ]);
      }
    });
}
