import { Gauge } from "lucide-react";
import { useEffect, useState } from "react";
import { logWarn } from "../../../services/logger-service";
import {
  getPowerProfileStatus,
  setPowerProfile,
  type PowerProfileStatus,
} from "../../../services/power-service";
import type { WidgetDefinition } from "../types";

/** Friendlier names for the profiles power-profiles-daemon reports. */
const PROFILE_LABELS: Record<string, string> = {
  "power-saver": "Saver",
  balanced: "Balanced",
  performance: "Performance",
};

function PowerProfileContent() {
  const [status, setStatus] = useState<PowerProfileStatus | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      if (document.hidden) return;
      getPowerProfileStatus()
        .then((next) => {
          if (!cancelled) setStatus(next);
        })
        .catch((err: unknown) => {
          logWarn(`Power profiles unavailable: ${String(err)}`);
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

  const choose = (profile: string) => {
    setPowerProfile(profile)
      .then(setStatus)
      .catch((err: unknown) => {
        logWarn(`Could not change power profile: ${String(err)}`);
        setFailed(true);
      });
  };

  if (failed) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Power profiles unavailable.
      </p>
    );
  }

  if (!status) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Reading profile...</p>
    );
  }

  if (!status.supported || status.available.length === 0) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Power profiles are not available on this system.
      </p>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      {status.available.map((profile) => (
        <button
          key={profile}
          type="button"
          onClick={() => choose(profile)}
          aria-pressed={profile === status.active}
          className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-sm font-medium ${
            profile === status.active
              ? "bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
              : "bg-black/5 text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
          }`}
        >
          {PROFILE_LABELS[profile] ?? profile}
        </button>
      ))}
    </div>
  );
}

export const powerProfileWidget: WidgetDefinition = {
  id: "powerProfile",
  title: "Power Profile",
  icon: Gauge,
  defaultWide: true,
  component: PowerProfileContent,
};
