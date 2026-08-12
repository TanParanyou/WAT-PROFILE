"use client";

import type { CalendarEntry } from "../types";
import { formatEntryTime } from "./calendar-view-utils";

interface CalendarEntryButtonProps {
  entry: CalendarEntry;
  onActivate: (entry: CalendarEntry) => void;
  compact?: boolean;
}

export function CalendarEntryButton({ entry, onActivate, compact = false }: CalendarEntryButtonProps) {
  const statusLabel = entry.status === "active" ? "active" : "inactive";
  const announcement = `${entry.title}, ${formatEntryTime(entry)}, ${entry.source}, ${statusLabel}`;
  const toneClass = entry.display.tone === "warning"
    ? "border-l-2 border-admin-warning bg-admin-surface-muted"
    : entry.display.tone === "muted"
      ? "border-l-2 border-admin-border bg-admin-surface-muted"
      : "border-l-2 border-admin-info bg-admin-surface-muted";

  return (
    <button
      type="button"
      title={announcement}
      aria-label={announcement}
      onClick={() => onActivate(entry)}
      className={`block w-full overflow-hidden text-left text-xs leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${toneClass} ${compact ? "px-1.5 py-1" : "px-2 py-1.5"}`}
    >
      <span className="block truncate font-medium">{entry.title}</span>
      {!compact ? <span className="block truncate opacity-70">{formatEntryTime(entry)}</span> : null}
    </button>
  );
}
