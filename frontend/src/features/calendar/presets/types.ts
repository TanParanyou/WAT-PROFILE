import type { CalendarView } from "../core/types";

export type CalendarViewMode = "monthGrid" | "agenda" | "timeGrid";

export interface CalendarPreset {
  id: "discovery" | "planning";
  defaultView: CalendarView;
  enabledViews: readonly CalendarView[];
  viewModes: Record<CalendarView, CalendarViewMode>;
}
