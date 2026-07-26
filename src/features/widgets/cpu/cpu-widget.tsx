import { Cpu } from "lucide-react";
import { UsageBar } from "../../../components/card/usage-bar";
import { usePolling } from "../../../hooks/use-polling";
import { getCpuStatus } from "../../../services/system-service";
import type { WidgetDefinition } from "../types";

const POLL_INTERVAL_MS = 2000;

function CpuContent() {
  const status = usePolling(getCpuStatus, POLL_INTERVAL_MS, "CPU status");

  return (
    <>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {status === null ? "—" : `${Math.round(status.usagePercent)}%`}
      </p>
      <UsageBar percent={status?.usagePercent ?? 0} />
    </>
  );
}

export const cpuWidget: WidgetDefinition = {
  id: "cpu",
  title: "CPU",
  icon: Cpu,
  component: CpuContent,
};
