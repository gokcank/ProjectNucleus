import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import type { WidgetDefinition } from "../types";

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function ClockContent() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {timeFormat.format(now)}
      </p>
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
