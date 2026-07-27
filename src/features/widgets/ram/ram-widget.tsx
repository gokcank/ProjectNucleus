import { MemoryStick } from "lucide-react";
import { InlineMeter } from "../../../components/card/inline-meter";
import { usePolling } from "../../../hooks/use-polling";
import { getMemoryStatus } from "../../../services/system-service";
import type { WidgetDefinition } from "../types";

const POLL_INTERVAL_MS = 2000;
const BYTES_PER_GIB = 1024 ** 3;

function formatGib(bytes: number): string {
  return `${(bytes / BYTES_PER_GIB).toFixed(1)} GiB`;
}

function RamContent({ wide }: { wide: boolean }) {
  const memory = usePolling(getMemoryStatus, POLL_INTERVAL_MS, "Memory status");

  const usedPercent =
    memory === null || memory.totalBytes === 0 ? 0 : (memory.usedBytes / memory.totalBytes) * 100;

  const detail =
    memory === null
      ? undefined
      : `${formatGib(memory.usedBytes)} / ${formatGib(memory.totalBytes)}`;

  return (
    <>
      <InlineMeter percent={usedPercent} detail={detail} />
      {wide && detail && (
        <span className="shrink-0 text-xs whitespace-nowrap tabular-nums text-neutral-500 dark:text-neutral-400">
          {detail}
        </span>
      )}
    </>
  );
}

export const ramWidget: WidgetDefinition = {
  id: "ram",
  title: "RAM",
  icon: MemoryStick,
  compact: true,
  component: RamContent,
};
