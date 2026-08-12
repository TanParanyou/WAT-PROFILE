export type CalendarView = "calendar" | "list";

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
  viewDayGrid?: string;
  viewTimeline?: string;
  loading?: string;
  refreshing?: string;
  retry?: string;
  empty?: string;
  error?: string;
  periodLabel?: (date: Date, view: string) => string;
}
