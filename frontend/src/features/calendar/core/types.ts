export type CalendarView = "month" | "week" | "day";

export interface CalendarRange {
  /** Inclusive visible calendar-day bounds used by the feed query. */
  startDate: string;
  endDate: string;
}

export interface CalendarEventBase {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  /** Compatibility alias for consumers that only support one resource. */
  resourceId?: string;
  /** Stable resource IDs assigned to this event. */
  resourceIds?: readonly string[];
}

export interface CalendarEvent<TMeta = Record<string, never>>
  extends CalendarEventBase {
  meta: TMeta;
}

export type CalendarEventLike<TMeta = unknown> = CalendarEventBase & {
  meta?: TMeta;
};

export interface CalendarResource<TMeta = unknown> {
  id: string;
  title: string;
  color?: string;
  group?: string;
  meta?: TMeta;
}

export const DEFAULT_RESOURCE_ID = "default";

export function getCalendarEventResourceIds(event: CalendarEventLike): readonly string[] {
  const values = event.resourceIds?.length
    ? event.resourceIds
    : event.resourceId
      ? [event.resourceId]
      : [];

  return [...new Set(values.filter((id) => id.trim().length > 0))];
}
