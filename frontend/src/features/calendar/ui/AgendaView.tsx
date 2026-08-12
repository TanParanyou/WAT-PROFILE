"use client";

import { parse } from "date-fns";
import type { CalendarEvent } from "../core/types";
import { buildAgendaDays } from "../core/agenda";
import type { CalendarLabels } from "../calendar-copy";
import { CalendarEventRow } from "./CalendarEventRow";

interface AgendaViewProps<TMeta> {
  days: readonly string[];
  events: readonly CalendarEvent<TMeta>[];
  labels: CalendarLabels;
  mode: "week" | "day";
  formatTime: (event: CalendarEvent<TMeta>, date: string) => string | null;
  formatLocation: (event: CalendarEvent<TMeta>) => string | null;
  onEventActivate: (event: CalendarEvent<TMeta>) => void;
  eventClassName: string;
  focusClassName: string;
}

function parseDate(value: string): Date {
  return parse(value, "yyyy-MM-dd", new Date(0));
}

export function AgendaView<TMeta>({
  days,
  events,
  labels,
  mode,
  formatTime,
  formatLocation,
  onEventActivate,
  eventClassName,
  focusClassName,
}: AgendaViewProps<TMeta>) {
  const agendaDays = buildAgendaDays({ days, events });
  const hasEvents = agendaDays.some((day) => day.allDayEvents.length + day.timedEvents.length > 0);
  const visibleDays = mode === "day" ? agendaDays : agendaDays.filter((day) => day.allDayEvents.length + day.timedEvents.length > 0);

  if (!hasEvents) {
    return <p className="border border-current/15 p-6 text-center text-sm">{labels.noEventsOnDate}</p>;
  }

  return (
    <div className="space-y-4" aria-label={mode === "day" ? labels.selectedDateLabel(parseDate(days[0] ?? "")) : labels.timedEvents}>
      {visibleDays.map((day) => {
        const date = parseDate(day.date);
        const dayEvents = [...day.allDayEvents, ...day.timedEvents];
        return (
          <section key={day.date} className="space-y-2 border border-current/10 p-3" aria-labelledby={`calendar-agenda-${day.date}`}>
            <h3 id={`calendar-agenda-${day.date}`} className="text-sm font-semibold">
              {labels.formatDayHeader(date, { includeWeekday: mode === "week" })}
            </h3>
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <CalendarEventRow
                  key={`${day.date}-${event.id}`}
                  event={event}
                  date={day.date}
                  formatTime={formatTime}
                  formatLocation={formatLocation}
                  onActivate={onEventActivate}
                  actionLabel={labels.eventDetails}
                  className={eventClassName}
                  focusClassName={focusClassName}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
