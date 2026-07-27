import { Cpu } from "lucide-react";
import { InlineMeter } from "../../../components/card/inline-meter";
import { usePolling } from "../../../hooks/use-polling";
import { getCpuStatus } from "../../../services/system-service";
import type { WidgetDefinition } from "../types";

const POLL_INTERVAL_MS = 2000;

function CpuContent() {
  const status = usePolling(getCpuStatus, POLL_INTERVAL_MS, "CPU status");

  return <InlineMeter percent={status?.usagePercent ?? 0} />;
}

export const cpuWidget: WidgetDefinition = {
  id: "cpu",
  title: "CPU",
  icon: Cpu,
  compact: true,
  component: CpuContent,
};
