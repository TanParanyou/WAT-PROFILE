"use client";

import type { CalendarController } from "../useCalendar";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import type { CalendarEntry } from "../types";
import { TimeGrid } from "./TimeGrid";

interface DayViewProps {
  controller: CalendarController;
  entries: readonly CalendarEntry[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: CalendarEntry) => void;
}

export function DayView({ controller, entries, labels, variant, onEntryActivate }: DayViewProps) {
  return <TimeGrid days={[controller.selectedDate]} entries={entries} labels={labels} variant={variant} onEntryActivate={onEntryActivate} showDayHeaders selectedDate={controller.selectedDate} onDaySelect={controller.selectDate} />;
}
