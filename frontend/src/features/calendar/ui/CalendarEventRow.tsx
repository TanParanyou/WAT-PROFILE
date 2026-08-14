"use client";

import type { ReactNode } from "react";
import type { CalendarVariant } from "../calendar-theme";
import type { CalendarEventLike } from "../core/types";
import { CalendarTooltip } from "./CalendarTooltip";

export interface CalendarEventRowProps<TEvent extends CalendarEventLike> {
  event: TEvent;
  date: string;
  formatTime: (event: TEvent, date: string) => string | null;
  formatLocation: (event: TEvent) => string | null;
  onActivate: (event: TEvent) => void;
  actionLabel: string;
  className: string;
  focusClassName: string;
  renderEvent?: (event: TEvent) => ReactNode;
  showTooltip?: boolean;
  renderTooltip?: (event: TEvent) => ReactNode;
  variant?: CalendarVariant;
}

export function CalendarEventRow<TEvent extends CalendarEventLike>({
  event,
  date,
  formatTime,
  formatLocation,
  onActivate,
  actionLabel,
  className,
  focusClassName,
  renderEvent,
  showTooltip = true,
  renderTooltip,
  variant = "public",
}: CalendarEventRowProps<TEvent>) {
  const time = formatTime(event, date);
  const location = formatLocation(event);
  const accessibleName = [event.title, time, location].filter(Boolean).join(", ");

  return (
    <CalendarTooltip
      event={event}
      variant={variant}
      showTooltip={showTooltip}
      renderTooltip={renderTooltip}
      formatTime={(item) => formatTime(item, date)}
      formatLocation={formatLocation}
    >
      <button
        type="button"
        onClick={() => onActivate(event)}
        aria-label={accessibleName}
        className={`flex min-h-11 w-full items-start justify-between gap-3 border border-current/15 px-3 py-2 text-left transition-colors hover:bg-current/5 focus-visible:outline-[3px] focus-visible:outline-offset-2 ${focusClassName} ${className}`}
      >
        <span className="min-w-0">
          {time ? <span className="block text-xs opacity-70">{time}</span> : null}
          <span className="block truncate text-sm font-medium">{renderEvent ? renderEvent(event) : event.title}</span>
          {location ? <span className="block truncate text-xs opacity-70">{location}</span> : null}
        </span>
        <span className="shrink-0 text-xs font-medium opacity-75">{actionLabel}</span>
      </button>
    </CalendarTooltip>
  );
}
