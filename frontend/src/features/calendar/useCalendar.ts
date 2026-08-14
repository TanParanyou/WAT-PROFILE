"use client";

import { format, isValid, parse, startOfDay } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/navigation";
import {
  getVisibleRange,
  shiftCalendarDate,
} from "./core/calendar-state";
import type { CalendarLabels } from "./calendar-copy";
import { resolveCalendarConfig, type CalendarConfig, type CalendarConfigInput } from "./config";
import type { CalendarRange, CalendarView } from "./core/types";
import type { CalendarScope } from "./types";
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

export function isCalendarView(value: string | null | undefined): value is CalendarView {
  return value !== undefined && value !== null && calendarViews.includes(value as CalendarView);
}

export function calendarPreferenceKey(scope: CalendarScope): string {
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

function resolveInitialView(options: CalendarStateOptions, enabledViews: readonly CalendarView[] = calendarViews): CalendarView {
  const url = parseUrlOptions(options.url);
  if (isCalendarView(url.view) && enabledViews.includes(url.view)) return url.view;
  if (url.view !== null) return "month";
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
    get view() {
      return view;
    },
    get date() {
      return date;
    },
    get selectedDate() {
      return selectedDate;
    },
    get visibleRange() {
      return getVisibleRange(date, view, options.weekStartsOn);
    },
    config,
    previous() {
      date = shiftCalendarDate(date, view, -1);
    },
    next() {
      date = shiftCalendarDate(date, view, 1);
    },
    today() {
      date = startOfDay(new Date());
      selectedDate = date;
    },
    setView(nextView) {
      view = config.enabledViews.includes(nextView) ? nextView : config.enabledViews[0] ?? "month";
    },
    setDate(nextDate) {
      date = startOfDay(nextDate);
    },
    selectDate(nextDate) {
      const normalized = startOfDay(nextDate);
      date = normalized;
      selectedDate = normalized;
    },
  };
}

export interface UseCalendarOptions {
  scope: CalendarScope;
  weekStartsOn: 0 | 1;
  initialView?: CalendarView;
  preset?: CalendarPreset;
  config?: CalendarConfigInput;
}

function readSavedView(scope: CalendarScope): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(calendarPreferenceKey(scope)) ?? undefined;
}

export function useCalendar(options: UseCalendarOptions): CalendarController {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const initialUrl = useMemo(() => `?${searchParams.toString()}`, [searchParams]);
  const calendarConfig = useMemo(
    () => resolveCalendarConfig(options.preset ?? discoveryPreset, options.config),
    [options.config, options.preset],
  );
  const [view, setViewState] = useState<CalendarView>(() =>
    resolveInitialView({
      initialView: options.initialView,
      savedView: readSavedView(options.scope),
      url: initialUrl,
      weekStartsOn: options.weekStartsOn,
      preset: options.preset,
      config: options.config,
    }, calendarConfig.enabledViews),
  );
  const [date, setDateState] = useState<Date>(() => {
    const parsed = parseUrlOptions(initialUrl).date;
    return startOfDay(parsed ?? new Date());
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const parsed = parseUrlOptions(initialUrl).date;
    return startOfDay(parsed ?? new Date());
  });

  const replaceUrl = useCallback(
    (nextView: CalendarView, nextDate: Date) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", nextView);
      params.set("date", format(nextDate, dateFormat));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    window.localStorage.setItem(calendarPreferenceKey(options.scope), view);
  }, [options.scope, view]);

  useEffect(() => {
    const urlView = searchParams.get("view");
    if (urlView !== null && !isCalendarView(urlView)) {
      replaceUrl(view, date);
    }
  }, [date, replaceUrl, searchParams, view]);

  const setView = useCallback(
    (nextView: CalendarView) => {
      const resolvedView = calendarConfig.enabledViews.includes(nextView)
        ? nextView
        : calendarConfig.enabledViews[0] ?? "month";
      setViewState(resolvedView);
      replaceUrl(resolvedView, date);
    },
    [calendarConfig.enabledViews, date, replaceUrl],
  );
  const setDate = useCallback(
    (nextDate: Date) => {
      const normalized = startOfDay(nextDate);
      setDateState(normalized);
      setSelectedDate(normalized);
      replaceUrl(view, normalized);
    },
    [replaceUrl, view],
  );
  const previous = useCallback(() => setDate(shiftCalendarDate(date, view, -1)), [date, setDate, view]);
  const next = useCallback(() => setDate(shiftCalendarDate(date, view, 1)), [date, setDate, view]);
  const today = useCallback(() => setDate(new Date()), [setDate]);
  const selectDate = useCallback(
    (nextDate: Date) => {
      const normalized = startOfDay(nextDate);
      setDateState(normalized);
      setSelectedDate(normalized);
      replaceUrl(view, normalized);
    },
    [replaceUrl, view],
  );

  return {
    view,
    date,
    selectedDate,
    visibleRange: getVisibleRange(date, view, options.weekStartsOn),
    config: calendarConfig,
    previous,
    next,
    today,
    setView,
    setDate,
    selectDate,
  };
}

export function getCalendarViewLabels(labels: CalendarLabels): Record<CalendarView, string> {
  return {
    month: labels.viewMonth ?? "Month",
    week: labels.viewWeek ?? "Week",
    day: labels.viewDay ?? "Day",
  };
}
