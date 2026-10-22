export type Version = {
  id: string;
  number: number;
  reviewState: string;
  validUntil: Date | null;
};
export function documentCompliance<T extends Version>(
  versions: T[],
  asOf: Date,
) {
  const ordered = [...versions].sort((a, b) => b.number - a.number);
  const submitted = ordered[0] ?? null;
  const effective = ordered.find((v) => v.reviewState === "ACCEPTED") ?? null;
  const status = !effective
    ? "NO_ACCEPTED_VERSION"
    : !effective.validUntil
      ? "NO_EXPIRY_RECORDED"
      : effective.validUntil < asOf
        ? "EXPIRED"
        : +effective.validUntil <= +asOf + 7 * 86400000
          ? "EXPIRING"
          : "CURRENT";
  return {
    submitted,
    effective,
    status,
    renewalPending:
      !!submitted &&
      submitted.id !== effective?.id &&
      submitted.reviewState === "PENDING",
  };
}
