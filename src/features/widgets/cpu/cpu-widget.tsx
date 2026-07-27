import { Cpu } from "lucide-react";
import { InlineMeter } from "../../../components/card/inline-meter";
import { StatusDot } from "../../../components/card/status-dot";
import { statusForPercent } from "../../../components/card/status";
import { usePolling } from "../../../hooks/use-polling";
import type { CpuStatus } from "../../../services/system-service";
import { getCpuStatus } from "../../../services/system-service";
import type { WidgetDefinition } from "../types";
import { useWidgetSetting } from "../use-widget-setting";

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const POLL_INTERVAL_MS = 2000;
const HISTORY_LENGTH = 20;

interface CpuState {
  percent: number;
  history: number[];
}

/** Keeps a rolling history alongside the latest reading, for the optional sparkline. */
function foldCpu(previous: CpuState | null, status: CpuStatus): CpuState {
  return {
    percent: status.usagePercent,
    history: [...(previous?.history ?? []), status.usagePercent].slice(-HISTORY_LENGTH),
  };
}

function CpuContent() {
  const state = usePolling<CpuStatus, CpuState | null>(
    getCpuStatus,
    POLL_INTERVAL_MS,
    "CPU status",
    foldCpu,
    null,
  );
  const [sparkline, setSparkline] = useWidgetSetting("cpu", "sparkline", false, isBoolean);

  return (
    <button
      type="button"
      onClick={() => setSparkline(!sparkline)}
      aria-pressed={sparkline}
      title={sparkline ? "Hide history" : "Show history"}
      className="flex flex-1 items-center gap-2"
    >
      {state && <StatusDot status={statusForPercent(state.percent)} />}
      <InlineMeter
        percent={state?.percent ?? null}
        history={sparkline ? state?.history : undefined}
      />
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
