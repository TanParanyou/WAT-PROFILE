"use client";

import type { ReactNode } from "react";
import type { CalendarEventLike } from "../core/types";
import type { CalendarVariant } from "../calendar-theme";
import { calendarEntryToneClass, calendarFocusClass } from "../calendar-theme";
import { formatEntryTime } from "./calendar-view-utils";

interface CalendarEntryButtonProps<TEvent extends CalendarEventLike> {
  entry: TEvent;
  variant: CalendarVariant;
  onActivate: (entry: TEvent) => void;
  compact?: boolean;
  renderEvent?: (entry: TEvent) => ReactNode;
  formatTime?: (entry: TEvent) => string;
  toneClassName?: string;
}

export function CalendarEntryButton<TEvent extends CalendarEventLike>({ entry, variant, onActivate, compact = false, renderEvent, formatTime, toneClassName = "bg-current/5" }: CalendarEntryButtonProps<TEvent>) {
  const time = formatTime?.(entry) ?? formatEntryTime(entry);
  const announcement = `${entry.title}, ${time}`;
  const toneClass = toneClassName || calendarEntryToneClass(variant, "default");

  return (
    <button
      type="button"
      title={announcement}
      aria-label={announcement}
      onClick={() => onActivate(entry)}
      className={`block min-h-11 w-full overflow-hidden text-left text-xs leading-tight transition-colors focus-visible:outline-[3px] focus-visible:outline-offset-2 ${calendarFocusClass(variant)} ${toneClass} ${compact ? "px-1.5 py-1" : "px-2 py-1.5"}`}
    >
      <span className="block truncate font-medium">{renderEvent?.(entry) ?? entry.title}</span>
      {!compact ? <span className="block truncate opacity-70">{time}</span> : null}
    </button>
  );
}
