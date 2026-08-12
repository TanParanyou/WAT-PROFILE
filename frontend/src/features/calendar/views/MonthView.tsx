"use client";

import { isSameDay } from "date-fns";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import { getCalendarOverflowCount } from "../layout";
import type { CalendarController } from "../useCalendar";
import type { CalendarEntry, CalendarResource } from "../types";
import { CalendarEntryButton } from "./CalendarEntryButton";
import { entriesOnDay, formatCalendarDate, getCalendarDays } from "./calendar-view-utils";

interface MonthViewProps {
  controller: CalendarController;
  entries: readonly CalendarEntry[];
  resources: readonly CalendarResource[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: CalendarEntry) => void;
}

export function MonthView({ controller, entries, labels, variant, onEntryActivate }: MonthViewProps) {
  const days = getCalendarDays(controller.visibleRange);
  const selectedDay = formatCalendarDate(controller.selectedDate);

  return (
    <div className="space-y-4">
      <div className="hidden grid-cols-7 border-l border-t border-current/15 sm:grid" aria-label="Month grid">
        {days.map((day, index) => {
          const key = formatCalendarDate(day);
          const dayEntries = entriesOnDay(entries, key);
          const visibleEntries = dayEntries.slice(0, 3);
          const overflow = getCalendarOverflowCount(dayEntries.length, visibleEntries.length);
          return (
            <div key={key} className={`min-h-28 border-b border-r border-current/15 p-2 ${isSameDay(day, controller.selectedDate) ? "bg-current/5" : ""}`}>
              <button
                type="button"
                onClick={() => controller.selectDate(day)}
                aria-pressed={key === selectedDay}
                className={`mb-2 min-h-11 min-w-11 px-2 text-left text-sm font-semibold focus-visible:outline-2 ${variant === "public" ? "focus-visible:outline-site-focus" : "focus-visible:outline-admin-focus"}`}
              >
                <span className="block text-[0.7rem] font-normal opacity-60">{labels.dayNames[index % 7] ?? ""}</span>
                {day.getDate()}
              </button>
              <div className="space-y-1">
                {visibleEntries.map((entry) => <CalendarEntryButton key={entry.id} entry={entry} variant={variant} onActivate={onEntryActivate} compact />)}
                {overflow > 0 ? <button type="button" onClick={() => controller.selectDate(day)} className="min-h-11 px-1 text-xs underline">{labels.moreEvents(overflow)}</button> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="sm:hidden space-y-2">
        <p className="text-sm font-semibold">{selectedDay}</p>
        {entriesOnDay(entries, selectedDay).map((entry) => <CalendarEntryButton key={entry.id} entry={entry} variant={variant} onActivate={onEntryActivate} />)}
        {entriesOnDay(entries, selectedDay).length === 0 ? <p className="border border-current/15 p-4 text-sm opacity-70">{labels.noEventsOnDate}</p> : null}
      </div>
    </div>
  );
}
