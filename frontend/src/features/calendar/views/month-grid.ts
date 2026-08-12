import { isSameDay, isSameMonth } from "date-fns";
import { getCalendarOverflowCount } from "../layout";
import type { CalendarEventLike } from "../core/types";
import { entriesOnDay, formatCalendarDate } from "./calendar-view-utils";

export interface MonthGridCell<TEvent extends CalendarEventLike = CalendarEventLike> {
  date: Date;
  key: string;
  isSelected: boolean;
  isToday: boolean;
  isOutsideCurrentMonth: boolean;
  entries: TEvent[];
  overflowCount: number;
}

export interface MonthGrid<TEvent extends CalendarEventLike = CalendarEventLike> {
  rows: MonthGridCell<TEvent>[][];
}

export interface BuildMonthGridInput<TEvent extends CalendarEventLike = CalendarEventLike> {
  days: readonly Date[];
  entries: readonly TEvent[];
  monthDate: Date;
  selectedDate: Date;
  today: Date;
  maxVisibleEntries: number;
}

export function buildMonthGrid<TEvent extends CalendarEventLike>({
  days,
  entries,
  monthDate,
  selectedDate,
  today,
  maxVisibleEntries,
}: BuildMonthGridInput<TEvent>): MonthGrid<TEvent> {
  const cells = days.map((date): MonthGridCell<TEvent> => {
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

  const rows: MonthGridCell<TEvent>[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    const row = cells.slice(index, index + 7);
    if (row.length > 0) rows.push(row);
  }

  return { rows };
}
