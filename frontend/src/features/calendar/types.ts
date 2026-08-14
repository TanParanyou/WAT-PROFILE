import type { CalendarEventBase, CalendarRange, CalendarResource } from "./core/types";

export type {
  CalendarRange,
  CalendarResource,
  CalendarView,
} from "./core/types";

export type CalendarScope = "public" | "admin";

export type CalendarLocale = "th" | "en" | "de";

export interface CalendarEntry extends CalendarEventBase {
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

export interface CalendarFeed {
  scope: CalendarScope;
  locale: CalendarLocale;
  timezone: "Europe/Berlin";
  range: CalendarRange;
  entries: readonly CalendarEntry[];
  resources: readonly CalendarResource[];
}
