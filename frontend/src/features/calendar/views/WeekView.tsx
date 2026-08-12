"use client";

import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import type { CalendarController } from "../useCalendar";
import type { CalendarEntry } from "../types";
import { getCalendarDays } from "./calendar-view-utils";
import { TimeGrid } from "./TimeGrid";

interface WeekViewProps {
  controller: CalendarController;
  entries: readonly CalendarEntry[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: CalendarEntry) => void;
}

export function WeekView({ controller, entries, labels, variant, onEntryActivate }: WeekViewProps) {
  const days = getCalendarDays(controller.visibleRange);

  return (
    <>
      <div className="hidden md:block">
        <TimeGrid days={days} entries={entries} labels={labels} variant={variant} onEntryActivate={onEntryActivate} showDayHeaders selectedDate={controller.selectedDate} onDaySelect={controller.selectDate} />
      </div>
      <div className="md:hidden">
        <TimeGrid days={[controller.selectedDate]} entries={entries} labels={labels} variant={variant} onEntryActivate={onEntryActivate} showDayHeaders selectedDate={controller.selectedDate} onDaySelect={controller.selectDate} />
      </div>
    </>
  );
}
