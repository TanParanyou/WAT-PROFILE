"use client";

import type { ReactNode } from "react";
import type { CalendarEvent } from "../core/types";

export interface CalendarEventRowProps<TMeta> {
  event: CalendarEvent<TMeta>;
  date: string;
  formatTime: (event: CalendarEvent<TMeta>, date: string) => string | null;
  formatLocation: (event: CalendarEvent<TMeta>) => string | null;
  onActivate: (event: CalendarEvent<TMeta>) => void;
  actionLabel: string;
  className: string;
  focusClassName: string;
  renderEvent?: (event: CalendarEvent<TMeta>) => ReactNode;
}

export function CalendarEventRow<TMeta>({
  event,
  date,
  formatTime,
  formatLocation,
  onActivate,
  actionLabel,
  className,
  focusClassName,
  renderEvent,
}: CalendarEventRowProps<TMeta>) {
  const time = formatTime(event, date);
  const location = formatLocation(event);
  const accessibleName = [event.title, time, location].filter(Boolean).join(", ");

  return (
    <button
      type="button"
      onClick={() => onActivate(event)}
      aria-label={accessibleName}
      className={`flex min-h-11 w-full items-start justify-between gap-3 rounded-sm border border-current/15 px-3 py-2 text-left transition-colors hover:bg-current/5 focus-visible:outline-2 focus-visible:outline-offset-2 ${focusClassName} ${className}`}
    >
      <span className="min-w-0">
        {time ? <span className="block text-xs opacity-70">{time}</span> : null}
        <span className="block truncate text-sm font-medium">{renderEvent ? renderEvent(event) : event.title}</span>
        {location ? <span className="block truncate text-xs opacity-70">{location}</span> : null}
      </span>
      <span className="shrink-0 text-xs font-medium opacity-75">{actionLabel}</span>
    </button>
  );
}
