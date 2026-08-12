"use client";

import type { CalendarController } from "../useCalendar";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import type { CalendarEntry, CalendarResource } from "../types";
import { formatCalendarDate } from "./calendar-view-utils";
import { TimeGrid } from "./TimeGrid";

interface DayViewProps {
  controller: CalendarController;
  entries: readonly CalendarEntry[];
  resources: readonly CalendarResource[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: CalendarEntry) => void;
}

export function DayView({ controller, entries, variant, onEntryActivate }: DayViewProps) {
  return <div className="overflow-x-auto"><TimeGrid day={formatCalendarDate(controller.selectedDate)} entries={entries} variant={variant} onEntryActivate={onEntryActivate} /></div>;
}
