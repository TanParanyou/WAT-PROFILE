export { Calendar, type CalendarProps } from "./Calendar";
export { resolveCalendarConfig, type CalendarConfig, type CalendarConfigInput } from "./config";
export { useCalendar, createCalendarState, type CalendarController, type UseCalendarOptions } from "./useCalendar";
export type { CalendarEvent, CalendarEventBase, CalendarEventLike, CalendarRange, CalendarResource, CalendarView } from "./core/types";
export type { CalendarPreset } from "./presets/types";
export { discoveryPreset } from "./presets/discovery";
export { planningPreset } from "./presets/planning";
