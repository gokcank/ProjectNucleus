import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { WidgetDefinition } from "../types";
import {
  addMonths,
  buildMonth,
  currentMonth,
  isSameMonth,
  toDateKey,
  WEEK_START,
  type MonthCursor,
} from "./calendar-logic";

const DATE_CHECK_MS = 60_000;

const navButtonClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-neutral-600 hover:bg-black/5 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:text-neutral-300 dark:hover:bg-white/5 dark:focus:ring-neutral-600";

function CalendarContent() {
  const [today, setToday] = useState(() => new Date());
  const [cursor, setCursor] = useState<MonthCursor>(() => currentMonth(new Date()));

  // Keeps "today" honest for a panel left open across midnight. Returning the
  // previous value on every other check means React skips the re-render, so
  // this costs one comparison a minute and nothing else.
  useEffect(() => {
    const id = window.setInterval(() => {
      setToday((prev) => (toDateKey(prev) === toDateKey(new Date()) ? prev : new Date()));
    }, DATE_CHECK_MS);
    return () => window.clearInterval(id);
  }, []);

  const month = useMemo(() => buildMonth(cursor, today, WEEK_START), [cursor, today]);
  const onCurrentMonth = isSameMonth(cursor, currentMonth(today));

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setCursor((prev) => addMonths(prev, -1))}
          aria-label="Previous month"
          className={navButtonClass}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => setCursor(currentMonth(today))}
          disabled={onCurrentMonth}
          title={onCurrentMonth ? undefined : "Back to this month"}
          className="min-w-0 flex-1 truncate rounded-[10px] px-2 py-0.5 text-center text-xs font-medium text-neutral-900 focus:ring-2 focus:ring-neutral-400 focus:outline-none enabled:hover:bg-black/5 dark:text-neutral-100 dark:focus:ring-neutral-600 dark:enabled:hover:bg-white/5"
        >
          {month.label}
        </button>
        <button
          type="button"
          onClick={() => setCursor((prev) => addMonths(prev, 1))}
          aria-label="Next month"
          className={navButtonClass}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-0.5">
        {month.weekdayLabels.map((label, index) => (
          <div
            key={index}
            className="flex h-6 items-center justify-center truncate text-[10px] font-medium text-neutral-500 dark:text-neutral-400"
          >
            {label}
          </div>
        ))}
        {Array.from({ length: month.leadingBlanks }, (_, index) => (
          <div key={`blank-${index}`} className="h-7" />
        ))}
        {month.days.map((day) => (
          <div
            key={day.key}
            aria-current={day.isToday ? "date" : undefined}
            className={`flex h-7 items-center justify-center rounded-full text-xs tabular-nums ${
              day.isToday
                ? "bg-neutral-900 font-semibold text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-700 dark:text-neutral-300"
            }`}
          >
            {day.date}
          </div>
        ))}
      </div>
    </div>
  );
}

export const calendarWidget: WidgetDefinition = {
  id: "calendar",
  title: "Calendar",
  icon: CalendarDays,
  defaultWide: true,
  component: CalendarContent,
};
