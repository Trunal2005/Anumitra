import { z } from "zod";
import { db } from "../db/index.ts";
import { type Actor, audit, can, ensure, getApp, hash } from "./engine.ts";

const recordsSchema = z
  .array(
    z
      .object({
        externalId: z.string().trim().min(1).max(100),
        applicationId: z.string().min(1),
        kind: z.enum(["LEASE", "AFFIDAVIT", "COMPLIANCE", "OTHER"]),
        title: z.string().trim().min(3).max(200),
      })
      .strict(),
  )
  .min(1)
  .max(200);

export async function importDocumentMetadata(
  actor: Actor,
  input: unknown,
  preview: boolean,
) {
  const records = recordsSchema.parse(input);
  ensure(
    new Set(records.map((r) => r.externalId)).size === records.length,
    "Duplicate external metadata IDs in one batch",
    400,
  );
  return db.$transaction(
    async (tx) => {
      // Hold the actor identity against concurrent credential/grant invalidation.
      // This precedes case locks, matching user-management lock order.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${actor.id} FOR SHARE`;
      // One lock order for every batch. Case state and permissions are checked only
      // after the case locks; mappings are compared only after external-ID locks.
      for (const id of [...new Set(records.map((r) => r.applicationId))].sort())
        await tx.$queryRaw`SELECT id FROM "Application" WHERE id=${id} FOR UPDATE`;
      for (const id of records.map((r) => r.externalId).sort())
        await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`metadata:${id}`}))`;
      const currentActor = await tx.user.findUnique({
        where: { id: actor.id },
        include: { grants: true },
      });
      ensure(
        currentActor?.active &&
          currentActor.securityVersion === actor.securityVersion,
        "Permissions changed; sign in again before importing",
        403,
      );
      const cases = new Map();
      for (const id of [...new Set(records.map((r) => r.applicationId))]) {
        const record = await getApp(currentActor!, id, tx);
        ensure(
          can(currentActor!, record, ["INSTITUTION", "BUREAU"]),
          "Document metadata import permission required",
          403,
        );
        ensure(
          ["DRAFT", "AWAITING_RESPONSE"].includes(record.state),
          "Metadata imports cannot rewrite reviewed or decided evidence",
        );
        cases.set(id, record);
      }
      const results = [];
      for (const row of records) {
        const existing = await tx.externalMapping.findUnique({
          where: {
            source_externalId: {
              source: "LOCAL_DOCUMENT_METADATA",
              externalId: row.externalId,
            },
          },
        });
        ensure(
          !existing || existing.payloadHash === hash(row),
          "External metadata ID changed",
        );
        if (!preview && !existing) {
          const document = await tx.document.create({
            data: {
              applicationId: row.applicationId,
              title: row.title,
              kind: row.kind,
            },
          });
          await tx.externalMapping.create({
            data: {
              source: "LOCAL_DOCUMENT_METADATA",
              externalId: row.externalId,
              applicationId: row.applicationId,
              payloadHash: hash(row),
            },
          });
          const record = cases.get(row.applicationId);
          await audit(
            tx,
            currentActor!,
            record,
            "local-document-metadata-import",
            `Pending document ${document.id}; private bytes still required`,
            record.state,
            "PUBLIC",
          );
        }
        results.push({
          externalId: row.externalId,
          state: existing
            ? "UNCHANGED"
            : preview
              ? "VALID_METADATA"
              : "IMPORTED_PENDING_BYTES",
        });
      }
      await tx.syncRun.create({
        data: { actorId: actor.id, preview, result: results },
      });
      return {
        mode: "LOCAL_ADAPTER",
        entity: "documentMetadata",
        preview,
        results,
      };
    },
    { timeout: 20000 },
  );
}
