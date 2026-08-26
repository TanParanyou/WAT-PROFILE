"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/navigation";
import { shiftCalendarDate } from "../../core/calendar-state";
import { resolveCalendarConfig } from "../../config";
import { discoveryPreset } from "../../presets/discovery";
import type { CalendarView } from "../../core/types";
import { useCalendar, type CalendarController, type UseCalendarOptions } from "../../useCalendar";
import { calendarPreferenceKey, formatCalendarUrlDate, parseCalendarUrlState } from "./calendar-url-state";

export interface UseRoutedCalendarOptions extends UseCalendarOptions {
  scope: "public" | "admin";
}

export function useRoutedCalendar(options: UseRoutedCalendarOptions): CalendarController {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const urlState = useMemo(() => parseCalendarUrlState(searchParams), [searchParams]);
  const preset = options.preset ?? discoveryPreset;
  const config = useMemo(() => resolveCalendarConfig(preset, options.config), [options.config, preset]);
  const savedView = typeof window === "undefined" ? null : window.localStorage.getItem(calendarPreferenceKey(options.scope));
  const initialView = urlState.view ?? (savedView === "month" || savedView === "week" || savedView === "day" ? savedView : options.initialView);
  const controller = useCalendar({ ...options, preset, config, initialView, initialDate: urlState.date ?? options.initialDate, onStateChange: undefined });

  const replaceUrl = useCallback((view: string, date: Date) => {
    const nextDateStr = formatCalendarUrlDate(date);
    const currentView = searchParams.get("view");
    const currentDate = searchParams.get("date");
    if (currentView === view && currentDate === nextDateStr) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    params.set("date", nextDateStr);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    window.localStorage.setItem(calendarPreferenceKey(options.scope), controller.view);
  }, [controller.view, options.scope]);

  const { view: controllerView, date: controllerDate, setView: controllerSetView, setDate: controllerSetDate, selectDate: controllerSelectDate } = controller;

  useEffect(() => {
    if (urlState.rawView !== null && urlState.view === null) {
      replaceUrl(controllerView, controllerDate);
      return;
    }
    if (urlState.view && urlState.view !== controllerView) controllerSetView(urlState.view);
    if (urlState.date && formatCalendarUrlDate(urlState.date) !== formatCalendarUrlDate(controllerDate)) controllerSetDate(urlState.date);
  }, [controllerDate, controllerSetDate, controllerSetView, controllerView, replaceUrl, urlState]);

  const setView = useCallback((view: CalendarView) => { controllerSetView(view); replaceUrl(view, controllerDate); }, [controllerDate, controllerSetView, replaceUrl]);
  const setDate = useCallback((date: Date) => { controllerSetDate(date); replaceUrl(controllerView, date); }, [controllerSetDate, controllerView, replaceUrl]);
  const selectDate = useCallback((date: Date) => { controllerSelectDate(date); replaceUrl(controllerView, date); }, [controllerSelectDate, controllerView, replaceUrl]);
  const previous = useCallback(() => {
    const nextDate = shiftCalendarDate(controllerDate, controllerView, -1);
    controllerSetDate(nextDate);
    replaceUrl(controllerView, nextDate);
  }, [controllerDate, controllerSetDate, controllerView, replaceUrl]);
  const next = useCallback(() => {
    const nextDate = shiftCalendarDate(controllerDate, controllerView, 1);
    controllerSetDate(nextDate);
    replaceUrl(controllerView, nextDate);
  }, [controllerDate, controllerSetDate, controllerView, replaceUrl]);
  const today = useCallback(() => {
    const nextDate = new Date();
    controllerSetDate(nextDate);
    replaceUrl(controllerView, nextDate);
  }, [controllerSetDate, controllerView, replaceUrl]);

  return useMemo(() => ({
    ...controller,
    previous,
    next,
    today,
    setView,
    setDate,
    selectDate,
  }), [controller, next, previous, selectDate, setDate, setView, today]);
}
