"use client";

import type { CSSProperties, ReactNode } from "react";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import { buildTimedColumns, groupEntriesByResource } from "../layout";
import { DEFAULT_RESOURCE_ID, type CalendarEventLike, type CalendarResource } from "../core/types";
import type { CalendarController } from "../useCalendar";
import { CalendarEntryButton } from "./CalendarEntryButton";
import { entriesOnDay, formatCalendarDate, getTimedPositionWithinWindow } from "./calendar-view-utils";

export interface TimelineViewProps<TEvent extends CalendarEventLike> {
  controller: CalendarController;
  entries: readonly TEvent[];
  resources: readonly CalendarResource[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: TEvent) => void;
  renderEvent?: (event: TEvent, density: "summary" | "row" | "timeGrid") => ReactNode;
  getEventClassName?: (event: TEvent, density: "summary" | "row" | "timeGrid") => string;
  formatEventTime?: (event: TEvent, date: string) => string | null;
  minMinutes: number;
  maxMinutes: number;
  stickyHeader?: boolean;
}

function getTimelineMarkers(minMinutes: number, maxMinutes: number): number[] {
  const markerCount = 6;
  const interval = (maxMinutes - minMinutes) / markerCount;
  return Array.from({ length: markerCount + 1 }, (_, index) => Math.round(minMinutes + (interval * index)));
}

export function TimelineView<TEvent extends CalendarEventLike>({
  controller,
  entries,
  resources,
  labels,
  variant,
  onEntryActivate,
  renderEvent,
  getEventClassName,
  formatEventTime,
  minMinutes,
  maxMinutes,
  stickyHeader = true,
}: TimelineViewProps<TEvent>) {
  const day = formatCalendarDate(controller.selectedDate);
  const dayEntries = entriesOnDay(entries, day);
  const lanes = groupEntriesByResource(dayEntries, resources);
  const markers = getTimelineMarkers(minMinutes, maxMinutes);
  const markerStyle = (minute: number): CSSProperties => ({ left: `${((minute - minMinutes) / (maxMinutes - minMinutes)) * 100}%` });
  const formatTime = (entry: TEvent) => formatEventTime?.(entry, day) ?? (entry.allDay ? labels.allDay : `${entry.start.slice(11, 16)}–${entry.end.slice(11, 16)}`);

  return (
    <div className="space-y-2">
      {labels.scrollHorizontally ? <p className="text-xs opacity-70" role="note">{labels.scrollHorizontally}</p> : null}
      <div className="overflow-x-auto border border-current/15" role="grid" aria-label={labels.calendarInstructions}>
        <div className="min-w-[960px]">
          <div className={`grid grid-cols-[minmax(9rem,20%)_1fr] border-b border-current/15 text-xs opacity-70 ${stickyHeader ? "sticky top-0 z-10 bg-current/5" : ""}`} role="row">
            <div className="border-r border-current/15 p-2" role="columnheader">{labels.resourceLabel ?? labels.calendarInstructions}</div>
            <div className="relative p-2" role="columnheader">
              {markers.map((minute) => <span key={minute} className="absolute -translate-x-1/2" style={markerStyle(minute)}>{labels.formatTime(minute)}</span>)}
            </div>
          </div>
          {lanes.size === 0 ? <p className="p-4 text-sm opacity-70">{labels.noEventsOnDate}</p> : null}
          {[...lanes].map(([resourceId, laneEntries]) => {
            const columns = buildTimedColumns(laneEntries);
            const resource = resources.find((item) => item.id === resourceId);
            return (
              <div key={resourceId} className="grid min-h-24 grid-cols-[minmax(9rem,20%)_1fr] border-b border-current/15 last:border-b-0" role="row">
                <div className="border-r border-current/15 bg-current/5 p-3 text-sm font-semibold" role="rowheader">{resource?.title ?? (resourceId === DEFAULT_RESOURCE_ID ? labels.unassignedResource : resourceId)}</div>
                <div className="relative min-h-24" role="gridcell">
                  {markers.slice(0, -1).map((minute) => <span key={minute} aria-hidden="true" className="absolute inset-y-0 border-l border-current/10" style={markerStyle(minute)} />)}
                  {laneEntries.map((entry) => {
                    if (entry.allDay) {
                      return <div key={entry.id} className="absolute inset-x-1 top-1"><CalendarEntryButton entry={entry} variant={variant} onActivate={onEntryActivate} compact renderEvent={(item) => renderEvent?.(item, "row")} formatTime={formatTime} toneClassName={getEventClassName?.(entry, "row")} /></div>;
                    }
                    const position = getTimedPositionWithinWindow(entry, day, minMinutes, maxMinutes);
                    if (!position) return null;
                    const layout = columns.get(entry.id) ?? { column: 0, columnCount: 1 };
                    const style: CSSProperties = {
                      left: `calc(${((position.startMinutes - minMinutes) / (maxMinutes - minMinutes)) * 100}% + 2px)`,
                      width: `calc(${((position.endMinutes - position.startMinutes) / (maxMinutes - minMinutes)) * 100}% - 4px)`,
                      top: `${layout.column * 2.1}rem`,
                    };
                    return <div key={entry.id} className="absolute min-w-12" style={style}><CalendarEntryButton entry={entry} variant={variant} onActivate={onEntryActivate} compact renderEvent={(item) => renderEvent?.(item, "timeGrid")} formatTime={formatTime} toneClassName={getEventClassName?.(entry, "timeGrid")} /></div>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
