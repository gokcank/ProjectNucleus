export interface CalendarDay {
  /** Day of the month, 1-based. */
  date: number;
  /** Stable identity for the cell, also used to spot today. */
  key: string;
  isToday: boolean;
}

export interface CalendarMonth {
  /** Localized heading, e.g. "July 2026". */
  label: string;
  /** Localized weekday headings, already rotated to the locale's week start. */
  weekdayLabels: string[];
  /** Empty cells before the 1st, so it lands under the right weekday. */
  leadingBlanks: number;
  days: CalendarDay[];
}

export interface MonthCursor {
  year: number;
  /** 0-based, matching Date#getMonth. */
  month: number;
}

const monthFormat = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short" });

/** Any known Sunday; only its weekday matters, as an offset anchor. */
const REFERENCE_SUNDAY = new Date(2024, 0, 7);

/**
 * The weekday a week starts on, as a `Date#getDay` value (0 = Sunday).
 *
 * Fixed to Monday, per ISO 8601. This is deliberately not read from the system
 * locale: that reports Sunday for en-US installs, which is not what someone
 * running an otherwise-English desktop in Europe expects to see. Month and
 * weekday *names* still follow the locale -- only the column order is pinned.
 */
export const WEEK_START = 1;

/** Local-time date identity. Deliberately not ISO/UTC, which can shift the day. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function currentMonth(today: Date): MonthCursor {
  return { year: today.getFullYear(), month: today.getMonth() };
}

/** Steps the cursor by whole months; Date normalizes the year rollover. */
export function addMonths(cursor: MonthCursor, delta: number): MonthCursor {
  const shifted = new Date(cursor.year, cursor.month + delta, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() };
}

export function isSameMonth(a: MonthCursor, b: MonthCursor): boolean {
  return a.year === b.year && a.month === b.month;
}

function weekdayLabels(weekStart: number): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(REFERENCE_SUNDAY);
    day.setDate(REFERENCE_SUNDAY.getDate() + ((weekStart + index) % 7));
    return weekdayFormat.format(day);
  });
}

export function buildMonth(cursor: MonthCursor, today: Date, weekStart: number): CalendarMonth {
  const { year, month } = cursor;
  const firstOfMonth = new Date(year, month, 1);
  // Day 0 of the next month is the last day of this one.
  const dayCount = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(today);

  const days = Array.from({ length: dayCount }, (_, index) => {
    const key = toDateKey(new Date(year, month, index + 1));
    return { date: index + 1, key, isToday: key === todayKey };
  });

  return {
    label: monthFormat.format(firstOfMonth),
    weekdayLabels: weekdayLabels(weekStart),
    leadingBlanks: (firstOfMonth.getDay() - weekStart + 7) % 7,
    days,
  };
}
