import type { EventsView } from "@/features/public/settings/types";

export const EVENTS_VIEW_STORAGE_KEY = "wat-profile:events-view";

function isEventsView(value: unknown): value is EventsView {
  return value === "calendar" || value === "list";
}

export function resolveEventsView(
  saved: unknown,
  defaultView: unknown,
): EventsView {
  if (isEventsView(saved)) return saved;
  if (isEventsView(defaultView)) return defaultView;
  return "calendar";
}
