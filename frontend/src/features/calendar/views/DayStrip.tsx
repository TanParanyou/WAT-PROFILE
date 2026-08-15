"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import type { CalendarEventLike } from "../core/types";
import { formatCalendarDate } from "./calendar-view-utils";
import { TimeGrid } from "./TimeGrid";

export interface DayStripProps<TEvent extends CalendarEventLike> {
  days: readonly Date[];
  selectedDate: Date;
  entries: readonly TEvent[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onDaySelect: (date: Date) => void;
  onEntryActivate: (entry: TEvent) => void;
  renderEvent?: (event: TEvent, density: "summary" | "row" | "timeGrid") => ReactNode;
  getEventClassName?: (event: TEvent, density: "summary" | "row" | "timeGrid") => string;
  showTooltip?: boolean;
  renderTooltip?: (event: TEvent) => ReactNode;
  stickyHeader?: boolean;
  stickyTimeAxis?: boolean;
  maxVisibleAllDayEvents?: number;
  minMinutes?: number;
  maxMinutes?: number;
  slotDurationMinutes?: number;
  slotHeight?: number;
  minimumDayWidth?: number;
}

function nextDayIndex(index: number, key: string, count: number): number | null {
  if (count === 0) return null;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  if (key === "ArrowRight" || key === "ArrowDown") return (index + 1) % count;
  if (key === "ArrowLeft" || key === "ArrowUp") return (index - 1 + count) % count;
  return null;
}

export function DayStrip<TEvent extends CalendarEventLike>({
  days,
  selectedDate,
  entries,
  labels,
  variant,
  onDaySelect,
  onEntryActivate,
  renderEvent,
  getEventClassName,
  showTooltip = true,
  renderTooltip,
  stickyHeader = true,
  stickyTimeAxis = true,
  maxVisibleAllDayEvents = 2,
  minMinutes,
  maxMinutes,
  slotDurationMinutes = 30,
  slotHeight = 44,
  minimumDayWidth = 136,
}: DayStripProps<TEvent>) {
  const selectedKey = formatCalendarDate(selectedDate);
  const selectedIndex = Math.max(0, days.findIndex((day) => formatCalendarDate(day) === selectedKey));
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusDay = (index: number) => {
    const date = days[index];
    if (!date) return;
    onDaySelect(date);
    requestAnimationFrame(() => tabRefs.current[index]?.focus());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const nextIndex = nextDayIndex(selectedIndex, event.key, days.length);
    if (nextIndex === null) return;
    event.preventDefault();
    focusDay(nextIndex);
  };

  return (
    <div data-calendar-day-strip className="space-y-3">
      <div role="tablist" aria-label={labels.calendarInstructions} className="grid grid-cols-7 border-l border-t border-current/15">
        {days.map((day, index) => {
          const dayKey = formatCalendarDate(day);
          const isSelected = dayKey === selectedKey;
          return (
            <button
              key={dayKey}
              ref={(element) => { tabRefs.current[index] = element; }}
              type="button"
              role="tab"
              aria-selected={isSelected}
              tabIndex={index === selectedIndex ? 0 : -1}
              aria-label={labels.selectedDateLabel(day)}
              onClick={() => focusDay(index)}
              onKeyDown={handleKeyDown}
              className={`min-h-12 border-r border-b border-current/15 px-1 text-center text-xs focus-visible:outline-[3px] focus-visible:outline-offset-2 ${variant === "public" ? "focus-visible:outline-site-focus" : "focus-visible:outline-admin-focus"} ${isSelected ? "bg-current/10 font-semibold" : "bg-current/5"}`}
            >
              {labels.formatDayHeader(day, { includeWeekday: true })}
            </button>
          );
        })}
      </div>
      <TimeGrid
        days={[selectedDate]}
        entries={entries}
        labels={labels}
        variant={variant}
        onEntryActivate={onEntryActivate}
        showDayHeaders={false}
        renderEvent={renderEvent}
        getEventClassName={getEventClassName ? (event) => getEventClassName(event, "timeGrid") : undefined}
        showTooltip={showTooltip}
        renderTooltip={renderTooltip}
        stickyHeader={stickyHeader}
        stickyTimeAxis={stickyTimeAxis}
        maxVisibleAllDayEvents={maxVisibleAllDayEvents}
        minMinutes={minMinutes}
        maxMinutes={maxMinutes}
        slotDurationMinutes={slotDurationMinutes}
        slotHeight={slotHeight}
        minimumDayWidth={minimumDayWidth}
      />
    </div>
  );
}
