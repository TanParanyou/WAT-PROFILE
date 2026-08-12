"use client";

import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import type { CalendarController } from "../useCalendar";
import type { CalendarEntry, CalendarResource } from "../types";
import { CalendarEntryButton } from "./CalendarEntryButton";
import { entriesOnDay, formatCalendarDate, getCalendarDays } from "./calendar-view-utils";
import { TimeGrid } from "./TimeGrid";

interface WeekViewProps {
  controller: CalendarController;
  entries: readonly CalendarEntry[];
  resources: readonly CalendarResource[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: CalendarEntry) => void;
}

export function WeekView({ controller, entries, labels, variant, onEntryActivate }: WeekViewProps) {
  const days = getCalendarDays(controller.visibleRange);
  const selectedDay = formatCalendarDate(controller.selectedDate);

  return (
    <div>
      <div className="hidden overflow-x-auto pb-3 md:block">
        <div className="grid min-w-[960px] grid-cols-7 gap-3">
        {days.map((day, index) => {
          const key = formatCalendarDate(day);
          const allDay = entriesOnDay(entries, key).filter((entry) => entry.allDay);
          return (
            <div key={key} className="min-w-0">
              <button type="button" onClick={() => controller.selectDate(day)} className={`min-h-11 w-full border-b border-current/15 pb-2 text-left text-sm font-semibold focus-visible:outline-2 ${variant === "public" ? "focus-visible:outline-site-focus" : "focus-visible:outline-admin-focus"}`}>
                {labels.dayNames[index % 7] ?? ""} {day.getDate()}
              </button>
              <div className="min-h-14 py-1">{allDay.map((entry) => <CalendarEntryButton key={entry.id} entry={entry} variant={variant} onActivate={onEntryActivate} compact />)}</div>
            </div>
          );
        })}
        </div>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <div className="grid min-w-[960px] grid-cols-7 gap-3">
          {days.map((day) => <TimeGrid key={formatCalendarDate(day)} day={formatCalendarDate(day)} entries={entries} variant={variant} onEntryActivate={onEntryActivate} showHeader={false} />)}
        </div>
      </div>
      <div className="overflow-x-auto md:hidden">
        <TimeGrid day={selectedDay} entries={entries} variant={variant} onEntryActivate={onEntryActivate} />
      </div>
    </div>
  );
}
