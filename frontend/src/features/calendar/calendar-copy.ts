import type { CalendarRange, CalendarView } from "./types";

export interface CalendarLabels {
  previousMonth: string;
  nextMonth: string;
  today: string;
  moreEvents: (count: number) => string;
  eventsCount: (count: number) => string;
  noEventsOnDate: string;
  calendarInstructions: string;
  dayNames: readonly string[];
  previous?: string;
  next?: string;
  viewMonth?: string;
  viewWeek?: string;
  viewDay?: string;
  allDay: string;
  timedEvents: string;
  selectedDateLabel: (date: Date) => string;
  formatDayHeader: (date: Date, options: { includeWeekday: boolean }) => string;
  formatTime: (minutes: number) => string;
  loading?: string;
  refreshing?: string;
  retry?: string;
  empty?: string;
  error?: string;
  periodLabel: (date: Date, visibleRange: CalendarRange, view: CalendarView) => string;
}
