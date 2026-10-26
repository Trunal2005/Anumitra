import { z } from "zod";
import { db } from "../db/index.ts";
import { audit, ensure, hash } from "./engine.ts";
import { grantMatches, type Actor } from "./permissions.ts";

export const masterSourceSchema = z
  .object({
    classification: z.enum(["FICTIONAL_SIMULATION", "UNVERIFIED_LOCAL"]),
    sourceId: z.string().trim().min(3).max(100),
    sourceVersion: z.string().trim().min(1).max(100),
    retrievedAt: z.iso.datetime(),
  })
  .strict();
const recordsSchema = z
  .array(
    z
      .object({
        id: z
          .string()
          .trim()
          .regex(/^[A-Za-z0-9][A-Za-z0-9_.-]{1,99}$/),
        name: z.string().trim().min(3).max(200),
        regionId: z.string().trim().min(1).max(100),
      })
      .strict(),
  )
  .min(1)
  .max(200);
export type MasterSource = z.infer<typeof masterSourceSchema>;
export const simulatorRecords = [
  {
    id: "SIM-INSTITUTE-001",
    name: "Fictional Simulator Institute North",
    regionId: "R1",
  },
  {
    id: "SIM-INSTITUTE-002",
    name: "Fictional Simulator Institute South",
    regionId: "R2",
  },
];
export const simulatorSource: MasterSource = {
  classification: "FICTIONAL_SIMULATION",
  sourceId: "anumitra-local-contract-simulator",
  sourceVersion: "1",
  retrievedAt: "2026-10-26T00:00:00.000Z",
};
export async function importInstitutions(
  actor: Actor,
  input: {
    records: unknown;
    source?: MasterSource;
    preview: boolean;
    reviewId?: string;
  },
) {
  const records = recordsSchema.parse(input.records);
  ensure(
    new Set(records.map((r) => r.id)).size === records.length,
    "Duplicate institution IDs in batch",
    400,
  );
  const source = input.source ?? {
    classification: "UNVERIFIED_LOCAL" as const,
    sourceId: "manual-local-file",
    sourceVersion: "unspecified",
    retrievedAt: new Date().toISOString(),
  };
  const payloadHash = hash({ records, source: input.source ?? null });
  const contentChecksum = hash(records);
  ensure(
    actor.active &&
      actor.grants.some((g) => ["ADMIN", "BUREAU"].includes(g.role)),
    "Master-data import permission required",
    403,
  );
  for (const r of records)
    ensure(
      actor.grants.some(
        (g) =>
          ((g.role === "ADMIN" && g.global) || g.role === "BUREAU") &&
          grantMatches(g, {
            institutionId: r.id,
            institution: { regionId: r.regionId },
            bureau: "APPROVAL",
          }),
      ),
      "Institution master exceeds explicit grant scope",
      403,
    );
  // One lock and transaction cover the entire reviewed batch, including master and provenance writes.
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext('anumitra-institution-master-import'))`;
    const regions = await tx.region.findMany({ select: { id: true } });
    for (const r of records)
      ensure(
        regions.some((v) => v.id === r.regionId),
        "Unknown region",
        400,
      );
    const existing = await tx.institution.findMany({
      where: { id: { in: records.map((r) => r.id) } },
      orderBy: { id: "asc" },
    });
    const snapshotHash = hash(existing);
    const results = records.map((r) => {
      const old = existing.find((v) => v.id === r.id);
      return {
        externalId: r.id,
        state: old
          ? old.name === r.name && old.regionId === r.regionId
            ? "UNCHANGED"
            : "CONFLICT_REVIEW_REQUIRED"
          : input.preview
            ? "VALID_MASTER"
            : "IMPORTED_MASTER",
      };
    });
    const provenance = {
      ...source,
      contentChecksum,
      identifierNamespace: source.sourceId,
      realApprovalData: false,
      updateStatus: "CREATE_ONLY_MANUAL_REVIEW",
      retirementPolicy:
        "No deletions or inferred retirement from missing records",
    };
    if (input.preview) {
      const review = await tx.syncRun.create({
        data: {
          actorId: actor.id,
          preview: true,
          result: {
            entity: "institutions",
            payloadHash,
            snapshotHash,
            scopeHash: hash(actor.grants),
            provenance,
            results,
          },
        },
      });
      return {
        mode: "LOCAL_ADAPTER",
        entity: "institutions",
        preview: true,
        reviewId: review.id,
        provenance,
        results,
      };
    }
    ensure(
      input.reviewId,
      "Preview and explicitly review this institution batch before importing",
      409,
    );
    const review = await tx.syncRun.findUnique({
      where: { id: input.reviewId },
    });
    ensure(
      review?.actorId === actor.id &&
        review.preview &&
        review.mode === "LOCAL_ADAPTER",
      "Import review unavailable to this actor",
      403,
    );
    const plan = review.result as Record<string, unknown>;
    ensure(
      plan.entity === "institutions" &&
        plan.payloadHash === payloadHash &&
        plan.scopeHash === hash(actor.grants),
      "Import input or grants changed; preview again",
      409,
    );
    const previous = await tx.syncRun.findFirst({
      where: {
        actorId: actor.id,
        preview: false,
        result: { path: ["reviewId"], equals: review.id },
      },
    });
    if (previous)
      return {
        mode: "LOCAL_ADAPTER",
        entity: "institutions",
        preview: false,
        reviewId: review.id,
        provenance: (previous.result as Record<string, unknown>).provenance,
        results: records.map((r) => ({ externalId: r.id, state: "UNCHANGED" })),
      };
    ensure(
      plan.snapshotHash === snapshotHash,
      "Master records changed after preview; review again",
      409,
    );
    ensure(
      !results.some((r) => r.state === "CONFLICT_REVIEW_REQUIRED"),
      "Existing or changed masters need separate manual reconciliation; nothing imported",
      409,
    );
    for (const r of records)
      if (!existing.some((v) => v.id === r.id)) {
        await tx.institution.create({ data: r });
        await audit(
          tx,
          actor,
          null,
          "local-institution-import",
          `Reviewed local master ${r.id}; ${source.classification}; source ${source.sourceId}`,
          undefined,
          "INTERNAL",
          { externalId: r.id, provenance, reviewId: review.id },
        );
      }
    await tx.syncRun.create({
      data: {
        actorId: actor.id,
        preview: false,
        result: {
          entity: "institutions",
          reviewId: review.id,
          payloadHash,
          provenance,
          results,
        },
      },
    });
    return {
      mode: "LOCAL_ADAPTER",
      entity: "institutions",
      preview: false,
      reviewId: review.id,
      provenance,
      results,
    };
  });
}
