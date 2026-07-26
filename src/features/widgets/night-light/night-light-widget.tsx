import { Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { logWarn } from "../../../services/logger-service";
import {
  getNightLightStatus,
  setNightLightEnabled,
  setNightLightTemperature,
  type NightLightStatus,
} from "../../../services/night-light-service";
import type { WidgetDefinition } from "../types";

const MIN_KELVIN = 1700;
const MAX_KELVIN = 4700;

function NightLightContent() {
  const [status, setStatus] = useState<NightLightStatus | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      if (document.hidden) return;
      getNightLightStatus()
        .then((next) => {
          if (!cancelled) setStatus(next);
        })
        .catch((err: unknown) => {
          logWarn(`Night Light unavailable: ${String(err)}`);
          if (!cancelled) setFailed(true);
        });
    };

    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const apply = (action: Promise<NightLightStatus>) => {
    action.then(setStatus).catch((err: unknown) => {
      logWarn(`Night Light change failed: ${String(err)}`);
      setFailed(true);
    });
  };

  const handleTemperature = (event: React.ChangeEvent<HTMLInputElement>) => {
    const temperature = Number(event.target.value);
    setStatus((prev) => (prev ? { ...prev, temperature } : prev));
    apply(setNightLightTemperature(temperature));
  };

  if (failed) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Night Light control unavailable.
      </p>
    );
  }

  if (!status) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Reading setting...</p>
    );
  }

  if (!status.supported) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Night Light is not available on this desktop.
      </p>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => apply(setNightLightEnabled(!status.enabled))}
        aria-pressed={status.enabled}
        className={`flex h-10 w-full items-center justify-center gap-2 rounded-[10px] text-sm font-medium ${
          status.enabled
            ? "bg-neutral-900 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            : "bg-black/5 text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
        }`}
      >
        <Moon size={16} />
        {status.enabled ? "On" : "Off"}
      </button>

      {status.enabled && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="range"
            min={MIN_KELVIN}
            max={MAX_KELVIN}
            step={100}
            value={status.temperature}
            onChange={handleTemperature}
            aria-label="Colour temperature"
            className="min-w-0 flex-1 accent-neutral-900 dark:accent-neutral-100"
          />
          <span className="w-14 shrink-0 text-right text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
            {status.temperature}K
          </span>
        </div>
      )}
    </div>
  );
}

export const nightLightWidget: WidgetDefinition = {
  id: "nightLight",
  title: "Night Light",
  icon: Moon,
  defaultWide: true,
  component: NightLightContent,
};
