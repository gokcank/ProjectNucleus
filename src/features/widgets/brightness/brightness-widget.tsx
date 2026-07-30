import { Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getBrightnessStatus,
  setBrightness,
  type BrightnessStatus,
} from "../../../services/brightness-service";
import { logWarn } from "../../../services/logger-service";
import type { WidgetDefinition } from "../types";

/** Collapses a fast slider drag into one D-Bus call instead of one per pixel. */
const SLIDE_DEBOUNCE_MS = 120;

function BrightnessContent() {
  const [status, setStatus] = useState<BrightnessStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const slideTimeoutRef = useRef<number>(undefined);
  // Two overlapping calls can finish in either order, so only the reply to the
  // most recent one may update state -- otherwise a stale response overwrites
  // a newer one and the slider drifts away from the real brightness.
  const latestRequestId = useRef(0);

  // Reads on mount and again whenever the panel becomes visible, rather than
  // polling: brightness only changes while someone is looking at it, and each
  // read is a D-Bus round trip.
  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      if (document.hidden) return;
      getBrightnessStatus()
        .then((next) => {
          if (!cancelled) setStatus(next);
        })
        .catch((err: unknown) => {
          logWarn(`Brightness unavailable: ${String(err)}`);
          if (!cancelled) setFailed(true);
        });
    };

    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", refresh);
      window.clearTimeout(slideTimeoutRef.current);
    };
  }, []);

  const handleSlide = (event: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(event.target.value);
    // Show the new position immediately; the debounced call below confirms it.
    setStatus((prev) => (prev ? { ...prev, percent } : prev));
    window.clearTimeout(slideTimeoutRef.current);
    slideTimeoutRef.current = window.setTimeout(() => {
      const requestId = ++latestRequestId.current;
      setBrightness(percent)
        .then((next) => {
          if (requestId === latestRequestId.current) setStatus(next);
        })
        .catch((err: unknown) => {
          logWarn(`Brightness change failed: ${String(err)}`);
          setFailed(true);
        });
    }, SLIDE_DEBOUNCE_MS);
  };

  if (failed) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Brightness control unavailable.
      </p>
    );
  }

  if (!status) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Reading brightness...</p>
    );
  }

  if (!status.supported) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        No adjustable display attached.
      </p>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <Sun
        className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400"
        strokeWidth={2}
        aria-hidden
      />

      <input
        type="range"
        min={0}
        max={100}
        value={status.percent}
        onChange={handleSlide}
        aria-label="Brightness"
        className="min-w-0 flex-1 accent-neutral-900 dark:accent-neutral-100"
      />

      <span className="w-9 shrink-0 text-right text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
        {status.percent}%
      </span>
    </div>
  );
}

export const brightnessWidget: WidgetDefinition = {
  id: "brightness",
  title: "Brightness",
  icon: Sun,
  defaultWide: true,
  component: BrightnessContent,
};
