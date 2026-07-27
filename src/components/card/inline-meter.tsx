import { Sparkline } from "./sparkline";

interface InlineMeterProps {
  percent: number;
  /** Extra detail (e.g. exact byte counts) shown as a native tooltip on hover. */
  detail?: string;
  /** When given (2+ points), replaces the flat fill with a history line. */
  history?: number[];
}

/** A single-line usage bar with the percentage rendered on top of it. */
export function InlineMeter({ percent, detail, history }: InlineMeterProps) {
  const width = Math.min(100, Math.max(0, percent));
  const showSparkline = history !== undefined && history.length > 1;

  return (
    <div
      title={detail}
      className="relative h-5 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
    >
      {showSparkline ? (
        <Sparkline
          values={history}
          className="absolute inset-0 h-full w-full text-neutral-900/40 dark:text-neutral-100/40"
        />
      ) : (
        <div
          className="h-full rounded-full bg-neutral-900/25 transition-[width] duration-500 dark:bg-neutral-100/25"
          style={{ width: `${width}%` }}
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium tabular-nums text-neutral-700 dark:text-neutral-200">
        {Math.round(width)}%
      </span>
    </div>
  );
}
