import type { Status } from "./status";

const COLOR_CLASS: Record<Status, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  critical: "bg-red-500",
};

const LABEL: Record<Status, string> = {
  ok: "Normal",
  warn: "Elevated",
  critical: "Critical",
};

/** A small colour indicator. Always paired with a number, never the only signal. */
export function StatusDot({ status }: { status: Status }) {
  return (
    <span
      role="img"
      aria-label={LABEL[status]}
      title={LABEL[status]}
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${COLOR_CLASS[status]}`}
    />
  );
}
