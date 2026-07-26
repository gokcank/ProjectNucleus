import { MemoryStick } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "../../components/card/card";
import { UsageBar } from "../../components/card/usage-bar";
import { usePolling } from "../../hooks/use-polling";
import { getMemoryStatus } from "../../services/system-service";

const POLL_INTERVAL_MS = 2000;
const BYTES_PER_GIB = 1024 ** 3;

function formatGib(bytes: number): string {
  return `${(bytes / BYTES_PER_GIB).toFixed(1)} GiB`;
}

export function RamCard({ actions }: { actions?: ReactNode }) {
  const memory = usePolling(getMemoryStatus, POLL_INTERVAL_MS, "Memory status");

  const usedPercent =
    memory === null || memory.totalBytes === 0 ? 0 : (memory.usedBytes / memory.totalBytes) * 100;

  return (
    <Card icon={MemoryStick} title="RAM" actions={actions}>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {memory === null ? "—" : `${Math.round(usedPercent)}%`}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        {memory === null ? "" : `${formatGib(memory.usedBytes)} / ${formatGib(memory.totalBytes)}`}
      </p>
      <UsageBar percent={usedPercent} />
    </Card>
  );
}
