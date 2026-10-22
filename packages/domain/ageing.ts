export function ageing(
  app: {
    createdAt: Date;
    attempts: { stage: string; startedAt: Date; endedAt: Date | null }[];
  },
  now: Date,
) {
  const duration = (t: { startedAt: Date; endedAt: Date | null }) =>
    Math.max(0, (+(t.endedAt ?? now) - +t.startedAt) / 86400000);
  return {
    totalDays: Math.max(0, (+now - +app.createdAt) / 86400000),
    institutionDays: app.attempts
      .filter((t) => t.stage === "AWAITING_RESPONSE")
      .reduce((n, t) => n + duration(t), 0),
    officialDays: app.attempts
      .filter((t) => t.stage !== "AWAITING_RESPONSE")
      .reduce((n, t) => n + duration(t), 0),
  };
}
