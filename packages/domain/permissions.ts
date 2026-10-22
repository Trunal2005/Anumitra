import type { Prisma, Grant, User, Application } from "@prisma/client";
export type Actor = User & { grants: Grant[] };
type Case = Pick<
  Application,
  "institutionId" | "bureau" | "ownerId" | "state"
> & { institution?: { regionId: string } };
const official = [
  "REVIEWER",
  "SUPERVISOR",
  "BUREAU",
  "AUTHORITY",
  "AUDITOR",
  "COMMITTEE",
];
export function validGrant(g: Grant) {
  if (g.role === "INSTITUTION")
    return !!g.institutionId && !g.committee && !g.global;
  if (g.role === "ADMIN")
    return (
      g.global && !g.committee && !g.institutionId && !g.regionId && !g.bureau
    );
  if (!official.includes(g.role)) return false;
  if (
    g.role === "COMMITTEE" &&
    !["EVC", "SAC", "SHC"].includes(g.committee ?? "")
  )
    return false;
  if (g.role !== "COMMITTEE" && g.committee) return false;
  return !!(g.global || g.institutionId || g.regionId || g.bureau);
}
export function grantMatches(
  g: Grant,
  app: Pick<Case, "institutionId" | "bureau" | "institution">,
) {
  return (
    validGrant(g) &&
    (!g.institutionId || g.institutionId === app.institutionId) &&
    (!g.regionId || g.regionId === app.institution?.regionId) &&
    (!g.bureau || g.bureau === app.bureau)
  );
}
export function scope(a: Actor): Prisma.ApplicationWhereInput {
  if (!a.active) return { id: "DENIED" };
  const OR: Prisma.ApplicationWhereInput[] = [];
  for (const g of a.grants) {
    if (!validGrant(g) || g.role === "ADMIN") continue;
    const dimensions: Prisma.ApplicationWhereInput = {
      ...(g.institutionId ? { institutionId: g.institutionId } : {}),
      ...(g.regionId ? { institution: { regionId: g.regionId } } : {}),
      ...(g.bureau ? { bureau: g.bureau } : {}),
    };
    if (g.role === "REVIEWER") dimensions.ownerId = a.id;
    if (g.role === "COMMITTEE")
      dimensions.OR = [
        {
          visits: {
            some: { reservations: { some: { userId: a.id, active: true } } },
          },
        },
        { ownerId: a.id, state: g.committee! },
      ];
    if (Object.keys(dimensions).length === 0 && g.global) return {};
    OR.push(dimensions);
  }
  return { OR: OR.length ? OR : [{ id: "DENIED" }] };
}
export function can(a: Actor, app: Case, roles: string[]) {
  return (
    a.active &&
    a.grants.some(
      (g) =>
        roles.includes(g.role) &&
        grantMatches(g, app) &&
        (g.role !== "REVIEWER" || app.ownerId === a.id) &&
        (g.role !== "COMMITTEE" ||
          (app.ownerId === a.id && app.state === g.committee)),
    )
  );
}
export function officialScope(a: Actor) {
  return scope({
    ...a,
    grants: a.grants.filter((g) => g.role !== "INSTITUTION"),
  });
}
export function eligible(a: Actor, app: Case, stage = app.state) {
  const roles =
    stage === "AUTHORITY"
      ? ["AUTHORITY"]
      : ["EVC", "SAC", "SHC"].includes(stage)
        ? ["COMMITTEE"]
        : ["REVIEWER", "SUPERVISOR", "BUREAU"];
  return (
    a.active &&
    a.grants.some(
      (g) =>
        roles.includes(g.role) &&
        grantMatches(g, app) &&
        (g.role !== "COMMITTEE" || g.committee === stage),
    )
  );
}
export function mayDelegate(
  a: Actor,
  target: Pick<
    Grant,
    | "role"
    | "institutionId"
    | "regionId"
    | "bureau"
    | "committee"
    | "global"
    | "canDelegateGlobal"
  >,
) {
  return (
    a.active &&
    a.grants.some(
      (g) =>
        g.role === "BUREAU" &&
        validGrant(g) &&
        ((g.global && g.canDelegateGlobal) ||
          (!target.global &&
            !target.canDelegateGlobal &&
            !["ADMIN", "BUREAU", "AUTHORITY"].includes(target.role) &&
            (!g.institutionId || target.institutionId === g.institutionId) &&
            (!g.regionId || target.regionId === g.regionId) &&
            (!g.bureau || target.bureau === g.bureau))),
    )
  );
}
