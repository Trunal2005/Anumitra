import { db } from "../db/index.ts";
import { workflowSchema } from "../contracts/index.ts";
import { type Actor, audit, ensure, hash, hasRole } from "./engine.ts";
export async function ruleOperation(
  a: Actor,
  id: string,
  operation: string,
  input: any,
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Workflow" WHERE id=${id} FOR UPDATE`;
    const rule = await tx.workflow.findUniqueOrThrow({ where: { id } });
    const stored = workflowSchema.parse(rule.config);
    const proposed = workflowSchema.parse(input.config ?? stored);
    const contentHash = hash(stored);
    if (operation === "simulate")
      return {
        valid: true,
        route: ["DRAFT", ...proposed.stages],
        deadlineDays: proposed.deadlineDays,
        windows: proposed.windows ?? {},
        comparison: { previous: stored, proposed },
        revision: rule.revision,
        savedHash: contentHash,
        proposedHash: hash(proposed),
        authority:
          "Fixed explicit role grants govern all actions; negative recommendations require a separate human authority decision.",
      };
    if (operation === "save")
      ensure(
        hasRole(a, "ADMIN", "BUREAU") && rule.state === "DRAFT",
        "Only editable drafts may change",
        403,
      );
    else
      ensure(
        a.grants.some((g) => g.role === "BUREAU" && g.global),
        "An explicit global bureau grant is required to publish or retire global policy",
        403,
      );
    ensure(
      ["save", "publish", "retire"].includes(operation),
      "Unknown lifecycle command",
      400,
    );
    ensure(
      operation === "retire"
        ? rule.state === "PUBLISHED"
        : rule.state === "DRAFT",
      "Invalid rule lifecycle",
    );
    ensure(
      Number.isInteger(input.expectedRevision) &&
        input.expectedRevision === rule.revision,
      "Policy draft changed; simulate the current saved revision",
    );
    if (operation !== "save") {
      ensure(
        input.expectedHash === contentHash,
        "Publish/retire must match the reviewed saved configuration hash",
      );
      ensure(
        hash(proposed) === contentHash,
        "Save the proposed configuration before publishing; unsaved content cannot be published",
      );
    }
    const updated = await tx.workflow.update({
      where: { id },
      data:
        operation === "save"
          ? { config: proposed, revision: { increment: 1 } }
          : {
              state: operation === "publish" ? "PUBLISHED" : "RETIRED",
              publishedHash: contentHash,
              revision: { increment: 1 },
            },
    });
    await audit(
      tx,
      a,
      null,
      `rule-${operation}`,
      `${id} revision ${updated.revision}; saved SHA256 ${hash(workflowSchema.parse(updated.config))}; ${input.reason ?? "Explicit policy lifecycle operation"}; existing cases pinned`,
    );
    return {
      ...updated,
      contentHash: hash(workflowSchema.parse(updated.config)),
    };
  });
}
