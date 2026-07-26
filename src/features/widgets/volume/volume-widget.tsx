import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { logWarn } from "../../../services/logger-service";
import {
  getVolumeStatus,
  setVolume,
  toggleMute,
  type VolumeStatus,
} from "../../../services/audio-service";
import type { WidgetDefinition } from "../types";

function VolumeContent() {
  const [status, setStatus] = useState<VolumeStatus | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Reads once on mount and again whenever the panel becomes visible.
  // Deliberately not polled: each read spawns a `wpctl` process, which is far
  // heavier than the /proc reads behind the CPU and RAM widgets, and the volume
  // only ever changes while someone is looking at it.
  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      if (document.hidden) return;
      getVolumeStatus()
        .then((next) => {
          if (!cancelled) setStatus(next);
        })
        .catch((err: unknown) => {
          logWarn(`Volume unavailable: ${String(err)}`);
          if (!cancelled) setUnavailable(true);
        });
    };

    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const apply = (action: Promise<VolumeStatus>) => {
    action.then(setStatus).catch((err: unknown) => {
      logWarn(`Volume change failed: ${String(err)}`);
      setUnavailable(true);
    });
  };

  const handleSlide = (event: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(event.target.value);
    // Show the new position immediately; the command response confirms it.
    setStatus((prev) => (prev ? { ...prev, percent } : prev));
    apply(setVolume(percent));
  };

  if (unavailable) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Audio control unavailable.
      </p>
    );
  }

  if (!status) {
    return <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Reading volume...</p>;
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={() => apply(toggleMute())}
        aria-pressed={status.muted}
        aria-label={status.muted ? "Unmute" : "Mute"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-black/5 text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
      >
        {status.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      <input
        type="range"
        min={0}
        max={100}
        value={status.percent}
        onChange={handleSlide}
        aria-label="Volume"
        className="min-w-0 flex-1 accent-neutral-900 dark:accent-neutral-100"
      />

      <span className="w-9 shrink-0 text-right text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
        {status.muted ? "—" : `${status.percent}%`}
      </span>
    </div>
  );
}

export const volumeWidget: WidgetDefinition = {
  id: "volume",
  title: "Volume",
  icon: Volume2,
  defaultWide: true,
  component: VolumeContent,
};
