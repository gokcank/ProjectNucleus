import { Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import { logWarn } from "../../services/logger-service";
import { getCpuStatus } from "../../services/system-service";

const POLL_INTERVAL_MS = 2000;

export function CpuCard() {
  const [usagePercent, setUsagePercent] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const tick = () => {
      if (document.hidden) return;
      getCpuStatus()
        .then((status) => {
          if (active) setUsagePercent(status.usagePercent);
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

  const display = usagePercent === null ? "—" : `${Math.round(usagePercent)}%`;
  const barWidth = usagePercent === null ? 0 : Math.min(100, Math.max(0, usagePercent));

  return (
    <div className="rounded-[18px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
        <Cpu className="h-4 w-4" strokeWidth={2} aria-hidden />
        <span className="text-xs font-medium">CPU</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {display}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-neutral-900 transition-[width] duration-500 dark:bg-neutral-100"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
