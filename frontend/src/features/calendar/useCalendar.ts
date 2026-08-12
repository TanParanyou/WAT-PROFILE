"use client";

import { addDays, addMonths, addWeeks, format, isValid, parse, startOfDay } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/navigation";
import { getCalendarStep, getCalendarVisibleRange } from "./range";
import type { CalendarLabels } from "./calendar-copy";
import type { CalendarRange, CalendarScope, CalendarView } from "./types";

const dateFormat = "yyyy-MM-dd";
const calendarViews: readonly CalendarView[] = ["month", "week", "day", "dayGrid", "timeline"];

export interface CalendarController {
  view: CalendarView;
  date: Date;
  selectedDate: Date;
  visibleRange: CalendarRange;
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

function resolveInitialView(options: CalendarStateOptions): CalendarView {
  const url = parseUrlOptions(options.url);
  if (isCalendarView(url.view)) return url.view;
  if (isCalendarView(options.savedView)) return options.savedView;
  if (isCalendarView(options.initialView)) return options.initialView;
  return "month";
}

function shiftDate(date: Date, view: CalendarView, direction: -1 | 1): Date {
  const step = getCalendarStep(view);
  if (step === "month") return addMonths(date, direction);
  if (step === "week") return addWeeks(date, direction);
  return addDays(date, direction);
}

export function createCalendarState(options: CalendarStateOptions): CalendarController {
  const url = parseUrlOptions(options.url);
  let view = resolveInitialView(options);
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
      return getCalendarVisibleRange(date, view, options.weekStartsOn);
    },
    previous() {
      date = shiftDate(date, view, -1);
    },
    next() {
      date = shiftDate(date, view, 1);
    },
    today() {
      date = startOfDay(new Date());
      selectedDate = date;
    },
    setView(nextView) {
      view = nextView;
    },
    setDate(nextDate) {
      date = startOfDay(nextDate);
    },
    selectDate(nextDate) {
      selectedDate = startOfDay(nextDate);
    },
  };
}

export interface UseCalendarOptions {
  scope: CalendarScope;
  weekStartsOn: 0 | 1;
  initialView?: CalendarView;
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
  const [view, setViewState] = useState<CalendarView>(() =>
    resolveInitialView({
      initialView: options.initialView,
      savedView: readSavedView(options.scope),
      url: initialUrl,
      weekStartsOn: options.weekStartsOn,
    }),
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

  const setView = useCallback(
    (nextView: CalendarView) => {
      setViewState(nextView);
      replaceUrl(nextView, date);
    },
    [date, replaceUrl],
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
  const previous = useCallback(() => setDate(shiftDate(date, view, -1)), [date, setDate, view]);
  const next = useCallback(() => setDate(shiftDate(date, view, 1)), [date, setDate, view]);
  const today = useCallback(() => setDate(new Date()), [setDate]);
  const selectDate = useCallback((nextDate: Date) => setSelectedDate(startOfDay(nextDate)), []);

  return {
    view,
    date,
    selectedDate,
    visibleRange: getCalendarVisibleRange(date, view, options.weekStartsOn),
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
    dayGrid: labels.viewDayGrid ?? "Day grid",
    timeline: labels.viewTimeline ?? "Timeline",
  };
}
