export type Status = "ok" | "warn" | "critical";

/** Generic thresholds for a 0-100 usage percentage. */
export function statusForPercent(percent: number): Status {
  if (percent > 90) return "critical";
  if (percent > 70) return "warn";
  return "ok";
}
