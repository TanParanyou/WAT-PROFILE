export { Calendar, type CalendarProps } from "./Calendar";
export { resolveCalendarConfig, type CalendarConfig, type CalendarConfigInput } from "./config";
export { useCalendar, createCalendarState, type CalendarController, type UseCalendarOptions } from "./useCalendar";
export type { CalendarLabels } from "./calendar-copy";
export {
  DEFAULT_RESOURCE_ID,
  getCalendarEventResourceIds,
  type CalendarEvent,
  type CalendarEventBase,
  type CalendarEventLike,
  type CalendarRange,
  type CalendarResource,
  type CalendarView,
} from "./core/types";
export type {
  CalendarLayout,
  CalendarPreset,
  CalendarResponsiveLayouts,
  CalendarResponsiveLayoutsInput,
} from "./presets/types";
export { discoveryPreset } from "./presets/discovery";
export { planningPreset } from "./presets/planning";
