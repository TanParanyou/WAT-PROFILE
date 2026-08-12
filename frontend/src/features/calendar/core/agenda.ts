import type { CalendarEvent } from "./types";

export interface AgendaDay<TMeta> {
  date: string;
  allDayEvents: CalendarEvent<TMeta>[];
  timedEvents: CalendarEvent<TMeta>[];
}

function datePart(value: string): string {
  return value.slice(0, 10);
}

function clockMinutes(value: string): number {
  const match = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/.exec(value);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function coversDay<TMeta>(event: CalendarEvent<TMeta>, day: string): boolean {
  const startDate = datePart(event.start);
  const endDate = datePart(event.end);
  if (!startDate || !endDate || startDate > endDate) return false;

  if (event.allDay) return startDate <= day && endDate > day;
  if (startDate > day || endDate < day) return false;
  return !(endDate === day && endDate !== startDate && clockMinutes(event.end) === 0);
}

export function compareCalendarEvents<TMeta>(
  a: CalendarEvent<TMeta>,
  b: CalendarEvent<TMeta>,
): number {
  return (
    Number(b.allDay) - Number(a.allDay) ||
    a.start.localeCompare(b.start) ||
    a.end.localeCompare(b.end) ||
    a.title.localeCompare(b.title) ||
    a.id.localeCompare(b.id)
  );
}

export function buildAgendaDays<TMeta>(input: {
  days: readonly string[];
  events: readonly CalendarEvent<TMeta>[];
}): AgendaDay<TMeta>[] {
  return input.days.map((date) => {
    const events = input.events.filter((event) => coversDay(event, date));
    return {
      date,
      allDayEvents: events
        .filter((event) => event.allDay)
        .sort(compareCalendarEvents),
      timedEvents: events
        .filter((event) => !event.allDay)
        .sort(compareCalendarEvents),
    };
  });
}
