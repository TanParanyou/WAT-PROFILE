import { isBefore, parseISO } from "date-fns";
import type { CalendarEntry, CalendarResource } from "./types";

export interface TimedEntryLayout {
  column: number;
  columnCount: number;
}

interface TimedInterval {
  entry: CalendarEntry;
  start: number;
  end: number;
}

function parseTimedInterval(entry: CalendarEntry): TimedInterval | null {
  if (entry.allDay) return null;

  const start = parseISO(entry.start);
  const end = parseISO(entry.end);
  if (!isBefore(start, end)) return null;

  return {
    entry,
    start: start.getTime(),
    end: end.getTime(),
  };
}

function compareIntervals(a: TimedInterval, b: TimedInterval): number {
  return (
    a.start - b.start ||
    a.end - b.end ||
    a.entry.title.localeCompare(b.entry.title) ||
    a.entry.id.localeCompare(b.entry.id)
  );
}

function buildGroupLayout(
  group: readonly TimedInterval[],
  output: Map<string, TimedEntryLayout>,
): void {
  const active: Array<{ end: number; column: number }> = [];
  const assignments = new Map<string, number>();
  let columnCount = 0;

  for (const interval of group) {
    for (let index = active.length - 1; index >= 0; index -= 1) {
      if (active[index]?.end <= interval.start) active.splice(index, 1);
    }

    const occupied = new Set(active.map((item) => item.column));
    let column = 0;
    while (occupied.has(column)) column += 1;

    assignments.set(interval.entry.id, column);
    active.push({ end: interval.end, column });
    columnCount = Math.max(columnCount, column + 1);
  }

  for (const interval of group) {
    const column = assignments.get(interval.entry.id);
    if (column === undefined) continue;
    output.set(interval.entry.id, { column, columnCount });
  }
}

export function buildTimedColumns(
  entries: readonly CalendarEntry[],
): Map<string, TimedEntryLayout> {
  const intervals = entries
    .map(parseTimedInterval)
    .filter((interval): interval is TimedInterval => interval !== null)
    .sort(compareIntervals);
  const output = new Map<string, TimedEntryLayout>();

  let group: TimedInterval[] = [];
  let groupEnd = Number.NEGATIVE_INFINITY;

  const flushGroup = (): void => {
    if (group.length > 0) buildGroupLayout(group, output);
    group = [];
    groupEnd = Number.NEGATIVE_INFINITY;
  };

  for (const interval of intervals) {
    if (group.length > 0 && interval.start >= groupEnd) flushGroup();
    group.push(interval);
    groupEnd = Math.max(groupEnd, interval.end);
  }
  flushGroup();

  return output;
}

export function groupEntriesByResource(
  entries: readonly CalendarEntry[],
  resources: readonly CalendarResource[],
): Map<string, CalendarEntry[]> {
  const lanes = new Map<string, CalendarEntry[]>();
  for (const resource of resources) lanes.set(resource.id, []);
  if (!lanes.has("default")) lanes.set("default", []);

  for (const entry of entries) {
    const resourceId = entry.resourceId ?? "default";
    if (!lanes.has(resourceId)) lanes.set(resourceId, []);
    lanes.get(resourceId)?.push(entry);
  }

  return lanes;
}

export function getCalendarOverflowCount(
  total: number,
  visibleLimit: number,
): number {
  return Math.max(total - visibleLimit, 0);
}
