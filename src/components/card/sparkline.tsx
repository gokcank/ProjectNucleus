interface SparklineProps {
  /** Values expected in the 0-100 range, oldest first. */
  values: number[];
  className?: string;
}

/** A minimal SVG line chart. No charting library — just a polyline. */
export function Sparkline({ values, className }: SparklineProps) {
  if (values.length < 2) return null;

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - Math.min(100, Math.max(0, value));
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
