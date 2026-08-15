"use client";

import type { ReactNode } from "react";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import { groupEntriesByResource } from "../layout";
import { DEFAULT_RESOURCE_ID, type CalendarEventLike, type CalendarResource } from "../core/types";
import type { CalendarController } from "../useCalendar";
import { CalendarEntryButton } from "./CalendarEntryButton";
import { entriesOnDay, formatCalendarDate } from "./calendar-view-utils";

export interface DayGridViewProps<TEvent extends CalendarEventLike> {
  controller: CalendarController;
  entries: readonly TEvent[];
  resources: readonly CalendarResource[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: TEvent) => void;
  renderEvent?: (event: TEvent, density: "summary" | "row" | "timeGrid") => ReactNode;
  getEventClassName?: (event: TEvent, density: "summary" | "row" | "timeGrid") => string;
  formatEventTime?: (event: TEvent, date: string) => string | null;
}

export function DayGridView<TEvent extends CalendarEventLike>({
  controller,
  entries,
  resources,
  labels,
  variant,
  onEntryActivate,
  renderEvent,
  getEventClassName,
  formatEventTime,
}: DayGridViewProps<TEvent>) {
  const day = formatCalendarDate(controller.selectedDate);
  const lanes = groupEntriesByResource(entriesOnDay(entries, day), resources);
  const formatTime = (entry: TEvent) => formatEventTime?.(entry, day) ?? (entry.allDay ? labels.allDay : `${entry.start.slice(11, 16)}–${entry.end.slice(11, 16)}`);

  return (
    <div className="space-y-2">
      {labels.scrollHorizontally ? <p className="text-xs opacity-70" role="note">{labels.scrollHorizontally}</p> : null}
      {lanes.size === 0 ? <p className="border border-current/15 p-4 text-sm opacity-70">{labels.noEventsOnDate}</p> : null}
      <div className="overflow-x-auto border border-current/15" role="grid" aria-label={labels.calendarInstructions}>
        {[...lanes].map(([resourceId, laneEntries]) => (
          <div key={resourceId} className="grid min-h-20 min-w-[28rem] grid-cols-[minmax(9rem,20%)_1fr] border-b border-current/15 last:border-b-0" role="row">
            <div className="border-r border-current/15 bg-current/5 p-3 text-sm font-semibold" role="rowheader">{resources.find((resource) => resource.id === resourceId)?.title ?? (resourceId === DEFAULT_RESOURCE_ID ? labels.unassignedResource : resourceId)}</div>
            <div className="space-y-1 p-2" role="gridcell">
              {laneEntries.map((entry) => <CalendarEntryButton key={entry.id} entry={entry} variant={variant} onActivate={onEntryActivate} renderEvent={(item) => renderEvent?.(item, "row")} formatTime={formatTime} toneClassName={getEventClassName?.(entry, "row")} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
