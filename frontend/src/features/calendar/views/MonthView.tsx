"use client";

import { useState, type ReactNode } from "react";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import { calendarFocusClass } from "../calendar-theme";
import type { CalendarController } from "../useCalendar";
import type { CalendarEventLike, CalendarResource } from "../core/types";
import { CalendarTooltip } from "../ui/CalendarTooltip";
import { MonthDayPopover } from "../ui/MonthDayPopover";
import { entriesOnDay, getCalendarDays } from "./calendar-view-utils";
import { buildMonthGrid } from "./month-grid";
import { SelectedDateAgenda } from "../ui/SelectedDateAgenda";

export interface MonthViewProps<TEvent extends CalendarEventLike> {
  controller: CalendarController;
  entries: readonly TEvent[];
  resources?: readonly CalendarResource[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: TEvent) => void;
  renderEvent?: (event: TEvent, density: "summary" | "row") => ReactNode;
  formatTime?: (event: TEvent, date: string) => string | null;
  formatLocation?: (event: TEvent) => string | null;
  eventClassName?: string;
  getEventClassName?: (
    event: TEvent,
    density: "summary" | "row",
  ) => string;
  showTooltip?: boolean;
  renderTooltip?: (event: TEvent) => ReactNode;
  stickyHeader?: boolean;
  maxVisibleEvents?: number;
}

function renderEventLabel<TEvent extends CalendarEventLike>(
  event: TEvent,
  renderEvent: ((event: TEvent, density: "summary" | "row") => ReactNode) | undefined,
  density: "summary" | "row",
): ReactNode {
  return renderEvent ? renderEvent(event, density) : event.title;
}

export function MonthView<TEvent extends CalendarEventLike>({
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
  showTooltip = true,
  renderTooltip,
  stickyHeader = true,
  maxVisibleEvents = 2,
}: MonthViewProps<TEvent>) {
  const getEventClass = getEventClassName ?? (() => eventClassName);
  const days = getCalendarDays(controller.visibleRange);
  const grid = buildMonthGrid({
    days,
    entries,
    monthDate: controller.date,
    selectedDate: controller.selectedDate,
    today: new Date(),
    maxVisibleEntries: Math.max(1, Math.floor(maxVisibleEvents)),
  });
  const weekdayDates = days.slice(0, 7);
  const renderSummary = (event: TEvent) => (
    <span className="block truncate">{renderEventLabel(event, renderEvent, "summary")}</span>
  );
  const bgClass = variant === "public" ? "bg-site-canvas" : "bg-admin-canvas";
  const [popoverState, setPopoverState] = useState<{
    date: Date;
    key: string;
    rect: DOMRect;
  } | null>(null);

  return (
    <div className="space-y-4">
      <div className="hidden sm:block" aria-label="Month grid" role="grid">
        <div className={`grid grid-cols-7 border-l border-t border-current/15 ${stickyHeader ? `sticky top-0 z-10 ${bgClass}` : ""}`}>
          {weekdayDates.map((day) => (
            <div key={`weekday-${day.getDay()}`} role="columnheader" className="border-r border-b border-current/15 bg-current/5 px-2 py-2 text-xs font-semibold opacity-75">
              {labels.dayNames[day.getDay()] ?? ""}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-current/15">
          {grid.rows.flat().map((cell) => (
            <div key={cell.key} role="gridcell" className={`min-h-28 border-r border-b border-current/15 p-2 ${cell.isSelected ? "bg-current/5" : ""} ${cell.isOutsideCurrentMonth ? "opacity-60" : ""}`}>
              <button
                type="button"
                onClick={() => controller.selectDate(cell.date)}
                aria-pressed={cell.isSelected}
                aria-label={labels.selectedDateLabel(cell.date)}
                className={`mb-2 min-h-11 min-w-11 px-2 text-left text-sm font-semibold focus-visible:outline-[3px] focus-visible:outline-offset-2 ${calendarFocusClass(variant)} ${cell.isToday ? "underline decoration-2 underline-offset-4" : ""}`}
              >
                <span className="block text-[0.7rem] font-normal opacity-60 sm:hidden">{labels.dayNames[cell.date.getDay()] ?? ""}</span>
                {cell.date.getDate()}
              </button>
              <div className="space-y-1">
                {cell.entries.map((event) => {
                  const time = formatTime(event, cell.key);
                  return (
                    <CalendarTooltip
                      key={event.id}
                      event={event}
                      variant={variant}
                      showTooltip={showTooltip}
                      renderTooltip={renderTooltip}
                      formatTime={(item) => formatTime(item, cell.key)}
                      formatLocation={formatLocation}
                    >
                      <button
                        type="button"
                        aria-label={event.title}
                        onClick={() => onEntryActivate(event)}
                        className={`flex min-h-11 w-full items-center overflow-hidden px-1.5 py-1 text-left text-xs leading-tight transition-colors focus-visible:outline-[3px] focus-visible:outline-offset-2 ${calendarFocusClass(variant)} ${getEventClass(event, "summary")}`}
                      >
                        {time && !event.allDay ? <span className="mr-1 font-medium shrink-0">{time.slice(0, 5)}</span> : null}
                        {renderSummary(event)}
                      </button>
                    </CalendarTooltip>
                  );
                })}
                {cell.overflowCount > 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      controller.selectDate(cell.date);
                      setPopoverState({
                        date: cell.date,
                        key: cell.key,
                        rect: e.currentTarget.getBoundingClientRect(),
                      });
                    }}
                    className={`min-h-11 px-1 text-xs underline focus-visible:outline-[3px] focus-visible:outline-offset-2 ${calendarFocusClass(variant)}`}
                  >
                    {labels.moreEvents(cell.overflowCount)}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SelectedDateAgenda
        selectedDate={controller.selectedDate}
        entries={entries}
        labels={labels}
        variant={variant}
        onEntryActivate={onEntryActivate}
        renderEvent={(event, density) => renderEventLabel(event, renderEvent, density)}
        formatTime={formatTime}
        formatLocation={formatLocation}
        getEventClassName={getEventClass}
        showTooltip={showTooltip}
        renderTooltip={renderTooltip}
      />

      {popoverState ? (
        <MonthDayPopover
          date={popoverState.date}
          dateKey={popoverState.key}
          entries={entriesOnDay(entries, popoverState.key)}
          targetRect={popoverState.rect}
          labels={labels}
          variant={variant}
          showTooltip={showTooltip}
          renderTooltip={renderTooltip}
          formatTime={formatTime}
          formatLocation={formatLocation}
          getEventClass={getEventClass}
          renderEventLabel={(item, density) => renderEventLabel(item, renderEvent, density)}
          onEntryActivate={onEntryActivate}
          onClose={() => setPopoverState(null)}
        />
      ) : null}
    </div>
  );
}
