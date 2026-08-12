export type CalendarView = "month" | "week" | "day";

export interface CalendarRange {
  /** Inclusive visible calendar-day bounds used by the feed query. */
  startDate: string;
  endDate: string;
}

export interface CalendarEventBase {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  resourceId?: string;
}

export interface CalendarEvent<TMeta = Record<string, never>>
  extends CalendarEventBase {
  meta: TMeta;
}

export type CalendarEventLike<TMeta = unknown> = CalendarEventBase & {
  meta?: TMeta;
};

export interface CalendarResource {
  id: string;
  title: string;
  color?: string;
}
