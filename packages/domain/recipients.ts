import type { Application } from "@prisma/client";
import type { Tx } from "../db/index.ts";
import { scope, grantMatches } from "./permissions.ts";
export async function resolveRecipients(
  tx: Tx,
  app: Application & { institution: { regionId: string } },
  roles: string[],
) {
  const actors = await tx.user.findMany({
    where: { active: true },
    include: { grants: true },
    orderBy: { id: "asc" },
  });
  const found = new Map<string, { id: string; role: string }>();
  for (const role of roles)
    for (const a of actors) {
      const matches =
        role === "ASSIGNEE"
          ? app.ownerId === a.id
          : a.grants.some((g) => g.role === role && grantMatches(g, app));
      if (
        !matches ||
        !(await tx.application.count({ where: { id: app.id, ...scope(a) } }))
      )
        continue;
      if (!found.has(a.id)) found.set(a.id, { id: a.id, role });
    }
  return [...found.values()];
}
