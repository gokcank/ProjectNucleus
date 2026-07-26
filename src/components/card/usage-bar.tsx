export function UsageBar({ percent }: { percent: number }) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
      <div
        className="h-full rounded-full bg-neutral-900 transition-[width] duration-500 dark:bg-neutral-100"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
