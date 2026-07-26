import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import type { WidgetDefinition } from "../types";
import { useWidgetSetting } from "../use-widget-setting";

const withSeconds = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const withoutSeconds = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

function ClockContent() {
  const [now, setNow] = useState(() => new Date());
  const [showSeconds, setShowSeconds] = useWidgetSetting("clock", "showSeconds", true, isBoolean);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const format = showSeconds ? withSeconds : withoutSeconds;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowSeconds(!showSeconds)}
        aria-pressed={showSeconds}
        title={showSeconds ? "Hide seconds" : "Show seconds"}
        className="mt-2 block rounded-md text-2xl font-semibold tabular-nums text-neutral-900 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:text-neutral-100 dark:focus:ring-neutral-600"
      >
        {format.format(now)}
      </button>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        {dateFormat.format(now)}
      </p>
    </>
  );
}

export const clockWidget: WidgetDefinition = {
  id: "clock",
  title: "Clock",
  icon: Clock,
  defaultWide: true,
  component: ClockContent,
};
