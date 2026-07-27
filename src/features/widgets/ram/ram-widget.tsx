import { MemoryStick } from "lucide-react";
import { useEffect, useState } from "react";
import { InlineMeter } from "../../../components/card/inline-meter";
import { StatusDot } from "../../../components/card/status-dot";
import { statusForPercent } from "../../../components/card/status";
import { logWarn } from "../../../services/logger-service";
import { getMemoryStatus } from "../../../services/system-service";
import type { WidgetDefinition } from "../types";
import { useWidgetSetting } from "../use-widget-setting";

const POLL_INTERVAL_MS = 2000;
const HISTORY_LENGTH = 20;
const BYTES_PER_GIB = 1024 ** 3;

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

function formatGib(bytes: number): string {
  return `${(bytes / BYTES_PER_GIB).toFixed(1)} GiB`;
}

interface RamState {
  percent: number;
  detail?: string;
  history: number[];
}

const INITIAL_STATE: RamState = { percent: 0, history: [] };

function RamContent({ wide }: { wide: boolean }) {
  const [state, setState] = useState(INITIAL_STATE);
  const [sparkline, setSparkline] = useWidgetSetting("ram", "sparkline", false, isBoolean);

  // Own polling loop rather than the shared `usePolling` hook: each tick needs
  // to append to a running history array, not just replace the latest value.
  useEffect(() => {
    let active = true;

    const tick = () => {
      if (document.hidden) return;
      getMemoryStatus()
        .then((memory) => {
          if (!active) return;
          const percent =
            memory.totalBytes === 0 ? 0 : (memory.usedBytes / memory.totalBytes) * 100;
          setState((prev) => ({
            percent,
            detail: `${formatGib(memory.usedBytes)} / ${formatGib(memory.totalBytes)}`,
            history: [...prev.history, percent].slice(-HISTORY_LENGTH),
          }));
        })
        .catch((err: unknown) => {
          logWarn(`Memory status unavailable, polling stopped: ${String(err)}`);
          window.clearInterval(intervalId);
        });
    };

    tick();
    const intervalId = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => setSparkline(!sparkline)}
      aria-pressed={sparkline}
      title={sparkline ? "Hide history" : "Show history"}
      className="flex flex-1 items-center gap-2"
    >
      <StatusDot status={statusForPercent(state.percent)} />
      <InlineMeter
        percent={state.percent}
        detail={state.detail}
        history={sparkline ? state.history : undefined}
      />
      {wide && state.detail && (
        <span className="shrink-0 text-xs whitespace-nowrap tabular-nums text-neutral-500 dark:text-neutral-400">
          {state.detail}
        </span>
      )}
    </button>
  );
}

export const ramWidget: WidgetDefinition = {
  id: "ram",
  title: "RAM",
  icon: MemoryStick,
  compact: true,
  component: RamContent,
};
