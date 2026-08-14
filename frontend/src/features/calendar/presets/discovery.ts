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
};
