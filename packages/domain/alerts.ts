import { db } from "../db/index.ts";
import { audit, clock, getApp, notify, runId } from "./engine.ts";
import { transport } from "./mail.ts";
import { workflowSchema } from "../contracts/index.ts";
export async function scan() {
  const now = await clock();
  const apps = await db.application.findMany({
    where: { runId: await runId() },
    include: {
      workflow: true,
      obligations: true,
      documents: {
        include: { versions: { orderBy: { number: "desc" }, take: 1 } },
      },
      visits: true,
    },
  });
  for (const app of apps) {
    const config = workflowSchema.parse(app.workflow.config);
    const horizon = +now + config.reminderDays * 86400000;
    const subjects = [
      ...(!["DRAFT", "APPROVED", "REJECTED", "CONDITIONAL"].includes(
        app.state,
      ) && app.dueAt
        ? [
            {
              type: "APPLICATION",
              id: app.id,
              revision: app.version,
              due: app.dueAt,
              label:
                app.state === "EVC"
                  ? "EVC scheduling/report"
                  : "Application task",
            },
          ]
        : []),
      ...app.obligations
        .filter((o) => !["ACCEPTED", "WAIVED"].includes(o.state))
        .map((o) => ({
          type: "OBLIGATION",
          id: o.id,
          revision: o.revision,
          due: o.dueAt,
          label: "Undertaking compliance",
        })),
      ...app.documents.flatMap((d) =>
        d.versions[0]?.validUntil
          ? [
              {
                type: "DOCUMENT",
                id: d.versions[0].id,
                revision: d.versions[0].number,
                due: d.versions[0].validUntil!,
                label: "Document renewal",
              },
            ]
          : [],
      ),
      ...app.visits
        .filter((v) => !["COMPLETED", "CANCELLED"].includes(v.state))
        .map((v) => ({
          type: "VISIT",
          id: v.id,
          revision: +v.startAt,
          due: v.state === "REPORT_PENDING" ? v.endAt : v.startAt,
          label: "EVC appointment",
        })),
    ];
    for (const s of subjects) {
      if (+s.due > horizon) continue;
      if (
        +s.due < +now &&
        +now < +s.due + (config.escalationDays ?? 0) * 86400000
      )
        continue;
      const level = +s.due < +now ? "OVERDUE_ESCALATION" : "UPCOMING";
      await db.$transaction(async (tx) => {
        const key = `${s.type}:${s.id}:${s.revision}:${level}`;
        await notify(
          tx,
          app,
          `${app.reference}: ${level} • ${s.label}`,
          key,
          s.type,
          s.id,
          s.type === "VISIT" ? 0 : s.revision,
        );
      });
    }
  }
}
export async function deliver(id: string) {
  return db
    .$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Outbox" WHERE id=${id} FOR UPDATE`;
        const o = await tx.outbox.findUniqueOrThrow({ where: { id } });
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
        if (o.subjectType === "APPLICATION")
          valid = valid && app?.version === o.revision;
        if (o.subjectType === "APPLICATION") deadline = app?.dueAt ?? null;
        if (o.subjectType === "OBLIGATION") {
          const s = await tx.obligation.findUnique({
            where: { id: o.subjectId },
          });
          valid =
            valid &&
            s?.revision === o.revision &&
            !["ACCEPTED", "WAIVED"].includes(s?.state ?? "");
          deadline = s?.dueAt ?? null;
        }
        if (o.subjectType === "DOCUMENT") {
          const s = await tx.documentVersion.findUnique({
            where: { id: o.subjectId },
            include: {
              document: {
                include: { versions: { orderBy: { number: "desc" }, take: 1 } },
              },
            },
          });
          valid = valid && s?.document.versions[0]?.id === s?.id;
          deadline = s?.validUntil ?? null;
        }
        if (o.subjectType === "VISIT") {
          const v = await tx.visit.findUnique({ where: { id: o.subjectId } });
          valid =
            valid &&
            !!v &&
            !["CANCELLED", "COMPLETED"].includes(v.state) &&
            o.logicalKey.includes(String(+v.startAt));
          deadline = v
            ? v.state === "REPORT_PENDING"
              ? v.endAt
              : v.startAt
            : null;
        }
        if (app && /UPCOMING|OVERDUE_ESCALATION/.test(o.title)) {
          const config = workflowSchema.parse(app.workflow.config);
          const now = await clock(tx);
          if (!deadline) valid = false;
          else if (o.title.includes("OVERDUE_ESCALATION"))
            valid =
              valid &&
              +now >= +deadline + (config.escalationDays ?? 0) * 86400000;
          else
            valid =
              valid &&
              +deadline >= +now &&
              +deadline <= +now + config.reminderDays * 86400000;
          if (o.subjectType === "APPLICATION")
            valid =
              valid &&
              !["DRAFT", "APPROVED", "CONDITIONAL", "REJECTED"].includes(
                app.state,
              );
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
          data: { state: "ATTEMPTED", attempts: { increment: 1 } },
        });
        await tx.deliveryAttempt.create({
          data: {
            outboxId: id,
            state: "ATTEMPTED",
            detail:
              "Local SMTP attempt started; acceptance after crash may be ambiguous",
          },
        });
        return { to: user!.email, title: o.title, attempt: o.attempts + 1 };
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
          messageId: `<${id}@anumitra.test>`,
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
