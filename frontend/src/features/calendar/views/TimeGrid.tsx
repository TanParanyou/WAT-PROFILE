"use client";

import type { CSSProperties } from "react";
import type { CalendarEntry } from "../types";
import { buildTimedColumns } from "../layout";
import { CalendarEntryButton } from "./CalendarEntryButton";
import { entriesOnDay, getTimedPosition } from "./calendar-view-utils";

interface TimeGridProps {
  day: string;
  entries: readonly CalendarEntry[];
  onEntryActivate: (entry: CalendarEntry) => void;
  showHeader?: boolean;
}

const slots = Array.from({ length: 48 }, (_, index) => index);

export function TimeGrid({ day, entries, onEntryActivate, showHeader = true }: TimeGridProps) {
  const dayEntries = entriesOnDay(entries, day);
  const timedEntries = dayEntries.filter((entry) => !entry.allDay);
  const columns = buildTimedColumns(timedEntries);

  return (
    <div className="min-w-[640px]">
      {showHeader ? <div className="border-y border-current/15 py-2 text-sm font-semibold">{day}</div> : null}
      <div className="relative h-[1440px] border-b border-current/15 bg-[linear-gradient(to_bottom,transparent_59px,currentColor_60px)] bg-[length:100%_60px] bg-opacity-10">
        {slots.map((slot) => (
          <div key={slot} className="absolute left-0 right-0 border-t border-current/10 text-[0.65rem] opacity-60" style={{ top: `${slot * (100 / 48)}%` }}>
            {slot % 2 === 0 ? <span className="absolute -left-12 -top-2 w-10 text-right">{String(Math.floor(slot / 2)).padStart(2, "0")}:00</span> : null}
          </div>
        ))}
        {timedEntries.map((entry) => {
          const layout = columns.get(entry.id) ?? { column: 0, columnCount: 1 };
          const position = getTimedPosition(entry, day);
          const style: CSSProperties = {
            top: `${(position.startMinutes / 1440) * 100}%`,
            height: `${((position.endMinutes - position.startMinutes) / 1440) * 100}%`,
            left: `${(layout.column / layout.columnCount) * 100}%`,
            width: `${(100 / layout.columnCount) - 1}%`,
          };
          return (
            <div key={entry.id} className="absolute min-h-8" style={style}>
              <CalendarEntryButton entry={entry} onActivate={onEntryActivate} />
            </div>
          );
        })}
      </div>
      {dayEntries.filter((entry) => entry.allDay).map((entry) => <div key={entry.id} className="mt-1"><CalendarEntryButton entry={entry} onActivate={onEntryActivate} compact /></div>)}
      {timedEntries.length === 0 && dayEntries.filter((entry) => entry.allDay).length === 0 ? <p className="py-6 text-sm opacity-70">No entries</p> : null}
    </div>
  );
}
