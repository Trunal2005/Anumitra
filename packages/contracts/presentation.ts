// Shared human-facing labels. JSON contracts retain machine-readable values.
export function readable(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
export function reportHeading(key: string) {
  const names: Record<string, string> = {
    submittedVersion: "Latest submitted version",
    submittedReview: "Latest submission review",
    effectiveVersion: "Accepted effective version",
    renewalPending: "Renewal review",
    validity: "Effective evidence validity",
    expires: "Accepted evidence expires",
    demoPolicy: "Policy basis",
  };
  return names[key] ?? readable(key);
}
export function reportValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "Not recorded";
  if (key === "renewalPending")
    return value ? "Renewal pending" : "No renewal pending";
  if (key === "demoPolicy") return value ? "DEMO policy" : "Not specified";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (
    [
      "validity",
      "submittedReview",
      "state",
      "status",
      "category",
      "subjectType",
    ].includes(key)
  )
    return readable(String(value));
  return String(value);
}
