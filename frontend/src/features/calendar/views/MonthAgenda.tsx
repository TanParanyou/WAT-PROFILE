"use client";

import type { CalendarLabels } from "../calendar-copy";
import { calendarFocusClass, type CalendarVariant } from "../calendar-theme";
import { SelectedDateAgenda } from "../ui/SelectedDateAgenda";
import type { CalendarController } from "../useCalendar";
import type { CalendarEventLike } from "../core/types";
import { buildMonthGrid, type MonthGridCell } from "./month-grid";
import { formatCalendarDate, getCalendarDays } from "./calendar-view-utils";
import type { MonthViewProps } from "./MonthView";

function MonthAgendaDayButton({
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
  const eventCount = cell.entries.length + cell.overflowCount;

  return (
    <div role="gridcell" className="border-r border-b border-current/15">
      <button
        type="button"
        onClick={() => onSelect(cell.date)}
        aria-pressed={cell.isSelected}
        aria-label={`${labels.selectedDateLabel(cell.date)}, ${labels.eventsCount(eventCount)}`}
        className={`flex min-h-12 w-full flex-col items-center justify-center gap-0.5 px-1 text-xs focus-visible:outline-[3px] focus-visible:outline-offset-2 ${calendarFocusClass(variant)} ${cell.isSelected ? "bg-current/10 font-semibold" : ""} ${cell.isToday ? "underline decoration-2 underline-offset-2" : ""} ${cell.isOutsideCurrentMonth ? "opacity-45" : ""}`}
      >
        <span>{cell.date.getDate()}</span>
        {eventCount > 0 ? <span className="inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-current/15 px-1 text-[0.65rem] leading-none" aria-hidden="true">{eventCount}</span> : null}
      </button>
    </div>
  );
}

export function MonthAgenda<TEvent extends CalendarEventLike>({
  controller,
  entries,
  labels,
  variant,
  onEntryActivate,
  renderEvent,
  formatTime = () => null,
  formatLocation = () => null,
  getEventClassName,
  showTooltip = true,
  renderTooltip,
  maxVisibleEvents = 2,
}: MonthViewProps<TEvent>) {
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

  return (
    <div data-calendar-month-agenda className="space-y-4">
      <div className="border-l border-t border-current/15" aria-label="Month grid" role="grid">
        <div className="grid grid-cols-7">
          {weekdayDates.map((day) => (
            <div key={`weekday-${day.getDay()}`} className="border-r border-b border-current/15 bg-current/5 px-1 py-2 text-center text-[0.65rem] font-semibold opacity-75">
              {labels.dayNames[day.getDay()]?.slice(0, 2) ?? ""}
            </div>
          ))}
          {grid.rows.flat().map((cell) => (
            <MonthAgendaDayButton key={cell.key} cell={cell} labels={labels} variant={variant} onSelect={controller.selectDate} />
          ))}
        </div>
      </div>
      <SelectedDateAgenda
        selectedDate={controller.selectedDate}
        entries={entries}
        labels={labels}
        variant={variant}
        onEntryActivate={onEntryActivate}
        renderEvent={(event, density) => renderEvent?.(event, density)}
        formatTime={formatTime}
        formatLocation={formatLocation}
        getEventClassName={getEventClassName}
        showTooltip={showTooltip}
        renderTooltip={renderTooltip}
      />
    </div>
  );
}
