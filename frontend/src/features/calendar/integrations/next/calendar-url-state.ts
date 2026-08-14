import { format, isValid, parse, startOfDay } from "date-fns";
import type { CalendarView } from "../../core/types";

const dateFormat = "yyyy-MM-dd";

export interface CalendarUrlState {
  view: CalendarView | null;
  rawView: string | null;
  date: Date | null;
}

export function isCalendarDate(value: string | null | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parse(value, dateFormat, new Date(0));
  return isValid(date) && format(date, dateFormat) === value;
}

export function parseCalendarUrlState(url: string | URLSearchParams): CalendarUrlState {
  const params = typeof url === "string" ? new URL(url, "http://calendar.local").searchParams : url;
  const rawView = params.get("view");
  const dateValue = params.get("date");
  const date = isCalendarDate(dateValue) ? startOfDay(parse(dateValue ?? "", dateFormat, new Date(0))) : null;
  const view = rawView === "month" || rawView === "week" || rawView === "day" ? rawView : null;
  return { view, rawView, date };
}

export function formatCalendarUrlDate(date: Date): string {
  return format(date, dateFormat);
}

export function calendarPreferenceKey(scope: "public" | "admin"): string {
  return `wat-calendar-view:${scope}`;
}
