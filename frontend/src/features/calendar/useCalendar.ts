"use client";

import { format, isValid, parse, startOfDay } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { resolveCalendarConfig, type CalendarConfig, type CalendarConfigInput } from "./config";
import type { CalendarLabels } from "./calendar-copy";
import { getVisibleRange, shiftCalendarDate } from "./core/calendar-state";
import type { CalendarRange, CalendarView } from "./core/types";
import { discoveryPreset } from "./presets/discovery";
import type { CalendarPreset } from "./presets/types";

const dateFormat = "yyyy-MM-dd";
const calendarViews: readonly CalendarView[] = ["month", "week", "day"];

export interface CalendarController {
  view: CalendarView;
  date: Date;
  selectedDate: Date;
  visibleRange: CalendarRange;
  config: CalendarConfig;
  previous(): void;
  next(): void;
  today(): void;
  setView(view: CalendarView): void;
  setDate(date: Date): void;
  selectDate(date: Date): void;
}

export interface CalendarStateOptions {
  initialView?: string;
  savedView?: string;
  url?: string;
  weekStartsOn: 0 | 1;
  initialDate?: Date;
  preset?: CalendarPreset;
  config?: CalendarConfigInput;
}

export interface UseCalendarOptions {
  weekStartsOn: 0 | 1;
  preset?: CalendarPreset;
  config?: CalendarConfigInput;
  initialView?: CalendarView;
  initialDate?: Date;
  onStateChange?: (state: { view: CalendarView; date: Date }) => void;
}

export function isCalendarView(value: string | null | undefined): value is CalendarView {
  return value !== undefined && value !== null && calendarViews.includes(value as CalendarView);
}

/** Kept as a stable key helper for existing integrations; storage access lives in the routed adapter. */
export function calendarPreferenceKey(scope: "public" | "admin"): string {
  return `wat-calendar-view:${scope}`;
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = parse(value, dateFormat, new Date(0));
  return isValid(date) && format(date, dateFormat) === value ? startOfDay(date) : null;
}

function parseUrlOptions(url: string | undefined): { view: string | null; date: Date | null } {
  if (!url) return { view: null, date: null };
  const params = new URL(url, "http://calendar.local").searchParams;
  return { view: params.get("view"), date: parseDateOnly(params.get("date")) };
}

function resolveInitialView(options: CalendarStateOptions, enabledViews: readonly CalendarView[]): CalendarView {
  const url = parseUrlOptions(options.url);
  if (isCalendarView(url.view) && enabledViews.includes(url.view)) return url.view;
  if (url.view !== null) return enabledViews.includes("month") ? "month" : enabledViews[0] ?? "month";
  if (isCalendarView(options.savedView) && enabledViews.includes(options.savedView)) return options.savedView;
  if (isCalendarView(options.initialView) && enabledViews.includes(options.initialView)) return options.initialView;
  return enabledViews.includes("month") ? "month" : enabledViews[0] ?? "month";
}

export function createCalendarState(options: CalendarStateOptions): CalendarController {
  const config = resolveCalendarConfig(options.preset ?? discoveryPreset, options.config);
  const url = parseUrlOptions(options.url);
  let view = resolveInitialView(options, config.enabledViews);
  let date = startOfDay(url.date ?? options.initialDate ?? new Date());
  let selectedDate = date;

  return {
    get view() { return view; },
    get date() { return date; },
    get selectedDate() { return selectedDate; },
    get visibleRange() { return getVisibleRange(date, view, options.weekStartsOn); },
    config,
    previous() { date = shiftCalendarDate(date, view, -1); },
    next() { date = shiftCalendarDate(date, view, 1); },
    today() { date = startOfDay(new Date()); selectedDate = date; },
    setView(nextView) { view = config.enabledViews.includes(nextView) ? nextView : config.enabledViews[0] ?? "month"; },
    setDate(nextDate) { date = startOfDay(nextDate); },
    selectDate(nextDate) { const normalized = startOfDay(nextDate); date = normalized; selectedDate = normalized; },
  };
}

export function useCalendar(options: UseCalendarOptions): CalendarController {
  const calendarConfig = useMemo(
    () => resolveCalendarConfig(options.preset ?? discoveryPreset, options.config),
    [options.config, options.preset],
  );
  const { onStateChange } = options;
  const [state, setState] = useState(() => {
    const initialView = isCalendarView(options.initialView) && calendarConfig.enabledViews.includes(options.initialView)
      ? options.initialView
      : calendarConfig.enabledViews.includes("month") ? "month" : calendarConfig.enabledViews[0] ?? "month";
    const date = startOfDay(options.initialDate ?? new Date());
    return { view: initialView, date, selectedDate: date };
  });

  useEffect(() => {
    onStateChange?.({ view: state.view, date: state.date });
  }, [onStateChange, state.date, state.view]);

  const updateDate = useCallback((nextDate: Date, select = true) => {
    const normalized = startOfDay(nextDate);
    setState((current) => ({ ...current, date: normalized, selectedDate: select ? normalized : current.selectedDate }));
  }, []);
  const previous = useCallback(() => setState((current) => ({ ...current, date: shiftCalendarDate(current.date, current.view, -1) })), []);
  const next = useCallback(() => setState((current) => ({ ...current, date: shiftCalendarDate(current.date, current.view, 1) })), []);
  const today = useCallback(() => updateDate(new Date()), [updateDate]);
  const setView = useCallback((nextView: CalendarView) => {
    const resolvedView = calendarConfig.enabledViews.includes(nextView) ? nextView : calendarConfig.enabledViews[0] ?? "month";
    setState((current) => ({ ...current, view: resolvedView }));
  }, [calendarConfig.enabledViews]);
  const setDate = useCallback((nextDate: Date) => updateDate(nextDate), [updateDate]);
  const selectDate = useCallback((nextDate: Date) => updateDate(nextDate), [updateDate]);

  const visibleRange = useMemo(
    () => getVisibleRange(state.date, state.view, options.weekStartsOn),
    [state.date, state.view, options.weekStartsOn],
  );

  return useMemo(() => ({
    view: state.view,
    date: state.date,
    selectedDate: state.selectedDate,
    visibleRange,
    config: calendarConfig,
    previous,
    next,
    today,
    setView,
    setDate,
    selectDate,
  }), [
    state.view,
    state.date,
    state.selectedDate,
    visibleRange,
    calendarConfig,
    previous,
    next,
    today,
    setView,
    setDate,
    selectDate,
  ]);
}

export function getCalendarViewLabels(labels: CalendarLabels): Record<CalendarView, string> {
  return { month: labels.viewMonth ?? "Month", week: labels.viewWeek ?? "Week", day: labels.viewDay ?? "Day" };
}
