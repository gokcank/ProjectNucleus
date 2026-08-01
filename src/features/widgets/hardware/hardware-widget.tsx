import { CircuitBoard } from "lucide-react";
import { useEffect, useState } from "react";
import { logWarn } from "../../../services/logger-service";
import { getHardwareInfo, type HardwareInfo } from "../../../services/hardware-service";
import type { WidgetDefinition } from "../types";

const BYTES_PER_GIB = 1024 ** 3;

/** Matches the RAM card's GiB convention. */
function formatMemory(bytes: number): string {
  return `${(bytes / BYTES_PER_GIB).toFixed(1)} GiB`;
}

interface Fact {
  label: string;
  value: string;
}

/**
 * Only what the machine actually reported. A field the firmware left blank
 * is left out rather than shown as an empty row — the card is a description
 * of this machine, not a form with gaps in it.
 */
function factsFrom(info: HardwareInfo): Fact[] {
  const facts: Fact[] = [];
  const add = (label: string, value: string | null) => {
    if (value) facts.push({ label, value });
  };

  add("Model", info.model);
  add("Processor", info.cpu && `${info.cpu} × ${info.cpuThreads}`);
  // Both chips on a machine that has two, each on its own row.
  info.graphics.forEach((chip) => add("Graphics", chip));
  add("Memory", formatMemory(info.memoryBytes));
  add("System", info.operatingSystem);
  add("Kernel", info.kernel);
  add("Host", info.hostName);

  return facts;
}

function HardwareContent() {
  const [info, setInfo] = useState<HardwareInfo | null>(null);
  const [failed, setFailed] = useState(false);

  // Read once. None of this changes while the machine is running, so there is
  // nothing for a poll to pick up.
  useEffect(() => {
    let cancelled = false;
    getHardwareInfo()
      .then((next) => {
        if (!cancelled) setInfo(next);
      })
      .catch((err: unknown) => {
        logWarn(`Hardware info unavailable: ${String(err)}`);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Couldn&apos;t read this machine&apos;s details
      </p>
    );
  }

  if (!info) {
    return <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Reading hardware…</p>;
  }

  return (
    // Values wrap rather than truncate: the whole point of the card is the
    // full identifier, and a half-shown one cannot be read or copied out.
    <dl className="mt-2 space-y-1">
      {factsFrom(info).map((fact, index) => (
        <div key={`${fact.label}-${index}`} className="flex gap-3">
          <dt className="w-[4.5rem] shrink-0 pt-px text-xs text-neutral-500 dark:text-neutral-400">
            {fact.label}
          </dt>
          <dd className="min-w-0 flex-1 text-sm break-words text-neutral-700 dark:text-neutral-200">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export const hardwareWidget: WidgetDefinition = {
  id: "hardware",
  title: "Hardware",
  keywords: ["about", "specs", "system", "model", "gpu", "kernel"],
  icon: CircuitBoard,
  // Every value is a full product name sitting beside a label column. At half
  // width they wrap onto three lines each, which turns a reference card into a
  // wall of text.
  defaultWide: true,
  component: HardwareContent,
};
