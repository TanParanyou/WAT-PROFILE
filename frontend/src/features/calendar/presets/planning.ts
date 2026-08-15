import type { CalendarPreset } from "./types";

export const planningPreset: CalendarPreset = {
  id: "planning",
  defaultView: "month",
  enabledViews: ["month", "week", "day"],
  viewModes: {
    month: "monthGrid",
    week: "timeline",
    day: "resourceDayGrid",
  },
  layouts: {
    desktop: { month: "monthGrid", week: "timeline", day: "resourceDayGrid" },
    mobile: { month: "monthAgenda", week: "dayStrip", day: "timeGrid" },
    mobileBreakpoint: 640,
  },
};
