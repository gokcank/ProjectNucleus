import { Cpu } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "../../components/card/card";
import { UsageBar } from "../../components/card/usage-bar";
import { usePolling } from "../../hooks/use-polling";
import { getCpuStatus } from "../../services/system-service";

const POLL_INTERVAL_MS = 2000;

export function CpuCard({ actions }: { actions?: ReactNode }) {
  const status = usePolling(getCpuStatus, POLL_INTERVAL_MS, "CPU status");

  return (
    <Card icon={Cpu} title="CPU" actions={actions}>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {status === null ? "—" : `${Math.round(status.usagePercent)}%`}
      </p>
      <UsageBar percent={status?.usagePercent ?? 0} />
    </Card>
  );
}
