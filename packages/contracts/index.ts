import { z } from "zod";
export const stages = ["SCRUTINY", "EVC", "SAC", "SHC", "AUTHORITY"] as const;
export const workflowSchema = z
  .object({
    stages: z.array(z.enum(stages)).min(1).max(8),
    deadlineDays: z.number().int().min(1).max(365),
    reminderDays: z.number().int().min(0).max(30),
    label: z.string().min(3).max(150),
    applicability: z
      .array(z.enum(["NEW_INSTITUTION", "EXTENSION", "CHANGE"]))
      .min(1)
      .optional(),
    requiredEvidence: z
      .array(z.enum(["LEASE", "AFFIDAVIT", "COMPLIANCE", "OTHER"]))
      .optional(),
    escalationDays: z.number().int().min(0).max(365).optional(),
    calendar: z.literal("CALENDAR_DAYS").optional(),
    timezone: z.literal("Asia/Kolkata").optional(),
  })
  .strict()
  .superRefine((c, ctx) => {
    if (
      c.stages.at(-1) !== "AUTHORITY" ||
      c.stages.filter((s) => s === "AUTHORITY").length !== 1
    )
      ctx.addIssue({
        code: "custom",
        message: "Exactly one AUTHORITY stage must end the route",
      });
    if (new Set(c.stages).size !== c.stages.length)
      ctx.addIssue({
        code: "custom",
        message: "Cycles and duplicate stages are not allowed",
      });
  });
export type WorkflowConfig = z.infer<typeof workflowSchema>;
export const commandSchema = z
  .object({
    command: z.enum([
      "submit",
      "assign",
      "raise-deficiency",
      "submit-response",
      "verify-response",
      "review-document",
      "complete-stage",
      "return-with-reason",
      "record-recommendation",
      "record-authorized-decision",
    ]),
    expectedVersion: z.number().int().positive(),
    reason: z.string().max(4000).default(""),
    item: z.string().max(100).optional(),
    deficiencyId: z.string().optional(),
    documentVersionId: z.string().optional(),
    ownerId: z.string().optional(),
    outcome: z
      .enum(["ACCEPTED", "REJECTED", "APPROVED", "CONDITIONAL"])
      .optional(),
    condition: z.string().max(2000).optional(),
    dueAt: z.iso.datetime().optional(),
  })
  .strict();
export const draftSchema = z
  .object({
    institutionId: z.string(),
    workflowId: z.string(),
    category: z.enum(["NEW_INSTITUTION", "EXTENSION", "CHANGE"]),
    cycle: z.string().regex(/^\d{4}-\d{2}$/),
    data: z.object({
      contact: z.string().email(),
      programme: z.string().min(3),
      intake: z.number().int().min(1).max(2000),
    }),
  })
  .strict();
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});
