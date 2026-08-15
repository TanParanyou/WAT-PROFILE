"use client";

import type { ReactNode } from "react";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import type { CalendarEventLike } from "../core/types";
import { entriesOnDay, formatCalendarDate } from "../views/calendar-view-utils";
import { CalendarEventRow } from "./CalendarEventRow";

export interface SelectedDateAgendaProps<TEvent extends CalendarEventLike> {
  selectedDate: Date;
  entries: readonly TEvent[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: TEvent) => void;
  renderEvent?: (event: TEvent, density: "row") => ReactNode;
  formatTime?: (event: TEvent, date: string) => string | null;
  formatLocation?: (event: TEvent) => string | null;
  getEventClassName?: (event: TEvent, density: "row") => string;
  showTooltip?: boolean;
  renderTooltip?: (event: TEvent) => ReactNode;
}

export function SelectedDateAgenda<TEvent extends CalendarEventLike>({
  selectedDate,
  entries,
  labels,
  variant,
  onEntryActivate,
  renderEvent,
  formatTime = () => null,
  formatLocation = () => null,
  getEventClassName = () => "bg-current/5",
  showTooltip = true,
  renderTooltip,
}: SelectedDateAgendaProps<TEvent>) {
  const selectedDay = formatCalendarDate(selectedDate);
  const selectedEntries = entriesOnDay(entries, selectedDay);

  return (
    <section aria-labelledby="calendar-selected-date" data-calendar-selected-agenda className="border-t border-current/15 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="calendar-selected-date" className="text-sm font-semibold">{labels.selectedDateLabel(selectedDate)}</h3>
        <span className="text-xs opacity-70">{labels.eventsCount(selectedEntries.length)}</span>
      </div>
      <div className="mt-3 space-y-2">
        {selectedEntries.map((event) => (
          <CalendarEventRow
            key={event.id}
            event={event}
            date={selectedDay}
            formatTime={formatTime}
            formatLocation={formatLocation}
            onActivate={onEntryActivate}
            actionLabel={labels.eventDetails}
            className={getEventClassName(event, "row")}
            focusClassName={variant === "public" ? "focus-visible:outline-site-focus" : "focus-visible:outline-admin-focus"}
            renderEvent={(item) => renderEvent?.(item, "row")}
            showTooltip={showTooltip}
            renderTooltip={renderTooltip}
            variant={variant}
          />
        ))}
        {selectedEntries.length === 0 ? <p className="border border-current/15 p-4 text-sm opacity-70">{labels.noEventsOnDate}</p> : null}
      </div>
    </section>
  );
}
