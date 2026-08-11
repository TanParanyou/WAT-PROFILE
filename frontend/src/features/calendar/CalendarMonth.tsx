import {
  addMonths,
  format,
  isSameMonth,
  parse,
  startOfMonth,
} from "date-fns";
import type { ReactNode } from "react";
import type { CalendarDay, CalendarEvent } from "./calendar-domain";
import type { CalendarLabels } from "./calendar-copy";

export interface CalendarMonthProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  days: readonly CalendarDay[];
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  renderEvent: (event: CalendarEvent, date: string) => ReactNode;
  labels: CalendarLabels;
  monthLabel: string;
  variant: "public" | "admin";
  weekStartsOn: 0 | 1;
  isLoading?: boolean;
}

const dateFormat = "yyyy-MM-dd";

function parseCalendarDate(value: string): Date {
  return parse(value, dateFormat, new Date(0));
}

export function CalendarMonth({
  month,
  onMonthChange,
  days,
  selectedDate,
  onSelectedDateChange,
  renderEvent,
  labels,
  monthLabel,
  variant,
  weekStartsOn,
  isLoading = false,
}: CalendarMonthProps) {
  const selectedDay = days.find((day) => day.date === selectedDate);
  const orderedDayNames =
    weekStartsOn === 1
      ? [...labels.dayNames.slice(1), labels.dayNames[0]]
      : [...labels.dayNames];
  const focusClass =
    variant === "public"
      ? "focus-visible:outline-site-focus"
      : "focus-visible:outline-admin-focus";
  const cellClass =
    variant === "public"
      ? "border-site-border bg-site-canvas"
      : "border-admin-border bg-admin-surface";
  const mutedClass =
    variant === "public" ? "text-site-muted" : "text-admin-muted";

  return (
    <section aria-label={monthLabel} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-2xl font-medium text-site-foreground">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-2">
          <button
            aria-label={labels.previousMonth}
            className={`min-h-11 min-w-11 border px-3 text-lg ${cellClass} ${focusClass} focus-visible:outline-2 focus-visible:outline-offset-2`}
            onClick={() => onMonthChange(addMonths(month, -1))}
            type="button"
          >
            ‹
          </button>
          <button
            className={`min-h-11 border px-4 text-sm font-medium ${cellClass} ${focusClass} focus-visible:outline-2 focus-visible:outline-offset-2`}
            onClick={() => onMonthChange(startOfMonth(new Date()))}
            type="button"
          >
            {labels.today}
          </button>
          <button
            aria-label={labels.nextMonth}
            className={`min-h-11 min-w-11 border px-3 text-lg ${cellClass} ${focusClass} focus-visible:outline-2 focus-visible:outline-offset-2`}
            onClick={() => onMonthChange(addMonths(month, 1))}
            type="button"
          >
            ›
          </button>
        </div>
      </div>

      <p className="sr-only" id={`${variant}-calendar-instructions`}>
        {labels.calendarInstructions}
      </p>

      <div className="hidden sm:block" role="grid" aria-describedby={`${variant}-calendar-instructions`}>
        <div className="grid grid-cols-7 border-l border-t border-site-border" role="row">
          {orderedDayNames.map((dayName) => (
            <div
              className={`border-b border-r px-2 py-3 text-xs font-semibold uppercase tracking-wide ${mutedClass}`}
              key={dayName}
              role="columnheader"
            >
              {dayName}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-t border-site-border" role="rowgroup">
          {days.map((day) => {
            const dayDate = parseCalendarDate(day.date);
            const isCurrentMonth = isSameMonth(dayDate, month);
            const isSelected = day.date === selectedDate;
            const visibleEvents = day.events.slice(0, 2);
            const remaining = Math.max(day.events.length - visibleEvents.length, 0);
            return (
              <div
                className={`min-h-32 border-b border-r p-2 ${cellClass} ${!isCurrentMonth ? "opacity-50" : ""}`}
                key={day.date}
                role="gridcell"
              >
                <button
                  aria-label={`${format(dayDate, "d MMMM yyyy")}${day.events.length ? `, ${labels.eventsCount(day.events.length)}` : ""}`}
                  aria-pressed={isSelected}
                  className={`mb-2 min-h-8 min-w-8 px-2 text-left text-sm ${isSelected ? "bg-site-action font-semibold text-site-on-action" : mutedClass} ${focusClass} focus-visible:outline-2 focus-visible:outline-offset-2`}
                  onClick={() => onSelectedDateChange(day.date)}
                  type="button"
                >
                  {format(dayDate, "d")}
                </button>
                <div className="space-y-1">
                  {visibleEvents.map((event) => (
                    <div key={`${event.id}-${day.date}`}>{renderEvent(event, day.date)}</div>
                  ))}
                  {remaining > 0 ? (
                    <button
                      className={`min-h-8 text-xs underline ${mutedClass} ${focusClass} focus-visible:outline-2 focus-visible:outline-offset-2`}
                      onClick={() => onSelectedDateChange(day.date)}
                      type="button"
                    >
                      {labels.moreEvents(remaining)}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sm:hidden">
        <div className="grid grid-cols-7 border-l border-t border-site-border" role="grid">
          {orderedDayNames.map((dayName) => (
            <div className={`border-b border-r px-1 py-2 text-center text-[11px] font-semibold ${mutedClass}`} key={dayName}>
              {dayName.slice(0, 2)}
            </div>
          ))}
          {days.map((day) => {
            const dayDate = parseCalendarDate(day.date);
            return (
              <button
                aria-label={`${format(dayDate, "d MMMM yyyy")}${day.events.length ? `, ${labels.eventsCount(day.events.length)}` : ""}`}
                aria-pressed={day.date === selectedDate}
                className={`min-h-12 border-b border-r p-1 text-sm ${cellClass} ${day.date === selectedDate ? "bg-site-action text-site-on-action" : mutedClass} ${focusClass} focus-visible:outline-2 focus-visible:outline-offset-2`}
                key={day.date}
                onClick={() => onSelectedDateChange(day.date)}
                type="button"
              >
                <span>{format(dayDate, "d")}</span>
                {day.events.length ? <span className="mx-auto mt-1 block h-1 w-1 rounded-full bg-site-accent" /> : null}
              </button>
            );
          })}
        </div>
        <div className="mt-4 border-t border-site-border pt-4">
          {isLoading ? <p className={mutedClass}>…</p> : null}
          {!isLoading && selectedDay?.events.length ? (
            <div className="space-y-2">
              {selectedDay.events.map((event) => (
                <div key={`${event.id}-${selectedDay.date}`}>{renderEvent(event, selectedDay.date)}</div>
              ))}
            </div>
          ) : null}
          {!isLoading && !selectedDay?.events.length ? <p className={mutedClass}>{labels.noEventsOnDate}</p> : null}
        </div>
      </div>
    </section>
  );
}
