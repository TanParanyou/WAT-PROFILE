"use client";

import type { CSSProperties, ReactNode } from "react";
import type { CalendarLabels } from "../calendar-copy";
import { calendarFocusClass, type CalendarVariant } from "../calendar-theme";
import type { CalendarEvent, CalendarEventLike } from "../core/types";
import { CalendarTooltip } from "../ui/CalendarTooltip";
import { formatCalendarDate } from "./calendar-view-utils";
import { buildTimeGridModel, type TimeGridDay } from "./time-grid";

interface TimeGridProps<TEvent extends CalendarEventLike> {
  days: readonly Date[];
  entries: readonly TEvent[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  onEntryActivate: (entry: TEvent) => void;
  showDayHeaders: boolean;
  selectedDate?: Date;
  onDaySelect?: (date: Date) => void;
  renderEvent?: (event: TEvent, density: "summary" | "row" | "timeGrid") => ReactNode;
  getEventClassName?: (
    event: TEvent,
    density: "timeGrid",
  ) => string;
  showTooltip?: boolean;
  renderTooltip?: (event: TEvent) => ReactNode;
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

function EventButton<TEvent extends CalendarEventLike>({
  event,
  labels,
  variant,
  onActivate,
  renderEvent,
  getEventClassName,
  showTooltip = true,
  renderTooltip,
}: {
  event: TEvent;
  labels: CalendarLabels;
  variant: CalendarVariant;
  onActivate: (event: TEvent) => void;
  renderEvent?: (event: TEvent, density: "summary" | "row" | "timeGrid") => ReactNode;
  getEventClassName?: (event: TEvent, density: "timeGrid") => string;
  showTooltip?: boolean;
  renderTooltip?: (event: TEvent) => ReactNode;
}) {
  const eventClass = getEventClassName?.(event, "timeGrid") ?? "bg-current/5";
  const calendarEvent = event as unknown as CalendarEvent<unknown>;

  return (
    <CalendarTooltip
      event={calendarEvent}
      showTooltip={showTooltip}
      renderTooltip={renderTooltip ? () => renderTooltip(event) : undefined}
      formatTime={() => (event.allDay ? labels.allDay : `${event.start.slice(11, 16)}–${event.end.slice(11, 16)}`)}
    >
      <button
        type="button"
        onClick={() => onActivate(event)}
        aria-label={event.title}
        className={`block min-h-11 w-full overflow-hidden border border-current/15 px-2 py-1.5 text-left text-xs leading-tight transition-colors focus-visible:outline-2 ${calendarFocusClass(variant)} ${eventClass}`}
      >
        <span className="block truncate font-medium">{renderEvent ? renderEvent(event, "timeGrid") : event.title}</span>
        <span className="block truncate opacity-70">{event.allDay ? labels.allDay : `${event.start.slice(11, 16)}–${event.end.slice(11, 16)}`}</span>
      </button>
    </CalendarTooltip>
  );
}

export function TimeGrid<TEvent extends CalendarEventLike>({
  days,
  entries,
  labels,
  variant,
  onEntryActivate,
  showDayHeaders,
  selectedDate,
  onDaySelect,
  renderEvent,
  getEventClassName,
  showTooltip = true,
  renderTooltip,
}: TimeGridProps<TEvent>) {
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
                <button key={day.date} type="button" onClick={() => onDaySelect(date)} aria-pressed={isSelected} className={`min-h-11 border-r border-current/15 px-2 py-2 text-center text-sm font-semibold ${calendarFocusClass(variant)} ${isSelected ? "bg-current/10" : "bg-current/5"}`}>
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
          <div className="border-r border-current/15 px-2 py-2 text-right text-xs font-medium opacity-70">{labels.allDay}</div>
          {model.days.map((day) => (
            <div key={day.date} className="min-h-11 space-y-1 border-r border-current/15 p-1">
              {day.allDayEntries.map((event) => (
                <EventButton key={event.id} event={event} labels={labels} variant={variant} onActivate={onEntryActivate} renderEvent={renderEvent} getEventClassName={getEventClassName} showTooltip={showTooltip} renderTooltip={renderTooltip} />
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
              {model.slots.map((slot, index) => <div key={slot.minutes} className="absolute left-0 right-0 border-t border-current/10" style={{ top: index * slotHeight }} />)}
              {day.timedEntries.map(({ entry, position }) => (
                <div key={entry.id} className="absolute min-h-11" style={getEventStyle(position)}>
                  <EventButton event={entry} labels={labels} variant={variant} onActivate={onEntryActivate} renderEvent={renderEvent} getEventClassName={getEventClassName} showTooltip={showTooltip} renderTooltip={renderTooltip} />
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
