import { MemoryStick } from "lucide-react";
import { InlineMeter } from "../../../components/card/inline-meter";
import { StatusDot } from "../../../components/card/status-dot";
import { statusForPercent } from "../../../components/card/status";
import { usePolling } from "../../../hooks/use-polling";
import type { MemoryStatus } from "../../../services/system-service";
import { getMemoryStatus } from "../../../services/system-service";
import type { WidgetDefinition } from "../types";
import { useWidgetSetting } from "../use-widget-setting";

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const POLL_INTERVAL_MS = 2000;
const HISTORY_LENGTH = 20;
const BYTES_PER_GIB = 1024 ** 3;

function formatGib(bytes: number): string {
  return `${(bytes / BYTES_PER_GIB).toFixed(1)} GiB`;
}

interface RamState {
  percent: number;
  detail: string;
  history: number[];
}

/** Keeps a rolling history alongside the latest reading, for the optional sparkline. */
function foldRam(previous: RamState | null, memory: MemoryStatus): RamState {
  const percent = memory.totalBytes === 0 ? 0 : (memory.usedBytes / memory.totalBytes) * 100;
  return {
    percent,
    detail: `${formatGib(memory.usedBytes)} / ${formatGib(memory.totalBytes)}`,
    history: [...(previous?.history ?? []), percent].slice(-HISTORY_LENGTH),
  };
}

function RamContent({ wide }: { wide: boolean }) {
  const state = usePolling<MemoryStatus, RamState | null>(
    getMemoryStatus,
    POLL_INTERVAL_MS,
    "Memory status",
    foldRam,
    null,
  );
  const [sparkline, setSparkline] = useWidgetSetting("ram", "sparkline", false, isBoolean);

  return (
    <button
      type="button"
      onClick={() => setSparkline(!sparkline)}
      aria-pressed={sparkline}
      aria-label={sparkline ? "Hide RAM history" : "Show RAM history"}
      // No `title` here: the meter carries its own tooltip with the exact byte
      // counts, which would shadow this one everywhere it matters anyway.
      // The pseudo-element extends the click target to the 40px minimum
      // without making the compact row itself any taller.
      className="relative flex flex-1 items-center gap-2 before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-['']"
    >
      {state && <StatusDot status={statusForPercent(state.percent)} />}
      <InlineMeter
        percent={state?.percent ?? null}
        detail={state?.detail}
        history={sparkline ? state?.history : undefined}
      />
      {wide && state && (
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
