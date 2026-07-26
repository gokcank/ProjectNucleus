import { Moon, Power, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { logWarn } from "../../../services/logger-service";
import {
  getPowerCapabilities,
  runPowerAction,
  type PowerAction,
  type PowerCapabilities,
} from "../../../services/power-service";
import type { WidgetDefinition } from "../types";

const ACTION_LABELS: Record<PowerAction, string> = {
  suspend: "Suspend",
  reboot: "Restart",
  powerOff: "Shut Down",
};

const buttonClass =
  "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-black/5 text-sm font-medium text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10";

function PowerContent() {
  const [capabilities, setCapabilities] = useState<PowerCapabilities | null>(null);
  const [failed, setFailed] = useState(false);
  /** Set once an action is armed; nothing runs until it is confirmed. */
  const [pending, setPending] = useState<PowerAction | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPowerCapabilities()
      .then((next) => {
        if (!cancelled) setCapabilities(next);
      })
      .catch((err: unknown) => {
        logWarn(`Power capabilities unavailable: ${String(err)}`);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const confirm = () => {
    if (!pending) return;
    const action = pending;
    setPending(null);
    runPowerAction(action).catch((err: unknown) => {
      logWarn(`Power action failed: ${String(err)}`);
      setFailed(true);
    });
  };

  if (failed) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Power controls unavailable.
      </p>
    );
  }

  if (!capabilities) {
    return <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Checking power...</p>;
  }

  // Confirmation replaces the buttons entirely, so the destructive action can
  // never be one stray click away.
  if (pending) {
    return (
      <div className="mt-2">
        <p className="text-sm text-neutral-900 dark:text-neutral-100">
          {ACTION_LABELS[pending]} now?
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={confirm}
            className="flex h-10 flex-1 items-center justify-center rounded-[10px] bg-red-600 text-sm font-medium text-white hover:bg-red-700"
          >
            Confirm
          </button>
          <button type="button" onClick={() => setPending(null)} className={buttonClass}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      {capabilities.canSuspend && (
        <button type="button" onClick={() => setPending("suspend")} className={buttonClass}>
          <Moon size={16} />
          Suspend
        </button>
      )}
      {capabilities.canReboot && (
        <button type="button" onClick={() => setPending("reboot")} className={buttonClass}>
          <RotateCw size={16} />
          Restart
        </button>
      )}
      {capabilities.canPowerOff && (
        <button type="button" onClick={() => setPending("powerOff")} className={buttonClass}>
          <Power size={16} />
          Shut Down
        </button>
      )}
    </div>
  );
}

export const powerWidget: WidgetDefinition = {
  id: "power",
  title: "Power",
  icon: Power,
  defaultWide: true,
  component: PowerContent,
};
