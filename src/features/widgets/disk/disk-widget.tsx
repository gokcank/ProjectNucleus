import { HardDrive } from "lucide-react";
import { statusForCharge } from "../../../components/card/status";
import { StatusDot } from "../../../components/card/status-dot";
import { usePolling } from "../../../hooks/use-polling";
import { getDiskStatus, type Volume } from "../../../services/disk-service";
import type { WidgetDefinition } from "../types";

/** Free space moves slowly; refresh-on-visible keeps the card current anyway. */
const POLL_INTERVAL_MS = 60_000;

const BYTES_PER_GIB = 1024 ** 3;
const GIB_PER_TIB = 1024;

/** Matches RAM's GiB convention, stepping up to TiB so drives stay readable. */
function formatSize(bytes: number): string {
  const gib = bytes / BYTES_PER_GIB;
  return gib >= GIB_PER_TIB ? `${(gib / GIB_PER_TIB).toFixed(1)} TiB` : `${Math.round(gib)} GiB`;
}

/**
 * "351 / 457 GiB free". The unit is written once when both sides share it,
 * which is most of the time and is worth the four characters: volume names
 * run long, and every character this gives back is one the name keeps.
 */
function formatPair(availableBytes: number, totalBytes: number): string {
  const available = formatSize(availableBytes);
  const total = formatSize(totalBytes);
  const [availableValue, availableUnit] = available.split(" ");
  const sharesUnit = availableUnit === total.split(" ")[1];
  return `${sharesUnit ? availableValue : available} / ${total} free`;
}

function keepLatest(_previous: Volume[] | null, next: Volume[]) {
  return next;
}

function VolumeRow({ volume, wide }: { volume: Volume; wide: boolean }) {
  const text = volume.isSystem
    ? "text-neutral-700 dark:text-neutral-200"
    : "text-neutral-500 dark:text-neutral-400";
  // Judged on how much is left, not how much is used -- the same reading the
  // Battery card takes of a charge level.
  const freePercent =
    volume.totalBytes === 0 ? 0 : (volume.availableBytes / volume.totalBytes) * 100;

  return (
    <li className="flex items-center gap-2">
      <HardDrive
        className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400"
        strokeWidth={2}
        aria-hidden
      />
      <span className={`min-w-0 flex-1 truncate text-sm ${text}`} title={volume.mountPoint}>
        {volume.name}
      </span>
      <StatusDot status={statusForCharge(freePercent)} />
      <span className={`shrink-0 text-sm whitespace-nowrap tabular-nums ${text}`}>
        {wide
          ? formatPair(volume.availableBytes, volume.totalBytes)
          : `${formatSize(volume.availableBytes)} free`}
      </span>
    </li>
  );
}

function DiskContent({ wide }: { wide: boolean }) {
  const [volumes] = usePolling<Volume[], Volume[] | null>(
    getDiskStatus,
    POLL_INTERVAL_MS,
    "Disk status",
    keepLatest,
    null,
  );

  if (!volumes) {
    return <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Reading disks...</p>;
  }

  // A machine whose volumes are all filtered out is a state, not an error.
  if (volumes.length === 0) {
    return <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No volumes found</p>;
  }

  return (
    <ul className="mt-2 space-y-1.5">
      {volumes.map((volume) => (
        <VolumeRow key={volume.mountPoint} volume={volume} wide={wide} />
      ))}
    </ul>
  );
}

export const diskWidget: WidgetDefinition = {
  id: "disk",
  title: "Disk",
  keywords: ["storage", "space", "drive", "free"],
  icon: HardDrive,
  // Volume names are long -- they are whatever the owner labelled the drive,
  // like "990 Pro (Windows&Ubuntu)" -- and each sits beside a size that will
  // not wrap. At half width the name is squeezed to a few characters, so this
  // card asks for the room rather than shortening what it is showing.
  defaultWide: true,
  component: DiskContent,
};
