import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarRange, CalendarView } from "./types";

const dateFormat = "yyyy-MM-dd";

function toRange(start: Date, end: Date): CalendarRange {
  return {
    startDate: format(start, dateFormat),
    endDate: format(end, dateFormat),
  };
}

export function getVisibleRange(
  date: Date,
  view: CalendarView,
  weekStartsOn: 0 | 1,
): CalendarRange {
  const day = startOfDay(date);

  if (view === "month") {
    return toRange(
      startOfWeek(startOfMonth(day), { weekStartsOn }),
      endOfWeek(endOfMonth(day), { weekStartsOn }),
    );
  }

  if (view === "week") {
    return toRange(
      startOfWeek(day, { weekStartsOn }),
      endOfWeek(day, { weekStartsOn }),
    );
  }

  return toRange(day, day);
}

export function getViewStep(view: CalendarView): "month" | "week" | "day" {
  return view;
}

export function shiftCalendarDate(
  date: Date,
  view: CalendarView,
  direction: -1 | 1,
): Date {
  if (view === "month") return addMonths(date, direction);
  if (view === "week") return addWeeks(date, direction);
  return addDays(date, direction);
}
