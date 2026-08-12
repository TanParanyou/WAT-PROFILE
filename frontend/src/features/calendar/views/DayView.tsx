"use client";

import type { CalendarController } from "../useCalendar";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarEntry, CalendarResource } from "../types";
import { formatCalendarDate } from "./calendar-view-utils";
import { TimeGrid } from "./TimeGrid";

interface DayViewProps {
  controller: CalendarController;
  entries: readonly CalendarEntry[];
  resources: readonly CalendarResource[];
  labels: CalendarLabels;
  onEntryActivate: (entry: CalendarEntry) => void;
}

export function DayView({ controller, entries, onEntryActivate }: DayViewProps) {
  return <TimeGrid day={formatCalendarDate(controller.selectedDate)} entries={entries} onEntryActivate={onEntryActivate} />;
}
