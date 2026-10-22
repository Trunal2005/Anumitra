import { z } from "zod";
import { db } from "../db/index.ts";
import { type Actor, validGrant, mayDelegate } from "./permissions.ts";
import { ensure, audit } from "./engine.ts";
export const grantSchema = z
  .object({
    userId: z.string(),
    role: z.enum([
      "INSTITUTION",
      "REVIEWER",
      "SUPERVISOR",
      "BUREAU",
      "COMMITTEE",
      "AUTHORITY",
      "AUDITOR",
      "ADMIN",
    ]),
    institutionId: z.string().optional(),
    regionId: z.string().optional(),
    bureau: z.enum(["APPROVAL"]).optional(),
    committee: z.enum(["EVC", "SAC", "SHC"]).optional(),
    global: z.boolean().default(false),
    canDelegateGlobal: z.boolean().default(false),
  })
  .strict();
export async function grantRole(actor: Actor, input: unknown) {
  const c = grantSchema.parse(input);
  ensure(c.userId !== actor.id, "Self-granting is disabled", 403);
  ensure(
    validGrant({ ...c } as any),
    "Invalid role/scope shape: specify bounded scope or explicit global; institution and committee roles need their references",
    400,
  );
  ensure(
    !c.global || (!c.institutionId && !c.regionId && !c.bureau),
    "Global cannot be combined with bounded dimensions",
    400,
  );
  ensure(
    !c.canDelegateGlobal || (c.role === "BUREAU" && c.global),
    "Global delegation permission requires an explicit global bureau grant",
    400,
  );
  ensure(
    mayDelegate(actor, {
      ...c,
      institutionId: c.institutionId ?? null,
      regionId: c.regionId ?? null,
      bureau: c.bureau ?? null,
      committee: c.committee ?? null,
    }),
    "Delegation exceeds your explicit grant boundary",
    403,
  );
  await db.$transaction(async (tx) => {
    ensure(
      await tx.user.count({ where: { id: c.userId, active: true } }),
      "Unknown active user",
      400,
    );
    if (c.regionId)
      ensure(
        await tx.region.count({ where: { id: c.regionId } }),
        "Unknown region",
        400,
      );
    if (c.institutionId) {
      const i = await tx.institution.findUnique({
        where: { id: c.institutionId },
      });
      ensure(i, "Unknown institution", 400);
      ensure(
        !c.regionId || i.regionId === c.regionId,
        "Institution and region scopes conflict",
        400,
      );
    }
    await tx.grant.create({ data: c });
    await tx.user.update({
      where: { id: c.userId },
      data: { securityVersion: { increment: 1 } },
    });
    await audit(tx, actor, null, "grant-role", JSON.stringify(c));
  });
  return { ok: true };
}
