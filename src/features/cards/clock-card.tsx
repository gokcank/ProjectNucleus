import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

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

export function ClockCard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-[18px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
        <Clock className="h-4 w-4" strokeWidth={2} aria-hidden />
        <span className="text-xs font-medium">Clock</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {timeFormat.format(now)}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        {dateFormat.format(now)}
      </p>
    </div>
  );
}
