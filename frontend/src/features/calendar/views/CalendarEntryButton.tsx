"use client";

import type { CalendarEntry } from "../types";
import type { CalendarVariant } from "../calendar-theme";
import { calendarEntryToneClass, calendarFocusClass } from "../calendar-theme";
import { formatEntryTime } from "./calendar-view-utils";

interface CalendarEntryButtonProps {
  entry: CalendarEntry;
  variant: CalendarVariant;
  onActivate: (entry: CalendarEntry) => void;
  compact?: boolean;
}

export function CalendarEntryButton({ entry, variant, onActivate, compact = false }: CalendarEntryButtonProps) {
  const statusLabel = entry.status === "active" ? "active" : "inactive";
  const announcement = `${entry.title}, ${formatEntryTime(entry)}, ${entry.source}, ${statusLabel}`;
  const toneClass = calendarEntryToneClass(variant, entry.display.tone);

  return (
    <button
      type="button"
      title={announcement}
      aria-label={announcement}
      onClick={() => onActivate(entry)}
      className={`block w-full overflow-hidden text-left text-xs leading-tight transition-colors focus-visible:outline-2 ${calendarFocusClass(variant)} ${toneClass} ${compact ? "px-1.5 py-1" : "px-2 py-1.5"}`}
    >
      <span className="block truncate font-medium">{entry.title}</span>
      {!compact ? <span className="block truncate opacity-70">{formatEntryTime(entry)}</span> : null}
    </button>
  );
}
