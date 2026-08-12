export type CalendarView = "month" | "week" | "day";

export interface CalendarRange {
  /** Inclusive visible calendar-day bounds used by the feed query. */
  startDate: string;
  endDate: string;
}

export interface CalendarEvent<TMeta = Record<string, never>> {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  resourceId?: string;
  meta: TMeta;
}

export interface CalendarResource {
  id: string;
  title: string;
  color?: string;
}
