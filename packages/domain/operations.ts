import { db } from "../db/index.ts";
import { actions, clock, runId, type Actor } from "./engine.ts";
import { scope, can, eligible, officialScope } from "./permissions.ts";
import { documentCompliance } from "./documents.ts";
import { deadlineSubjects } from "./deadlines.ts";
import { nextStep } from "./next-step.ts";
import { readable } from "../contracts/presentation.ts";

export function recordOrigin(data: unknown) {
  const origin = (data as any)?.provenance?.kind;
  return ["FICTIONAL_DEMO", "AUTHORIZED_PILOT"].includes(origin)
    ? origin
    : "UNCLASSIFIED";
}
import { urgency } from "../contracts/urgency.ts";
export async function operations(actor: Actor, where = {}) {
  const now = await clock();
  const run = await runId();
  const scoped = { AND: [scope(actor), { runId: run }, where] };
  const [records, users, subjects, official] = await Promise.all([
    db.application.findMany({
      where: scoped,
      include: {
        institution: { include: { region: true } },
        workflow: true,
        attempts: true,
        obligations: true,
        documents: {
          include: {
            versions: {
              orderBy: { number: "desc" },
              include: { reviews: true },
            },
          },
        },
        deficiencies: { include: { responses: true } },
        visits: { include: { reservations: true } },
        recommendations: { orderBy: { createdAt: "desc" } },
        decisions: true,
        snapshots: true,
      },
    }),
    db.user.findMany({ include: { grants: true } }),
    deadlineSubjects(scoped, now),
    db.application.findMany({
      where: { AND: [officialScope(actor), { runId: run }] },
      select: { id: true },
    }),
  ]);
  const officialIds = new Set(official.map((a) => a.id));
  const byUser = new Map(users.map((u) => [u.id, u]));
  const enriched = records.map((r) => ({
    ...r,
    institutionView: !officialIds.has(r.id),
    documents: r.documents.map((d) => ({
      ...d,
      compliance: documentCompliance(d.versions, now),
    })),
  }));
  const cases = await Promise.all(
    enriched.map(async (r) => {
      const owner = r.ownerId ? byUser.get(r.ownerId) : null;
      const validOwner = owner?.active && eligible(owner, r) ? owner : null;
      const next = await nextStep(r, {
        owner: validOwner ?? null,
        subjects: subjects.filter((s) => s.applicationId === r.id),
      });
      const current = r.attempts.find((t) => t.state === "OPEN");
      const ageDays = current
        ? Math.max(0, (+now - +current.startedAt) / 86400000)
        : null;
      const permitted = actions(actor, r);
      const deadlines = subjects.filter((s) => s.applicationId === r.id);
      const earliest = [...deadlines].sort((a, b) => +a.due - +b.due)[0];
      const currentRecommendations = r.recommendations.filter(
        (rec) => rec.attemptId === current?.id && rec.stage === r.state,
      );
      return {
        id: r.id,
        reference: r.reference,
        institution: r.institution,
        category: r.category,
        cycle: r.cycle,
        state: r.state,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        workflow: {
          id: r.workflowId,
          name: r.workflow.name,
          version: r.workflow.version,
          source: r.workflow.source,
        },
        recordOrigin: recordOrigin(r.data),
        ownerId: validOwner?.id ?? null,
        ownerName: validOwner?.name ?? null,
        ownerRole: next.role,
        ageDays,
        next,
        dueAt: earliest?.due ?? null,
        deadlineLabel: earliest?.label ?? null,
        urgency: urgency(earliest?.due ?? null, now),
        deadlines: deadlines.map((s) => ({
          type: s.type,
          id: s.id,
          label: s.label,
          due: s.due,
          status: s.status,
        })),
        allowedActions: permitted.allowedActions,
        blockers: permitted.blockingReasons,
        evidence: r.documents.map((d) => ({
          id: d.id,
          title: d.title,
          kind: d.kind,
          submittedVersion: d.compliance.submitted?.number ?? null,
          submittedId: d.compliance.submitted?.id ?? null,
          reviewState: d.compliance.submitted?.reviewState ?? "NOT_SUBMITTED",
          effectiveVersion: d.compliance.effective?.number ?? null,
          validity: d.compliance.status,
        })),
        recommendations: r.institutionView
          ? []
          : r.recommendations.map((rec) => ({
              ...rec,
              actorName: byUser.get(rec.actorId)?.name ?? "Recorded official",
            })),
        currentRecommendations: r.institutionView ? [] : currentRecommendations,
        attemptId: current?.id ?? null,
        visits: r.visits.map((v) => ({
          id: v.id,
          state: v.state,
          startAt: v.startAt,
          endAt: v.endAt,
          reportDueAt: v.reportDueAt,
          hasReport: !!v.report,
          participants: v.reservations
            .filter((p) => p.active)
            .map((p) => ({
              id: p.userId,
              name: byUser.get(p.userId)?.name ?? "Assigned member",
            })),
        })),
        decisionReady:
          r.state === "AUTHORITY" && !permitted.blockingReasons.length,
      };
    }),
  );
  return { now, run, cases, records: enriched, subjects, users, byUser };
}

export async function actionDesk(actor: Actor) {
  const data = await operations(actor);
  const tasks: any[] = [];
  const add = (
    r: (typeof data.records)[number],
    kind: string,
    id: string,
    title: string,
    reason: string,
    role: string,
    href: string,
    due: Date | null,
    created: Date | null = null,
    person: string | null = null,
  ) => {
    tasks.push({
      id: kind + ":" + id,
      kind,
      applicationId: r.id,
      reference: r.reference,
      institution: r.institution.name,
      title,
      reason,
      responsibleRole: role,
      responsiblePerson: person,
      href,
      dueAt: due,
      ageDays: created ? Math.max(0, (+data.now - +created) / 86400000) : null,
      urgency: urgency(due, data.now),
      recordOrigin: recordOrigin(r.data),
    });
  };
  for (const r of data.records) {
    const c = data.cases.find((c) => c.id === r.id)!;
    const path = "/applications/" + r.id;
    if (can(actor, r, ["INSTITUTION"])) {
      if (r.state === "DRAFT")
        add(
          r,
          "DRAFT",
          r.id,
          "Submit draft application",
          "Draft has not been explicitly submitted.",
          "Institution representative",
          path,
          null,
          r.createdAt,
        );
      for (const d of r.deficiencies.filter((d) => d.state === "OPEN"))
        add(
          r,
          "DEFICIENCY",
          d.id,
          "Respond: " + d.item,
          d.reason,
          "Institution representative",
          path + "?tab=deficiencies&deficiency=" + d.id,
          r.dueAt,
          d.createdAt,
        );
      for (const o of r.obligations.filter((o) =>
        ["OPEN", "RETURNED"].includes(o.state),
      ))
        add(
          r,
          "UNDERTAKING",
          o.id,
          "Submit condition evidence",
          o.condition,
          "Institution representative",
          "/compliance?selected=" + o.id,
          o.dueAt,
        );
      for (const d of r.documents.filter((d) =>
        ["EXPIRED", "EXPIRING"].includes(d.compliance.status),
      ))
        add(
          r,
          "RENEWAL",
          d.id,
          d.compliance.renewalPending
            ? "Follow up renewal review"
            : "Renew: " + d.title,
          d.compliance.renewalPending
            ? "Replacement awaits official verification; accepted expiry still applies."
            : "Accepted evidence requires renewal; a rejected replacement does not change expiry.",
          d.compliance.renewalPending
            ? "Authorized evidence reviewer"
            : "Institution representative",
          "/documents?selected=" + d.id,
          d.compliance.effective?.validUntil ?? null,
        );
    }
    if (can(actor, r, ["REVIEWER", "SUPERVISOR", "BUREAU"])) {
      for (const d of r.documents.filter(
        (d) => d.compliance.submitted?.reviewState === "PENDING",
      ))
        add(
          r,
          "EVIDENCE",
          d.id,
          "Review: " + d.title,
          "Latest submitted version requires an explicit review.",
          "Authorized evidence reviewer",
          "/documents?selected=" + d.id,
          c.dueAt,
          c.createdAt,
          c.ownerName,
        );
      if (c.allowedActions.includes("verify-response"))
        for (const d of r.deficiencies.filter((d) => d.state === "RESPONDED"))
          add(
            r,
            "RESPONSE",
            d.id,
            "Verify response: " + d.item,
            "Evidence-linked response is ready for targeted re-scrutiny.",
            "Assigned reviewer",
            path + "?tab=deficiencies&deficiency=" + d.id,
            r.dueAt,
            d.createdAt,
            c.ownerName,
          );
      if (["SCRUTINY", "RESCRUTINY"].includes(r.state) && !c.blockers.length)
        add(
          r,
          "STAGE",
          r.id,
          "Complete scrutiny",
          "Current evidence and deficiency checks are clear; explicit progression is still required.",
          "Assigned reviewer",
          path,
          r.dueAt,
          c.createdAt,
          c.ownerName,
        );
      for (const o of r.obligations.filter((o) => o.state === "SUBMITTED"))
        add(
          r,
          "COMPLIANCE_REVIEW",
          o.id,
          "Review submitted undertaking",
          o.condition,
          "Authorized evidence reviewer",
          "/compliance?selected=" + o.id,
          o.dueAt,
        );
    }
    if (can(actor, r, ["SUPERVISOR", "BUREAU"])) {
      if (
        !c.ownerId &&
        !["DRAFT", "APPROVED", "CONDITIONAL", "REJECTED"].includes(r.state)
      )
        add(
          r,
          "UNASSIGNED",
          r.id,
          "Assign eligible officer",
          "No active eligible owner is assigned.",
          "Scoped coordinator",
          path,
          r.dueAt,
          c.createdAt,
        );
      if (r.state === "EVC" && !r.visits.some((v) => v.state !== "CANCELLED"))
        add(
          r,
          "EVC_SCHEDULING",
          r.id,
          "Schedule expert visit",
          "EVC stage reached; no active appointment exists.",
          "Supervisor / bureau coordinator",
          "/evc?application=" + r.id,
          r.dueAt,
          c.createdAt,
        );
      for (const v of r.visits.filter(
        (v) => v.report && !["COMPLETED", "CANCELLED"].includes(v.state),
      ))
        add(
          r,
          "VISIT_REVIEW",
          v.id,
          "Review expert report",
          "A submitted report requires separate completion acceptance.",
          "Supervisor / bureau coordinator",
          "/evc?visit=" + v.id,
          v.reportDueAt,
        );
      for (const subject of c.deadlines.filter((s) => s.due < data.now))
        add(
          r,
          "EXCEPTION",
          subject.id,
          "Resolve overdue " + readable(subject.type),
          subject.label,
          "Scoped coordinator",
          subject.type === "VISIT"
            ? "/evc?visit=" + subject.id
            : subject.type === "OBLIGATION"
              ? "/compliance?selected=" + subject.id
              : path,
          subject.due,
        );
    }
    if (can(actor, r, ["COMMITTEE"])) {
      if (["EVC", "SAC", "SHC"].includes(r.state))
        add(
          r,
          "COMMITTEE",
          r.id,
          c.currentRecommendations.length
            ? "Complete committee stage"
            : c.blockers.length
              ? "Review committee blockers"
              : "Record committee recommendation",
          c.blockers.join(" ") ||
            "Review the current attempt; recommendation and completion are separate actions.",
          "Assigned " + r.state + " member",
          "/committees?selected=" + r.id,
          r.dueAt,
          c.createdAt,
          c.ownerName,
        );
    }
    for (const v of r.visits.filter(
      (v) =>
        v.reservations.some((p) => p.userId === actor.id && p.active) &&
        ["CONFIRMED", "REPORT_PENDING"].includes(v.state) &&
        !v.report,
    ))
      add(
        r,
        "VISIT_REPORT",
        v.id,
        +v.endAt <= +data.now
          ? "Submit visit report"
          : "Attend scheduled expert visit",
        "Assigned participant; report submission does not accept completion.",
        "Assigned EVC member",
        "/evc?visit=" + v.id,
        v.reportDueAt,
        null,
        actor.name,
      );
    if (r.state === "AUTHORITY" && can(actor, r, ["AUTHORITY"]))
      add(
        r,
        "DECISION",
        r.id,
        c.decisionReady
          ? "Review decision-ready packet"
          : "Review blocked authority case",
        c.blockers.join(" ") ||
          "Recommendations and reviewed evidence are available; a human decision and reason are required.",
        "Competent authority",
        path + "?packet=decision",
        r.dueAt,
        c.createdAt,
        c.ownerName,
      );
  }
  const allowedIds = data.cases.map((c) => c.id);
  const escalations = await db.escalation.findMany({
    where: { applicationId: { in: allowedIds }, state: "OPEN" },
  });
  for (const event of escalations) {
    const r = data.records.find((r) => r.id === event.applicationId)!;
    if (
      (Array.isArray(event.recipientIds) &&
        event.recipientIds.includes(actor.id)) ||
      can(actor, r, ["SUPERVISOR", "BUREAU"])
    )
      add(
        r,
        "ESCALATION",
        event.id,
        `Acknowledge level ${event.level} escalation`,
        `${event.subjectType}: ${event.subjectId}. Designated ${event.recipientRole} follow-up awaits acknowledgement.`,
        event.recipientRole,
        "/alerts?event=" + event.id,
        event.dueAt,
      );
  }
  tasks.sort(
    (a, b) =>
      a.urgency.rank - b.urgency.rank ||
      +new Date(a.dueAt ?? "9999-01-01") - +new Date(b.dueAt ?? "9999-01-01") ||
      (b.ageDays ?? -1) - (a.ageDays ?? -1) ||
      a.id.localeCompare(b.id),
  );
  const roles = [...new Set(actor.grants.map((g) => g.role))];
  const sections = [...new Set(tasks.map((t) => t.kind))].map((kind) => ({
    kind,
    count: tasks.filter((t) => t.kind === kind).length,
  }));
  return {
    now: data.now,
    roles,
    tasks,
    sections,
    totalTasks: tasks.length,
    distinctCases: new Set(tasks.map((t) => t.applicationId)).size,
    totalScopedCases: data.cases.length,
    overdueTasks: tasks.filter((t) => t.urgency.key === "OVERDUE").length,
    origins: data.cases.reduce<Record<string, number>>((m, c) => {
      m[c.recordOrigin] = (m[c.recordOrigin] ?? 0) + 1;
      return m;
    }, {}),
    backlog: Object.values(
      data.cases
        .filter(
          (c) =>
            !["DRAFT", "APPROVED", "REJECTED", "CONDITIONAL"].includes(c.state),
        )
        .reduce<
          Record<
            string,
            {
              regionId: string;
              region: string;
              stage: string;
              count: number;
              unknownAges: number;
              oldestKnownDays: number | null;
            }
          >
        >((m, c) => {
          const key = c.institution.regionId + ":" + c.state;
          const row = (m[key] ??= {
            regionId: c.institution.regionId,
            region: c.institution.region.name,
            stage: c.state,
            count: 0,
            unknownAges: 0,
            oldestKnownDays: null,
          });
          row.count++;
          if (c.ageDays === null) row.unknownAges++;
          else
            row.oldestKnownDays = Math.max(row.oldestKnownDays ?? 0, c.ageDays);
          return m;
        }, {}),
    ),
    workload: Object.values(
      data.cases
        .filter(
          (c) =>
            !["DRAFT", "APPROVED", "REJECTED", "CONDITIONAL"].includes(c.state),
        )
        .reduce<
          Record<
            string,
            { ownerId: string | null; ownerName: string; count: number }
          >
        >((m, c) => {
          const key = c.ownerId ?? "UNASSIGNED";
          const row = (m[key] ??= {
            ownerId: c.ownerId,
            ownerName: c.ownerName ?? "No eligible owner assigned",
            count: 0,
          });
          row.count++;
          return m;
        }, {}),
    ),
    priorityRule:
      "Overdue, due today (IST), due within seven calendar days, then other work; earlier recorded deadline, older known age and stable subject ID break ties. Missing ages remain not recorded.",
    countNote:
      "Tasks are individual follow-up subjects; a case may have several tasks. Public reference profiles are excluded from all operational counts.",
  };
}
