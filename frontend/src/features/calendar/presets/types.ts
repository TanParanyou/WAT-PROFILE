import type { CalendarView } from "../core/types";

export type CalendarViewMode =
  | "monthGrid"
  | "agenda"
  | "timeGrid"
  | "timeline"
  | "resourceDayGrid";

export type CalendarLayout = CalendarViewMode | "monthAgenda" | "dayStrip";

export interface CalendarResponsiveLayoutsInput {
  desktop?: Partial<Record<CalendarView, CalendarLayout>>;
  mobile?: Partial<Record<CalendarView, CalendarLayout>>;
  mobileBreakpoint?: number;
}

export interface CalendarResponsiveLayouts {
  desktop: Record<CalendarView, CalendarLayout>;
  mobile: Record<CalendarView, CalendarLayout>;
  mobileBreakpoint: number;
}

export interface CalendarPreset {
  id: "discovery" | "planning";
  defaultView: CalendarView;
  enabledViews: readonly CalendarView[];
  viewModes: Record<CalendarView, CalendarViewMode>;
  layouts?: CalendarResponsiveLayoutsInput;
}
