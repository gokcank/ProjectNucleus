import { Cpu, Gpu, HardDrive, Thermometer, type LucideIcon } from "lucide-react";
import { statusForTemperature } from "../../../components/card/status";
import { StatusDot } from "../../../components/card/status-dot";
import { usePolling } from "../../../hooks/use-polling";
import {
  getSensorStatus,
  type SensorStatus,
  type TemperatureReading,
} from "../../../services/sensors-service";
import type { WidgetDefinition } from "../types";

/**
 * Between CPU's two seconds and Battery's thirty. Temperature reacts to load
 * within a few seconds, but not fast enough to be worth a tighter loop.
 */
const POLL_INTERVAL_MS = 5000;

function keepLatest(_previous: SensorStatus | null, next: SensorStatus) {
  return next;
}

interface RowProps {
  icon: LucideIcon;
  reading: TemperatureReading;
  /** Spends the extra room on the full model name instead of the short one. */
  wide: boolean;
  /** The processor, which is the reading the card exists for. */
  primary?: boolean;
}

function SensorRow({ icon: Icon, reading, wide, primary = false }: RowProps) {
  const text = primary
    ? "text-neutral-700 dark:text-neutral-200"
    : "text-neutral-500 dark:text-neutral-400";
  const name = wide && reading.detail !== null ? reading.detail : reading.label;

  return (
    <li className="flex items-center gap-2">
      <Icon
        className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400"
        strokeWidth={2}
        aria-hidden
      />
      <span
        className={`min-w-0 flex-1 truncate text-sm ${text}`}
        title={reading.detail ?? undefined}
      >
        {name}
      </span>
      <StatusDot status={statusForTemperature(reading.celsius)} />
      <span className={`shrink-0 text-sm tabular-nums ${text}`}>
        {Math.round(reading.celsius)}°C
      </span>
    </li>
  );
}

function SensorsContent({ wide }: { wide: boolean }) {
  const [status] = usePolling<SensorStatus, SensorStatus | null>(
    getSensorStatus,
    POLL_INTERVAL_MS,
    "Temperature sensors",
    keepLatest,
    null,
  );

  if (!status) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Reading sensors...</p>
    );
  }

  const { cpu, gpu, drives } = status;

  // A machine whose sensors the kernel cannot reach is a state, not an error,
  // the way a desktop with no battery is on the Battery card.
  if (!cpu && !gpu && drives.length === 0) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        No temperature sensors found
      </p>
    );
  }

  return (
    <ul className="mt-2 space-y-1.5">
      {cpu && <SensorRow icon={Cpu} reading={cpu} wide={wide} primary />}
      {gpu && <SensorRow icon={Gpu} reading={gpu} wide={wide} />}
      {drives.map((drive) => (
        <SensorRow key={drive.detail ?? drive.label} icon={HardDrive} reading={drive} wide={wide} />
      ))}
    </ul>
  );
}

export const sensorsWidget: WidgetDefinition = {
  id: "sensors",
  title: "Temperature",
  keywords: ["sensors", "thermal", "heat", "cpu", "gpu"],
  icon: Thermometer,
  component: SensorsContent,
};
