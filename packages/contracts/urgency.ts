export function urgency(due: Date | string | null, now: Date) {
  if (!due)
    return {
      key: "NO_DEADLINE",
      label: "No deadline recorded",
      rank: 3,
      days: null,
    };
  const days = (+new Date(due) - +now) / 86400000;
  const istDay = (d: Date) =>
    new Date(+d + 19800000).toISOString().slice(0, 10);
  return days < 0
    ? { key: "OVERDUE", label: `${Math.ceil(-days)}d overdue`, rank: 0, days }
    : istDay(new Date(due)) === istDay(now)
      ? { key: "TODAY", label: "Due today · IST", rank: 1, days }
      : days <= 7
        ? {
            key: "DUE_SOON",
            label: `Due in ${Math.ceil(days)}d`,
            rank: 2,
            days,
          }
        : {
            key: "SCHEDULED",
            label: `Due in ${Math.ceil(days)}d`,
            rank: 3,
            days,
          };
}
