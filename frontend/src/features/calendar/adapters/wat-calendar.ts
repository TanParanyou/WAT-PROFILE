import type { CalendarEntry, CalendarScope } from "../types";
import { calendarEntryToneClass } from "../calendar-theme";

export function formatWatEventTime(
  event: CalendarEntry,
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

export function getWatEventLocation(event: CalendarEntry): string | null {
  return event.detail.location ?? null;
}

export function getWatEventToneClass(event: CalendarEntry, scope: CalendarScope): string {
  return calendarEntryToneClass(scope, event.display.tone);
}

export function getWatEventBarClass(
  event: CalendarEntry,
  scope: CalendarScope,
  density: "summary" | "row" | "timeGrid",
): string {
  const toneClass = getWatEventToneClass(event, scope);
  const paddingClass = density === "row" ? "px-3 py-2" : "pl-3 pr-2";
  return `border border-current/15 ${paddingClass} ${toneClass}`;
}

