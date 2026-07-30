export type Status = "ok" | "warn" | "critical";

/** Generic thresholds for a 0-100 usage percentage. */
export function statusForPercent(percent: number): Status {
  if (percent > 90) return "critical";
  if (percent > 70) return "warn";
  return "ok";
}

/**
 * Thresholds for a 0-100 charge level -- the inverse of usage, where a low
 * number is the bad one. Judged on the level alone: a nearly-empty battery is
 * worth flagging whether or not it happens to be charging at that moment.
 */
export function statusForCharge(percent: number): Status {
  if (percent < 10) return "critical";
  if (percent < 20) return "warn";
  return "ok";
}
