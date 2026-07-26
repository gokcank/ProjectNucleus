import { MemoryStick } from "lucide-react";
import { useEffect, useState } from "react";
import { logWarn } from "../../services/logger-service";
import { getMemoryStatus, type MemoryStatus } from "../../services/system-service";

const POLL_INTERVAL_MS = 2000;
const BYTES_PER_GIB = 1024 ** 3;

function formatGib(bytes: number): string {
  return `${(bytes / BYTES_PER_GIB).toFixed(1)} GiB`;
}

export function RamCard() {
  const [memory, setMemory] = useState<MemoryStatus | null>(null);

  useEffect(() => {
    let active = true;

    const tick = () => {
      if (document.hidden) return;
      getMemoryStatus()
        .then((status) => {
          if (active) setMemory(status);
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

  const usedPercent =
    memory === null || memory.totalBytes === 0 ? 0 : (memory.usedBytes / memory.totalBytes) * 100;

  return (
    <div className="rounded-[18px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
        <MemoryStick className="h-4 w-4" strokeWidth={2} aria-hidden />
        <span className="text-xs font-medium">RAM</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {memory === null ? "—" : `${Math.round(usedPercent)}%`}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        {memory === null ? "" : `${formatGib(memory.usedBytes)} / ${formatGib(memory.totalBytes)}`}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-neutral-900 transition-[width] duration-500 dark:bg-neutral-100"
          style={{ width: `${Math.min(100, usedPercent)}%` }}
        />
      </div>
    </div>
  );
}
