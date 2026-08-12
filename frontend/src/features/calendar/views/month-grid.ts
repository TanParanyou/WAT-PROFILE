import { isSameDay, isSameMonth } from "date-fns";
import { getCalendarOverflowCount } from "../layout";
import type { CalendarEntry } from "../types";
import { entriesOnDay, formatCalendarDate } from "./calendar-view-utils";

export interface MonthGridCell {
  date: Date;
  key: string;
  isSelected: boolean;
  isToday: boolean;
  isOutsideCurrentMonth: boolean;
  entries: CalendarEntry[];
  overflowCount: number;
}

export interface MonthGrid {
  rows: MonthGridCell[][];
}

export interface BuildMonthGridInput {
  days: readonly Date[];
  entries: readonly CalendarEntry[];
  monthDate: Date;
  selectedDate: Date;
  today: Date;
  maxVisibleEntries: number;
}

export function buildMonthGrid({
  days,
  entries,
  monthDate,
  selectedDate,
  today,
  maxVisibleEntries,
}: BuildMonthGridInput): MonthGrid {
  const cells = days.map((date): MonthGridCell => {
    const key = formatCalendarDate(date);
    const dayEntries = entriesOnDay(entries, key);
    const visibleEntries = dayEntries.slice(0, Math.max(maxVisibleEntries, 0));

    return {
      date,
      key,
      isSelected: formatCalendarDate(selectedDate) === key,
      isToday: isSameDay(date, today),
      isOutsideCurrentMonth: !isSameMonth(date, monthDate),
      entries: visibleEntries,
      overflowCount: getCalendarOverflowCount(dayEntries.length, visibleEntries.length),
    };
  });

  const rows: MonthGridCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    const row = cells.slice(index, index + 7);
    if (row.length > 0) rows.push(row);
  }

  return { rows };
}
