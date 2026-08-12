import type { CalendarEvent } from "../core/types";
import type { CalendarEntry, CalendarScope } from "../types";
import { calendarEntryToneClass } from "../calendar-theme";

export interface CalendarEntryMeta {
  originalEntry: CalendarEntry;
  source: string;
  status: "active" | "inactive";
  display: CalendarEntry["display"];
  detail: CalendarEntry["detail"];
}

export type WatCalendarEvent = CalendarEvent<CalendarEntryMeta>;

export function toCalendarEvent(entry: CalendarEntry): WatCalendarEvent {
  return {
    id: entry.id,
    title: entry.title,
    start: entry.start,
    end: entry.end,
    allDay: entry.allDay,
    resourceId: entry.resourceId,
    meta: {
      originalEntry: entry,
      source: entry.source,
      status: entry.status,
      display: entry.display,
      detail: entry.detail,
    },
  };
}

export function toCalendarEvents(entries: readonly CalendarEntry[]): WatCalendarEvent[] {
  return entries.map(toCalendarEvent);
}

export function formatWatEventTime(
  event: WatCalendarEvent,
  date: string,
  allDayLabel?: string,
): string | null {
  if (event.allDay) return allDayLabel ?? null;

  const startDate = event.start.slice(0, 10);
  const endDate = event.end.slice(0, 10);
  const startTime = event.start.slice(11, 16);
  const endTime = event.end.slice(11, 16);
  if (startDate !== date && endDate !== date) return null;
  if (startDate !== date) return `…–${endTime}`;
  if (endDate !== date) return `${startTime}–…`;
  return `${startTime}–${endTime}`;
}

export function getWatEventLocation(event: WatCalendarEvent): string | null {
  return event.meta.detail.location ?? null;
}

export function getWatEventToneClass(event: WatCalendarEvent, scope: CalendarScope): string {
  return calendarEntryToneClass(scope, event.meta.display.tone);
}

export function getWatEventBarClass(
  event: WatCalendarEvent,
  scope: CalendarScope,
  density: "summary" | "row" | "timeGrid",
): string {
  const toneClass = getWatEventToneClass(event, scope);
  const paddingClass = density === "row" ? "px-3 py-2" : "pl-3 pr-2";
  return `${toneClass} ${paddingClass} border border-current/15`;
}

