import { eachDayOfInterval, format, parse } from "date-fns";
import type { CalendarEventLike, CalendarRange } from "../core/types";
import type { CalendarEntry } from "../types";

const dateFormat = "yyyy-MM-dd";

export function parseCalendarDate(value: string): Date {
  return parse(value, dateFormat, new Date(0));
}

export function formatCalendarDate(date: Date): string {
  return format(date, dateFormat);
}

export function getCalendarDays(range: CalendarRange): Date[] {
  return eachDayOfInterval({
    start: parseCalendarDate(range.startDate),
    end: parseCalendarDate(range.endDate),
  });
}

function clockMinutes(value: string): number {
  const match = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/.exec(value);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function entriesOnDay<TEvent extends CalendarEventLike>(
  entries: readonly TEvent[],
  day: string,
): TEvent[] {
  return entries.filter((entry) => {
    const startDate = entry.start.slice(0, dateFormat.length);
    const endDate = entry.end.slice(0, dateFormat.length);
    if (entry.allDay) return startDate <= day && endDate > day;
    if (startDate > day || endDate < day) return false;
    return !(endDate === day && endDate !== startDate && clockMinutes(entry.end) === 0);
  });
}

export function getTimedPosition<TEvent extends CalendarEventLike>(
  entry: TEvent,
  day: string,
): { startMinutes: number; endMinutes: number } {
  const entryStartDate = entry.start.slice(0, dateFormat.length);
  const entryEndDate = entry.end.slice(0, dateFormat.length);
  const startMinutes = entryStartDate < day ? 0 : clockMinutes(entry.start);
  const endMinutes = entryEndDate > day ? 24 * 60 : clockMinutes(entry.end);
  return {
    startMinutes: Math.max(0, Math.min(startMinutes, 24 * 60 - 30)),
    endMinutes: Math.max(startMinutes + 30, Math.min(endMinutes, 24 * 60)),
  };
}

export function getTimedPositionWithinWindow(
  entry: CalendarEventLike,
  day: string,
  windowStartMinutes: number,
  windowEndMinutes: number,
): { startMinutes: number; endMinutes: number } | null {
  if (windowEndMinutes <= windowStartMinutes) return null;

  const position = getTimedPosition(entry, day);
  const startMinutes = Math.max(position.startMinutes, windowStartMinutes);
  const endMinutes = Math.min(position.endMinutes, windowEndMinutes);

  return endMinutes > startMinutes ? { startMinutes, endMinutes } : null;
}

export function formatEntryTime(entry: CalendarEntry): string {
  if (entry.allDay) return entry.start;
  return `${entry.start.slice(11, 16)}–${entry.end.slice(11, 16)}`;
}
