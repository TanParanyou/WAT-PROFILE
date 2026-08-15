import type { CalendarPreset } from "./types";

export const discoveryPreset: CalendarPreset = {
  id: "discovery",
  defaultView: "month",
  enabledViews: ["month", "week", "day"],
  viewModes: {
    month: "monthGrid",
    week: "timeGrid",
    day: "timeGrid",
  },
  layouts: {
    desktop: { month: "monthGrid", week: "timeGrid", day: "timeGrid" },
    mobile: { month: "monthAgenda", week: "dayStrip", day: "timeGrid" },
    mobileBreakpoint: 640,
  },
};
