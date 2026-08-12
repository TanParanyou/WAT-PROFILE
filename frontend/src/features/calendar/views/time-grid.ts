import { buildTimedColumns, type TimedEntryLayout } from "../layout";
import type { CalendarEventLike } from "../core/types";
import { entriesOnDay, getTimedPositionWithinWindow } from "./calendar-view-utils";

const minutesPerDay = 24 * 60;

export interface TimeGridSlot {
  minutes: number;
  isHour: boolean;
}

export interface TimeGridPosition extends TimedEntryLayout {
  startMinutes: number;
  endMinutes: number;
}

export interface TimeGridTimedEntry<TEvent extends CalendarEventLike = CalendarEventLike> {
  entry: TEvent;
  position: TimeGridPosition;
}

export interface TimeGridDay<TEvent extends CalendarEventLike = CalendarEventLike> {
  date: string;
  allDayEntries: TEvent[];
  timedEntries: TimeGridTimedEntry<TEvent>[];
}

export interface BuildTimeGridModelInput<TEvent extends CalendarEventLike = CalendarEventLike> {
  days: readonly string[];
  entries: readonly TEvent[];
  slotMinMinutes: number;
  slotMaxMinutes: number;
  slotDurationMinutes: number;
}

export interface TimeGridModel<TEvent extends CalendarEventLike = CalendarEventLike> {
  slots: TimeGridSlot[];
  days: TimeGridDay<TEvent>[];
}

function normalizeMinute(value: number): number {
  return Math.max(0, Math.min(minutesPerDay, Math.floor(value)));
}

function buildTimeGridSlots(
  slotMinMinutes: number,
  slotMaxMinutes: number,
  slotDurationMinutes: number,
): TimeGridSlot[] {
  const durationMinutes = Math.floor(slotDurationMinutes);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || slotMaxMinutes <= slotMinMinutes) return [];

  const slots: TimeGridSlot[] = [];
  for (let minutes = slotMinMinutes; minutes < slotMaxMinutes; minutes += durationMinutes) {
    slots.push({ minutes, isHour: minutes % 60 === 0 });
  }
  return slots;
}

export function buildTimeGridModel<TEvent extends CalendarEventLike>({
  days,
  entries,
  slotMinMinutes,
  slotMaxMinutes,
  slotDurationMinutes,
}: BuildTimeGridModelInput<TEvent>): TimeGridModel<TEvent> {
  const windowStartMinutes = normalizeMinute(slotMinMinutes);
  const windowEndMinutes = normalizeMinute(slotMaxMinutes);
  const slots = buildTimeGridSlots(windowStartMinutes, windowEndMinutes, slotDurationMinutes);

  return {
    slots,
    days: days.map((date) => {
      const dayEntries = entriesOnDay(entries, date);
      const positionedEntries = dayEntries.flatMap((entry) => {
        if (entry.allDay) return [];
        const position = getTimedPositionWithinWindow(entry, date, windowStartMinutes, windowEndMinutes);
        return position ? [{ entry, position }] : [];
      });
      const columns = buildTimedColumns(positionedEntries.map((item) => item.entry));

      return {
        date,
        allDayEntries: dayEntries.filter((entry) => entry.allDay),
        timedEntries: positionedEntries.map(({ entry, position }) => ({
          entry,
          position: {
            ...(columns.get(entry.id) ?? { column: 0, columnCount: 1 }),
            ...position,
          },
        })),
      };
    }),
  };
}
