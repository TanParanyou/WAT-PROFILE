"use client";

import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import { groupEntriesByResource } from "../layout";
import type { CalendarController } from "../useCalendar";
import type { CalendarEntry, CalendarResource } from "../types";
import { CalendarEntryButton } from "./CalendarEntryButton";
import { entriesOnDay, formatCalendarDate } from "./calendar-view-utils";

interface DayGridViewProps {
  controller: CalendarController;
  entries: readonly CalendarEntry[];
  resources: readonly CalendarResource[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: CalendarEntry) => void;
}

export function DayGridView({ controller, entries, resources, variant, onEntryActivate }: DayGridViewProps) {
  const day = formatCalendarDate(controller.selectedDate);
  const lanes = groupEntriesByResource(entriesOnDay(entries, day).filter((entry) => entry.allDay), resources);

  return (
    <div className="overflow-x-auto border border-current/15">
      {[...lanes].map(([resourceId, laneEntries]) => (
        <div key={resourceId} className="grid min-h-20 grid-cols-[minmax(9rem,20%)_1fr] border-b border-current/15 last:border-b-0">
          <div className="border-r border-current/15 bg-current/5 p-3 text-sm font-semibold">{resources.find((resource) => resource.id === resourceId)?.title ?? resourceId}</div>
          <div className="space-y-1 p-2">{laneEntries.map((entry) => <CalendarEntryButton key={entry.id} entry={entry} variant={variant} onActivate={onEntryActivate} />)}</div>
        </div>
      ))}
    </div>
  );
}
