import { MemoryStick } from "lucide-react";
import { UsageBar } from "../../../components/card/usage-bar";
import { usePolling } from "../../../hooks/use-polling";
import { getMemoryStatus } from "../../../services/system-service";
import type { WidgetDefinition } from "../types";

const POLL_INTERVAL_MS = 2000;
const BYTES_PER_GIB = 1024 ** 3;

function formatGib(bytes: number): string {
  return `${(bytes / BYTES_PER_GIB).toFixed(1)} GiB`;
}

function RamContent() {
  const memory = usePolling(getMemoryStatus, POLL_INTERVAL_MS, "Memory status");

  const usedPercent =
    memory === null || memory.totalBytes === 0 ? 0 : (memory.usedBytes / memory.totalBytes) * 100;

  return (
    <>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {memory === null ? "—" : `${Math.round(usedPercent)}%`}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        {memory === null ? "" : `${formatGib(memory.usedBytes)} / ${formatGib(memory.totalBytes)}`}
      </p>
      <UsageBar percent={usedPercent} />
    </>
  );
}

export const ramWidget: WidgetDefinition = {
  id: "ram",
  title: "RAM",
  icon: MemoryStick,
  component: RamContent,
};
