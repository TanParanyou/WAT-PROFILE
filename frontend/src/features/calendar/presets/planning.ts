import type { CalendarPreset } from "./types";

export const planningPreset: CalendarPreset = {
  id: "planning",
  defaultView: "month",
  enabledViews: ["month", "week", "day"],
  viewModes: {
    month: "monthGrid",
    week: "timeGrid",
    day: "timeGrid",
  },
};
