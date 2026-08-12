export type CalendarView = "month" | "week" | "day" | "dayGrid" | "timeline";

export type CalendarScope = "public" | "admin";

export type CalendarLocale = "th" | "en" | "de";

export interface CalendarRange {
  /** Inclusive visible calendar-day bounds used by the feed query. */
  startDate: string;
  endDate: string;
}

export interface CalendarEntry {
  id: string;
  source: "event" | string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  resourceId?: string;
  status: "active" | "inactive";
  display: {
    tone: "default" | "muted" | "warning";
  };
  detail: {
    href?: string;
    editorHref?: string;
    canEdit: boolean;
    description?: string;
    location?: string;
  };
}

export interface CalendarResource {
  id: string;
  title: string;
  color?: string;
}

export interface CalendarFeed {
  scope: CalendarScope;
  locale: CalendarLocale;
  timezone: "Europe/Berlin";
  range: CalendarRange;
  entries: readonly CalendarEntry[];
  resources: readonly CalendarResource[];
}
