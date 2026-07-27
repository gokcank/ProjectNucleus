interface SparklineProps {
  /** Values expected in the 0-100 range, oldest first. */
  values: number[];
  className?: string;
}

// Keeps every point off the viewBox edge: without it, a 0% or 100% sample
// sits exactly on the border and half the stroke is clipped, and the
// first/last sample lands under the pill-shaped container's rounded corners
// (h-5 rounded-full overflow-hidden in InlineMeter).
const INSET = 8;
const RANGE = 100 - INSET * 2;

/** A minimal SVG line chart. No charting library — just a polyline. */
export function Sparkline({ values, className }: SparklineProps) {
  if (values.length < 2) return null;

  const points = values
    .map((value, index) => {
      const x = INSET + (index / (values.length - 1)) * RANGE;
      const y = INSET + RANGE - (Math.min(100, Math.max(0, value)) / 100) * RANGE;
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
