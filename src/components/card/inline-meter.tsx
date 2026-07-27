interface InlineMeterProps {
  percent: number;
  /** Extra detail (e.g. exact byte counts) shown as a native tooltip on hover. */
  detail?: string;
}

/** A single-line usage bar with the percentage rendered on top of it. */
export function InlineMeter({ percent, detail }: InlineMeterProps) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div
      title={detail}
      className="relative h-5 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
    >
      <div
        className="h-full rounded-full bg-neutral-900/25 transition-[width] duration-500 dark:bg-neutral-100/25"
        style={{ width: `${width}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium tabular-nums text-neutral-700 dark:text-neutral-200">
        {Math.round(width)}%
      </span>
    </div>
  );
}
