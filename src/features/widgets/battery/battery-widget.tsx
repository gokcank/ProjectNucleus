import {
  BatteryMedium,
  Gamepad2,
  Headphones,
  Keyboard,
  Mouse,
  Smartphone,
  Speaker,
  Tablet,
  type LucideIcon,
} from "lucide-react";
import { InlineMeter } from "../../../components/card/inline-meter";
import { statusForCharge } from "../../../components/card/status";
import { StatusDot } from "../../../components/card/status-dot";
import { usePolling } from "../../../hooks/use-polling";
import {
  getBatteryStatus,
  type BatteryStatus,
  type PeripheralBattery,
  type PeripheralKind,
} from "../../../services/battery-service";
import type { WidgetDefinition } from "../types";

/** Charge moves slowly; there is nothing to gain from a tighter loop. */
const POLL_INTERVAL_MS = 30_000;

const STATE_LABELS: Record<BatteryStatus["state"], string> = {
  charging: "Charging",
  discharging: "On battery",
  full: "Full",
  empty: "Empty",
  unknown: "Battery",
};

const KIND_ICONS: Record<PeripheralKind, LucideIcon> = {
  mouse: Mouse,
  keyboard: Keyboard,
  phone: Smartphone,
  tablet: Tablet,
  "gaming-input": Gamepad2,
  headset: Headphones,
  speakers: Speaker,
  headphones: Headphones,
  other: BatteryMedium,
};

function formatRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/** e.g. "Charging · 1h 20m to full" -- the estimate is often unavailable. */
function describe(status: BatteryStatus): string {
  const label = STATE_LABELS[status.state];
  if (status.secondsRemaining === null) return label;

  const remaining = formatRemaining(status.secondsRemaining);
  if (status.state === "charging") return `${label} · ${remaining} to full`;
  if (status.state === "discharging") return `${label} · ${remaining} left`;
  return label;
}

function keepLatest(_previous: BatteryStatus | null, next: BatteryStatus) {
  return next;
}

function PeripheralRow({ peripheral }: { peripheral: PeripheralBattery }) {
  const Icon = KIND_ICONS[peripheral.kind];
  return (
    <li className="flex items-center gap-2">
      <Icon
        className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400"
        strokeWidth={2}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-sm text-neutral-700 dark:text-neutral-300">
        {peripheral.name}
      </span>
      <StatusDot status={statusForCharge(peripheral.percent)} />
      <span className="shrink-0 text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
        {peripheral.percent}%
      </span>
    </li>
  );
}

function BatteryContent({ wide }: { wide: boolean }) {
  const [status] = usePolling<BatteryStatus, BatteryStatus | null>(
    getBatteryStatus,
    POLL_INTERVAL_MS,
    "Battery status",
    keepLatest,
    null,
  );

  if (!status) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Reading battery...</p>
    );
  }

  const hasPeripherals = status.peripherals.length > 0;

  if (!status.present && !hasPeripherals) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No batteries found</p>
    );
  }

  const detail = describe(status);

  return (
    <div className="mt-2 space-y-2">
      {status.present && (
        <div className="flex items-center gap-2">
          <StatusDot status={statusForCharge(status.percent)} />
          <InlineMeter percent={status.percent} detail={detail} />
          {wide && (
            <span className="shrink-0 text-xs whitespace-nowrap tabular-nums text-neutral-500 dark:text-neutral-400">
              {detail}
            </span>
          )}
        </div>
      )}

      {hasPeripherals && (
        <ul className="space-y-1.5">
          {status.peripherals.map((peripheral) => (
            <PeripheralRow key={`${peripheral.kind}-${peripheral.name}`} peripheral={peripheral} />
          ))}
        </ul>
      )}
    </div>
  );
}

export const batteryWidget: WidgetDefinition = {
  id: "battery",
  title: "Battery",
  icon: BatteryMedium,
  component: BatteryContent,
};
