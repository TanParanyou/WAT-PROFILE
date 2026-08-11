export type CalendarView = "calendar" | "list";

export interface CalendarLabels {
  previousMonth: string;
  nextMonth: string;
  today: string;
  moreEvents: (count: number) => string;
  noEventsOnDate: string;
  calendarInstructions: string;
  dayNames: readonly string[];
}
