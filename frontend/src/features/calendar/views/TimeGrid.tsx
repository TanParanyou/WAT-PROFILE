"use client";

import type { CSSProperties } from "react";
import type { CalendarLabels } from "../calendar-copy";
import { calendarFocusClass, type CalendarVariant } from "../calendar-theme";
import type { CalendarEntry } from "../types";
import { formatCalendarDate } from "./calendar-view-utils";
import { CalendarEntryButton } from "./CalendarEntryButton";
import { buildTimeGridModel, type TimeGridDay } from "./time-grid";

interface TimeGridProps {
  days: readonly Date[];
  entries: readonly CalendarEntry[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: CalendarEntry) => void;
  showDayHeaders: boolean;
  selectedDate?: Date;
  onDaySelect?: (date: Date) => void;
}

const slotMinMinutes = 8 * 60;
const slotMaxMinutes = 20 * 60;
const slotDurationMinutes = 30;
const slotHeight = 44;
const timeAxisWidth = 64;
const minimumDayWidth = 136;

function getEventStyle(
  position: TimeGridDay["timedEntries"][number]["position"],
): CSSProperties {
  const visibleMinutes = slotMaxMinutes - slotMinMinutes;
  const left = (position.column / position.columnCount) * 100;
  const width = 100 / position.columnCount;

  return {
    top: `${((position.startMinutes - slotMinMinutes) / visibleMinutes) * 100}%`,
    height: `${((position.endMinutes - position.startMinutes) / visibleMinutes) * 100}%`,
    left: `calc(${left}% + 2px)`,
    width: `calc(${width}% - 4px)`,
  };
}

export function TimeGrid({
  days,
  entries,
  labels,
  variant,
  onEntryActivate,
  showDayHeaders,
  selectedDate,
  onDaySelect,
}: TimeGridProps) {
  const dayKeys = days.map(formatCalendarDate);
  const model = buildTimeGridModel({
    days: dayKeys,
    entries,
    slotMinMinutes,
    slotMaxMinutes,
    slotDurationMinutes,
  });
  const selectedDay = selectedDate ? formatCalendarDate(selectedDate) : null;
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `${timeAxisWidth}px repeat(${model.days.length}, minmax(${minimumDayWidth}px, 1fr))`,
    minWidth: `${timeAxisWidth + (model.days.length * minimumDayWidth)}px`,
  };
  const gridHeight = model.slots.length * slotHeight;
  const isSingleDayEmpty = model.days.length === 1
    && model.days[0]?.allDayEntries.length === 0
    && model.days[0]?.timedEntries.length === 0;

  return (
    <div className="overflow-x-auto" data-calendar-time-grid>
      <div className="border-l border-t border-current/15" style={gridStyle}>
        {showDayHeaders ? (
          <div className="grid border-b border-current/15" style={gridStyle}>
            <div className="border-r border-current/15 bg-current/5" />
            {model.days.map((day, index) => {
              const date = days[index];
              const isSelected = day.date === selectedDay;
              if (!date) return null;

              return onDaySelect ? (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => onDaySelect(date)}
                  aria-pressed={isSelected}
                  className={`min-h-11 border-r border-current/15 px-2 py-2 text-center text-sm font-semibold ${calendarFocusClass(variant)} ${isSelected ? "bg-current/10" : "bg-current/5"}`}
                >
                  {labels.formatDayHeader(date, { includeWeekday: true })}
                </button>
              ) : (
                <div key={day.date} className={`min-h-11 border-r border-current/15 px-2 py-2 text-center text-sm font-semibold ${isSelected ? "bg-current/10" : "bg-current/5"}`}>
                  {labels.formatDayHeader(date, { includeWeekday: true })}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="grid border-b border-current/15" style={gridStyle}>
          <div className="border-r border-current/15 px-2 py-2 text-right text-xs font-medium opacity-70">
            {labels.allDay}
          </div>
          {model.days.map((day) => (
            <div key={day.date} className="min-h-11 space-y-1 border-r border-current/15 p-1">
              {day.allDayEntries.map((entry) => (
                <CalendarEntryButton key={entry.id} entry={entry} variant={variant} onActivate={onEntryActivate} compact />
              ))}
            </div>
          ))}
        </div>

        <div className="grid" style={gridStyle} aria-label={labels.timedEvents}>
          <div className="relative border-r border-current/15" style={{ height: gridHeight }}>
            {model.slots.map((slot, index) => (
              <div key={slot.minutes} className="absolute left-0 right-0 border-t border-current/10" style={{ top: index * slotHeight }}>
                {slot.isHour ? <span className="absolute right-2 -top-2.5 text-xs opacity-70">{labels.formatTime(slot.minutes)}</span> : null}
              </div>
            ))}
          </div>
          {model.days.map((day) => (
            <section key={day.date} className="relative border-r border-current/15" style={{ height: gridHeight }} aria-label={labels.timedEvents}>
              {model.slots.map((slot, index) => (
                <div key={slot.minutes} className="absolute left-0 right-0 border-t border-current/10" style={{ top: index * slotHeight }} />
              ))}
              {day.timedEntries.map(({ entry, position }) => (
                <div key={entry.id} className="absolute min-h-11" style={getEventStyle(position)}>
                  <CalendarEntryButton entry={entry} variant={variant} onActivate={onEntryActivate} />
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
      {isSingleDayEmpty ? <p className="border-x border-b border-current/15 p-4 text-sm opacity-70">{labels.noEventsOnDate}</p> : null}
    </div>
  );
}
