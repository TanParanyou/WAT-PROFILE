"use client";

import type { CSSProperties } from "react";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import { buildTimedColumns, groupEntriesByResource } from "../layout";
import type { CalendarController } from "../useCalendar";
import type { CalendarEntry, CalendarResource } from "../types";
import { CalendarEntryButton } from "./CalendarEntryButton";
import { entriesOnDay, formatCalendarDate, getTimedPosition } from "./calendar-view-utils";

interface TimelineViewProps {
  controller: CalendarController;
  entries: readonly CalendarEntry[];
  resources: readonly CalendarResource[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: CalendarEntry) => void;
}

export function TimelineView({ controller, entries, resources, variant, onEntryActivate }: TimelineViewProps) {
  const day = formatCalendarDate(controller.selectedDate);
  const dayEntries = entriesOnDay(entries, day);
  const lanes = groupEntriesByResource(dayEntries, resources);
  const timedEntries = dayEntries.filter((entry) => !entry.allDay);
  const columns = buildTimedColumns(timedEntries);

  return (
    <div className="overflow-x-auto border border-current/15">
      <div className="min-w-[960px]">
        <div className="grid grid-cols-[minmax(9rem,20%)_1fr] border-b border-current/15 text-xs opacity-70">
          <div className="border-r border-current/15 p-2">Resource</div>
          <div className="grid grid-cols-12 p-2">{Array.from({ length: 12 }, (_, index) => <span key={index}>{String(index * 2).padStart(2, "0")}:00</span>)}</div>
        </div>
        {[...lanes].map(([resourceId, laneEntries]) => (
          <div key={resourceId} className="grid min-h-24 grid-cols-[minmax(9rem,20%)_1fr] border-b border-current/15 last:border-b-0">
            <div className="border-r border-current/15 bg-current/5 p-3 text-sm font-semibold">{resources.find((resource) => resource.id === resourceId)?.title ?? resourceId}</div>
            <div className="relative min-h-24 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px)] bg-[length:8.3333%_100%]">
              {laneEntries.map((entry) => {
                if (entry.allDay) return <div key={entry.id} className="absolute inset-x-1 top-1"><CalendarEntryButton entry={entry} variant={variant} onActivate={onEntryActivate} compact /></div>;
                const layout = columns.get(entry.id) ?? { column: 0, columnCount: 1 };
                const position = getTimedPosition(entry, day);
                const style: CSSProperties = {
                  left: `${(position.startMinutes / 1440) * 100}%`,
                  width: `${((position.endMinutes - position.startMinutes) / 1440) * 100}%`,
                  top: `${layout.column * 2.1}rem`,
                };
                return <div key={entry.id} className="absolute min-w-12" style={style}><CalendarEntryButton entry={entry} variant={variant} onActivate={onEntryActivate} compact /></div>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
