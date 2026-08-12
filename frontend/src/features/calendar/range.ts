import {
  addDays,
  format,
  isAfter,
  isBefore,
  isEqual,
  isValid,
  parse,
  parseISO,
} from "date-fns";
import type { CalendarEntry } from "./types";
import type { CalendarRange, CalendarView } from "./core/types";
import {
  getViewStep,
  getVisibleRange,
} from "./core/calendar-state";

export type { CalendarRange, CalendarView } from "./core/types";

const dateFormat = "yyyy-MM-dd";

function parseDateOnly(value: string): Date | null {
  const date = parse(value, dateFormat, new Date(0));
  return isValid(date) && format(date, dateFormat) === value ? date : null;
}

export function getCalendarVisibleRange(
  date: Date,
  view: CalendarView,
  weekStartsOn: 0 | 1,
): CalendarRange {
  return getVisibleRange(date, view, weekStartsOn);
}

export function getCalendarStep(view: CalendarView): "month" | "week" | "day" {
  return getViewStep(view);
}

function getEntryDateKeys(entry: CalendarEntry):
  | { startDate: string; endDate: string; endExclusive: boolean }
  | null {
  if (entry.allDay) {
    const start = parseDateOnly(entry.start);
    const end = parseDateOnly(entry.end);
    if (!start || !end || !isBefore(start, end)) return null;

    return {
      startDate: entry.start,
      endDate: entry.end,
      endExclusive: true,
    };
  }

  const start = parseISO(entry.start);
  const end = parseISO(entry.end);
  if (!isValid(start) || !isValid(end) || !isBefore(start, end)) return null;

  const startDate = entry.start.slice(0, dateFormat.length);
  const endDate = entry.end.slice(0, dateFormat.length);
  if (!parseDateOnly(startDate) || !parseDateOnly(endDate)) return null;

  return { startDate, endDate, endExclusive: false };
}

function compareEntries(a: CalendarEntry, b: CalendarEntry): number {
  return (
    a.start.localeCompare(b.start) ||
    a.end.localeCompare(b.end) ||
    a.title.localeCompare(b.title) ||
    a.id.localeCompare(b.id)
  );
}

export function entriesForRange(
  entries: readonly CalendarEntry[],
  range: CalendarRange,
): CalendarEntry[] {
  const rangeStart = parseDateOnly(range.startDate);
  const rangeEnd = parseDateOnly(range.endDate);
  if (!rangeStart || !rangeEnd || isAfter(rangeStart, rangeEnd)) return [];

  return entries
    .filter((entry) => {
      const dates = getEntryDateKeys(entry);
      if (!dates) return false;

      const entryStart = parseDateOnly(dates.startDate);
      const entryEnd = parseDateOnly(dates.endDate);
      if (!entryStart || !entryEnd) return false;

      if (dates.endExclusive) {
        const rangeEndExclusive = addDays(rangeEnd, 1);
        return (
          isBefore(entryStart, rangeEndExclusive) &&
          isAfter(entryEnd, rangeStart)
        );
      }

      return (
        (isBefore(entryStart, rangeEnd) || isEqual(entryStart, rangeEnd)) &&
        (isAfter(entryEnd, rangeStart) || isEqual(entryEnd, rangeStart))
      );
    })
    .sort(compareEntries);
}
