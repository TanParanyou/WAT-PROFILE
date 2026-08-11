import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export interface CalendarRange {
  startDate: string;
  endDate: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  href?: string;
  status?: "active" | "inactive";
  type?: string;
}

export interface CalendarDay {
  date: string;
  events: CalendarEvent[];
}

const dateFormat = "yyyy-MM-dd";

function parseDateOnly(value: string): Date | null {
  const date = parse(value, dateFormat, new Date(0));
  return isValid(date) && format(date, dateFormat) === value ? date : null;
}

export function getMonthGridRange(
  month: Date,
  weekStartsOn: 0 | 1,
): CalendarRange {
  return {
    startDate: format(
      startOfWeek(startOfMonth(month), { weekStartsOn }),
      dateFormat,
    ),
    endDate: format(endOfWeek(endOfMonth(month), { weekStartsOn }), dateFormat),
  };
}

export function buildCalendarDays(
  events: readonly CalendarEvent[],
  range: CalendarRange,
): CalendarDay[] {
  const start = parseDateOnly(range.startDate);
  const end = parseDateOnly(range.endDate);

  if (!start || !end || isAfter(start, end)) return [];

  const byDate = new Map<string, CalendarEvent[]>();
  for (const date of eachDayOfInterval({ start, end })) {
    byDate.set(format(date, dateFormat), []);
  }

  for (const event of events) {
    const eventStart = parseDateOnly(event.startDate);
    const eventEnd = parseDateOnly(event.endDate);
    if (!eventStart || !eventEnd || isAfter(eventStart, eventEnd)) continue;
    if (isAfter(eventStart, end) || isBefore(eventEnd, start)) continue;

    const visibleStart = isBefore(eventStart, start) ? start : eventStart;
    const visibleEnd = isAfter(eventEnd, end) ? end : eventEnd;

    for (const date of eachDayOfInterval({ start: visibleStart, end: visibleEnd })) {
      byDate.get(format(date, dateFormat))?.push(event);
    }
  }

  return [...byDate].map(([date, dayEvents]) => ({
    date,
    events: dayEvents.sort(
      (a, b) =>
        a.startDate.localeCompare(b.startDate) ||
        a.title.localeCompare(b.title) ||
        a.id.localeCompare(b.id),
    ),
  }));
}
