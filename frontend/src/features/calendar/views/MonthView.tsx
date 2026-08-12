"use client";

import type { ReactNode } from "react";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import { calendarFocusClass } from "../calendar-theme";
import type { CalendarController } from "../useCalendar";
import type { CalendarEvent, CalendarResource } from "../core/types";
import { CalendarEventRow } from "../ui/CalendarEventRow";
import { entriesOnDay, formatCalendarDate, getCalendarDays } from "./calendar-view-utils";
import { buildMonthGrid, type MonthGridCell } from "./month-grid";

interface MonthViewProps<TMeta> {
  controller: CalendarController;
  entries: readonly CalendarEvent<TMeta>[];
  resources?: readonly CalendarResource[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: CalendarEvent<TMeta>) => void;
  renderEvent?: (event: CalendarEvent<TMeta>, density: "summary" | "row") => ReactNode;
  formatTime?: (event: CalendarEvent<TMeta>, date: string) => string | null;
  formatLocation?: (event: CalendarEvent<TMeta>) => string | null;
  eventClassName?: string;
  getEventClassName?: (
    event: CalendarEvent<TMeta>,
    density: "summary" | "row",
  ) => string;
}

function renderEventLabel<TMeta>(
  event: CalendarEvent<TMeta>,
  renderEvent: ((event: CalendarEvent<TMeta>, density: "summary" | "row") => ReactNode) | undefined,
  density: "summary" | "row",
): ReactNode {
  return renderEvent ? renderEvent(event, density) : event.title;
}

function MonthDayButton({
  cell,
  labels,
  variant,
  onSelect,
}: {
  cell: MonthGridCell;
  labels: CalendarLabels;
  variant: CalendarVariant;
  onSelect: (date: Date) => void;
}) {
  const eventSummary = labels.eventsCount(cell.entries.length + cell.overflowCount);

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.date)}
      aria-pressed={cell.isSelected}
      aria-label={`${labels.selectedDateLabel(cell.date)}, ${eventSummary}`}
      className={`flex min-h-12 w-full flex-col items-center justify-center gap-0.5 border-r border-b border-current/15 px-1 text-xs ${calendarFocusClass(variant)} ${cell.isSelected ? "bg-current/10 font-semibold" : ""} ${cell.isToday ? "underline decoration-2 underline-offset-2" : ""} ${cell.isOutsideCurrentMonth ? "opacity-45" : ""}`}
    >
      <span>{cell.date.getDate()}</span>
      {cell.entries.length + cell.overflowCount > 0 ? (
        <span className="inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-current/15 px-1 text-[0.65rem] leading-none" aria-hidden="true">
          {cell.entries.length + cell.overflowCount}
        </span>
      ) : null}
    </button>
  );
}

export function MonthView<TMeta>({
  controller,
  entries,
  labels,
  variant,
  onEntryActivate,
  renderEvent,
  formatTime = () => null,
  formatLocation = () => null,
  eventClassName = "bg-current/5",
  getEventClassName,
}: MonthViewProps<TMeta>) {
  const getEventClass = getEventClassName ?? (() => eventClassName);
  const days = getCalendarDays(controller.visibleRange);
  const grid = buildMonthGrid({
    days,
    entries,
    monthDate: controller.date,
    selectedDate: controller.selectedDate,
    today: new Date(),
    maxVisibleEntries: 2,
  });
  const weekdayDates = days.slice(0, 7);
  const selectedDay = formatCalendarDate(controller.selectedDate);
  const selectedEntries = entriesOnDay(entries, selectedDay);
  const renderSummary = (event: CalendarEvent<TMeta>) => (
    <span className="block truncate">{renderEventLabel(event, renderEvent, "summary")}</span>
  );

  return (
    <div className="space-y-4">
      <div className="hidden sm:block" aria-label="Month grid">
        <div className="grid grid-cols-7 border-l border-t border-current/15">
          {weekdayDates.map((day) => (
            <div key={`weekday-${day.getDay()}`} className="border-r border-b border-current/15 bg-current/5 px-2 py-2 text-xs font-semibold opacity-75">
              {labels.dayNames[day.getDay()] ?? ""}
            </div>
          ))}
          {grid.rows.flat().map((cell) => (
            <div key={cell.key} className={`min-h-28 border-r border-b border-current/15 p-2 ${cell.isSelected ? "bg-current/5" : ""} ${cell.isOutsideCurrentMonth ? "opacity-60" : ""}`}>
              <button
                type="button"
                onClick={() => controller.selectDate(cell.date)}
                aria-pressed={cell.isSelected}
                aria-label={labels.selectedDateLabel(cell.date)}
                className={`mb-2 min-h-11 min-w-11 px-2 text-left text-sm font-semibold focus-visible:outline-2 ${calendarFocusClass(variant)} ${cell.isToday ? "underline decoration-2 underline-offset-4" : ""}`}
              >
                <span className="block text-[0.7rem] font-normal opacity-60 sm:hidden">{labels.dayNames[cell.date.getDay()] ?? ""}</span>
                {cell.date.getDate()}
              </button>
              <div className="space-y-1">
                {cell.entries.map((event) => {
                  const time = formatTime(event, cell.key);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      title={event.title}
                      aria-label={event.title}
                      onClick={() => onEntryActivate(event)}
                      className={`flex min-h-8 w-full items-center overflow-hidden px-1.5 py-1 text-left text-xs leading-tight transition-colors focus-visible:outline-2 ${calendarFocusClass(variant)} ${getEventClass(event, "summary")}`}
                    >
                      {time && !event.allDay ? <span className="mr-1 font-medium shrink-0">{time.slice(0, 5)}</span> : null}
                      {renderSummary(event)}
                    </button>
                  );
                })}
                {cell.overflowCount > 0 ? <button type="button" onClick={() => controller.selectDate(cell.date)} className={`min-h-11 px-1 text-xs underline ${calendarFocusClass(variant)}`}>{labels.moreEvents(cell.overflowCount)}</button> : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 sm:hidden">
        <div className="border-l border-t border-current/15" aria-label="Month grid">
          <div className="grid grid-cols-7">
            {weekdayDates.map((day) => (
              <div key={`mobile-weekday-${day.getDay()}`} className="border-r border-b border-current/15 bg-current/5 px-1 py-2 text-center text-[0.65rem] font-semibold opacity-75">
                {labels.dayNames[day.getDay()]?.slice(0, 2) ?? ""}
              </div>
            ))}
            {grid.rows.flat().map((cell) => (
              <MonthDayButton key={cell.key} cell={cell} labels={labels} variant={variant} onSelect={controller.selectDate} />
            ))}
          </div>
        </div>
      </div>

      <section aria-labelledby="calendar-selected-date" className="border-t border-current/15 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="calendar-selected-date" className="text-sm font-semibold">{labels.selectedDateLabel(controller.selectedDate)}</h3>
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
              className={getEventClass(event, "row")}
              focusClassName={calendarFocusClass(variant)}
              renderEvent={(item) => renderEventLabel(item, renderEvent, "row")}
            />
          ))}
          {selectedEntries.length === 0 ? <p className="border border-current/15 p-4 text-sm opacity-70">{labels.noEventsOnDate}</p> : null}
        </div>
      </section>
    </div>
  );
}
