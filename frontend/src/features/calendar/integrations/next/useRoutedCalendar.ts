"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/navigation";
import { shiftCalendarDate } from "../../core/calendar-state";
import { resolveCalendarConfig } from "../../config";
import { discoveryPreset } from "../../presets/discovery";
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
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    params.set("date", formatCalendarUrlDate(date));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    window.localStorage.setItem(calendarPreferenceKey(options.scope), controller.view);
  }, [controller.view, options.scope]);

  useEffect(() => {
    if (urlState.rawView !== null && urlState.view === null) {
      replaceUrl(controller.view, controller.date);
      return;
    }
    if (urlState.view && urlState.view !== controller.view) controller.setView(urlState.view);
    if (urlState.date && formatCalendarUrlDate(urlState.date) !== formatCalendarUrlDate(controller.date)) controller.setDate(urlState.date);
  }, [controller, replaceUrl, urlState]);

  const setView = useCallback((view: typeof controller.view) => { controller.setView(view); replaceUrl(view, controller.date); }, [controller, replaceUrl]);
  const setDate = useCallback((date: Date) => { controller.setDate(date); replaceUrl(controller.view, date); }, [controller, replaceUrl]);
  const selectDate = useCallback((date: Date) => { controller.selectDate(date); replaceUrl(controller.view, date); }, [controller, replaceUrl]);
  const previous = useCallback(() => {
    const nextDate = shiftCalendarDate(controller.date, controller.view, -1);
    controller.setDate(nextDate);
    replaceUrl(controller.view, nextDate);
  }, [controller, replaceUrl]);
  const next = useCallback(() => {
    const nextDate = shiftCalendarDate(controller.date, controller.view, 1);
    controller.setDate(nextDate);
    replaceUrl(controller.view, nextDate);
  }, [controller, replaceUrl]);
  const today = useCallback(() => {
    const nextDate = new Date();
    controller.setDate(nextDate);
    replaceUrl(controller.view, nextDate);
  }, [controller, replaceUrl]);

  return { ...controller, previous, next, today, setView, setDate, selectDate };
}
