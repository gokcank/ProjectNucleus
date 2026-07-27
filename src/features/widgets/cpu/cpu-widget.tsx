import { Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import { InlineMeter } from "../../../components/card/inline-meter";
import { logWarn } from "../../../services/logger-service";
import { getCpuStatus } from "../../../services/system-service";
import type { WidgetDefinition } from "../types";
import { useWidgetSetting } from "../use-widget-setting";

const POLL_INTERVAL_MS = 2000;
const HISTORY_LENGTH = 20;

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

interface CpuState {
  percent: number;
  history: number[];
}

const INITIAL_STATE: CpuState = { percent: 0, history: [] };

function CpuContent() {
  const [state, setState] = useState(INITIAL_STATE);
  const [sparkline, setSparkline] = useWidgetSetting("cpu", "sparkline", false, isBoolean);

  // Own polling loop rather than the shared `usePolling` hook: each tick needs
  // to append to a running history array, not just replace the latest value.
  useEffect(() => {
    let active = true;

    const tick = () => {
      if (document.hidden) return;
      getCpuStatus()
        .then((status) => {
          if (!active) return;
          setState((prev) => ({
            percent: status.usagePercent,
            history: [...prev.history, status.usagePercent].slice(-HISTORY_LENGTH),
          }));
        })
        .catch((err: unknown) => {
          logWarn(`CPU status unavailable, polling stopped: ${String(err)}`);
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
      className="flex flex-1 items-center"
    >
      <InlineMeter percent={state.percent} history={sparkline ? state.history : undefined} />
    </button>
  );
}

export const cpuWidget: WidgetDefinition = {
  id: "cpu",
  title: "CPU",
  icon: Cpu,
  compact: true,
  component: CpuContent,
};
