import { z } from "zod";
import { workflowSchema } from "./index.ts";

// Shared with the real command action packet; a simulation cannot bypass guards.
export function reviewBlockers(input: {
  state: string;
  documents: { versions: { reviewState: string }[] }[];
  deficiencies: { state: string }[];
  visits: { state: string }[];
}) {
  const blockers: string[] = [];
  if (!input.documents.some((d) => d.versions.length))
    blockers.push("Submission needs at least one private evidence document.");
  if (input.deficiencies.some((d) => d.state !== "ACCEPTED"))
    blockers.push(
      "Open deficiencies need evidence responses and verification.",
    );
  if (input.documents.some((d) => d.versions[0]?.reviewState !== "ACCEPTED"))
    blockers.push("Current evidence versions require official verification.");
  if (
    input.state === "EVC" &&
    !input.visits.some((v) => v.state === "COMPLETED")
  )
    blockers.push("EVC requires a completed visit and reviewed report.");
  return blockers;
}
export const scenarioSchema = z
  .object({
    category: z
      .enum(["NEW_INSTITUTION", "EXTENSION", "CHANGE"])
      .default("NEW_INSTITUTION"),
    evidence: z
      .array(
        z
          .object({
            kind: z.enum(["LEASE", "AFFIDAVIT", "COMPLIANCE", "OTHER"]),
            reviewState: z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
          })
          .strict(),
      )
      .max(20)
      .default([]),
    openDeficiencies: z.number().int().min(0).max(20).default(0),
    completedVisit: z.boolean().default(false),
    recommendationRecorded: z.boolean().default(false),
  })
  .strict();
export function simulateWorkflow(config: unknown, input: unknown, now: Date) {
  const policy = workflowSchema.parse(config);
  const scenario = scenarioSchema.parse(input ?? {});
  const submission: string[] = [];
  if (policy.applicability && !policy.applicability.includes(scenario.category))
    submission.push("Policy is not applicable to this category.");
  if (!scenario.evidence.length)
    submission.push("Submission needs at least one private evidence document.");
  for (const kind of policy.requiredEvidence ?? [])
    if (!scenario.evidence.some((e) => e.kind === kind))
      submission.push(`Required evidence type missing: ${kind}.`);
  const steps = policy.stages.map((stage) => {
    const blockers = reviewBlockers({
      state: stage,
      documents: scenario.evidence.map((e) => ({ versions: [e] })),
      deficiencies: Array.from({ length: scenario.openDeficiencies }, () => ({
        state: "OPEN",
      })),
      visits: scenario.completedVisit ? [{ state: "COMPLETED" }] : [],
    });
    if (
      ["EVC", "SAC", "SHC"].includes(stage) &&
      !scenario.recommendationRecorded
    )
      blockers.push("Record a separate current-attempt recommendation first.");
    const window =
      policy.windows?.[stage === "EVC" ? "EVC_SCHEDULING" : stage] ??
      policy.deadlineDays;
    return {
      stage,
      windowDays: window,
      illustrativeDue: new Date(+now + window * 86400000).toISOString(),
      blockers,
      state: blockers.length ? "BLOCKED" : "HUMAN_ACTION_REQUIRED",
    };
  });
  return {
    scenario,
    submissionBlockers: submission,
    steps,
    clock: now,
    mutatesRecords: false,
    explanation:
      "Each stage is evaluated against the supplied scenario using the actual constrained policy and shared evidence guards. Dates illustrate one stage window from this clock, not completed transitions or an official schedule. A competent human still decides.",
  };
}
