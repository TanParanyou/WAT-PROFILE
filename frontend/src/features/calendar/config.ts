import type { CalendarView } from "./core/types";
import type {
  CalendarLayout,
  CalendarPreset,
  CalendarResponsiveLayouts,
} from "./presets/types";

export interface CalendarConfigInput {
  enabledViews?: readonly CalendarView[];
  month?: {
    maxVisibleEvents?: number;
  };
  timeGrid?: {
    minMinutes?: number;
    maxMinutes?: number;
    slotDurationMinutes?: number;
    slotHeight?: number;
    minimumDayWidth?: number;
    maxVisibleAllDayEvents?: number;
    stickyHeader?: boolean;
    stickyTimeAxis?: boolean;
  };
}

export interface CalendarConfig {
  enabledViews: readonly CalendarView[];
  month: {
    maxVisibleEvents: number;
  };
  timeGrid: {
    minMinutes: number;
    maxMinutes: number;
    slotDurationMinutes: number;
    slotHeight: number;
    minimumDayWidth: number;
    maxVisibleAllDayEvents: number;
    stickyHeader: boolean;
    stickyTimeAxis: boolean;
  };
  layouts: CalendarResponsiveLayouts;
}

const defaultConfig: CalendarConfig = {
  enabledViews: ["month", "week", "day"],
  month: { maxVisibleEvents: 2 },
  timeGrid: {
    minMinutes: 8 * 60,
    maxMinutes: 20 * 60,
    slotDurationMinutes: 30,
    slotHeight: 44,
    minimumDayWidth: 136,
    maxVisibleAllDayEvents: 2,
    stickyHeader: true,
    stickyTimeAxis: true,
  },
  layouts: {
    desktop: { month: "monthGrid", week: "timeGrid", day: "timeGrid" },
    mobile: { month: "monthGrid", week: "timeGrid", day: "timeGrid" },
    mobileBreakpoint: 640,
  },
};

const validLayouts: Record<CalendarView, readonly CalendarLayout[]> = {
  month: ["monthGrid", "monthAgenda"],
  week: ["timeGrid", "dayStrip"],
  day: ["timeGrid"],
};

function positiveFinite(value: number | undefined, fallback: number, name: string): number {
  const resolved = value ?? fallback;
  if (!Number.isFinite(resolved) || resolved <= 0) {
    throw new RangeError(`${name} must be a positive finite number`);
  }
  return resolved;
}

export function resolveCalendarConfig(
  preset: CalendarPreset,
  input: CalendarConfigInput = {},
): CalendarConfig {
  const requestedViews: readonly CalendarView[] = input.enabledViews ?? preset.enabledViews;
  const enabledViews: CalendarView[] = Array.from(new Set(requestedViews))
    .filter((view) => preset.enabledViews.includes(view));
  const fallbackView: CalendarView = preset.enabledViews[0] ?? "month";
  const resolvedViews: readonly CalendarView[] = enabledViews.length > 0
    ? enabledViews
    : preset.enabledViews.includes("month") ? ["month"] : [fallbackView];
  const monthMaxVisibleEvents = positiveFinite(
    input.month?.maxVisibleEvents,
    defaultConfig.month.maxVisibleEvents,
    "month.maxVisibleEvents",
  );
  const minMinutes = input.timeGrid?.minMinutes ?? defaultConfig.timeGrid.minMinutes;
  const maxMinutes = input.timeGrid?.maxMinutes ?? defaultConfig.timeGrid.maxMinutes;
  if (!Number.isFinite(minMinutes) || !Number.isFinite(maxMinutes) || maxMinutes <= minMinutes) {
    throw new RangeError("timeGrid.maxMinutes must be greater than timeGrid.minMinutes");
  }

  const desktop = (Object.keys(validLayouts) as CalendarView[]).reduce<Record<CalendarView, CalendarLayout>>((resolved, view) => {
    const requested = preset.layouts?.desktop?.[view] ?? preset.viewModes[view];
    resolved[view] = validLayouts[view].includes(requested) ? requested : preset.viewModes[view];
    return resolved;
  }, { month: "monthGrid", week: "timeGrid", day: "timeGrid" });
  const mobile = (Object.keys(validLayouts) as CalendarView[]).reduce<Record<CalendarView, CalendarLayout>>((resolved, view) => {
    const requested = preset.layouts?.mobile?.[view] ?? desktop[view];
    resolved[view] = validLayouts[view].includes(requested) ? requested : preset.viewModes[view];
    return resolved;
  }, { month: "monthGrid", week: "timeGrid", day: "timeGrid" });
  const mobileBreakpoint = positiveFinite(
    preset.layouts?.mobileBreakpoint,
    defaultConfig.layouts.mobileBreakpoint,
    "mobileBreakpoint",
  );

  return {
    enabledViews: resolvedViews,
    month: { maxVisibleEvents: Math.floor(monthMaxVisibleEvents) },
    timeGrid: {
      minMinutes,
      maxMinutes,
      slotDurationMinutes: positiveFinite(input.timeGrid?.slotDurationMinutes, defaultConfig.timeGrid.slotDurationMinutes, "timeGrid.slotDurationMinutes"),
      slotHeight: positiveFinite(input.timeGrid?.slotHeight, defaultConfig.timeGrid.slotHeight, "timeGrid.slotHeight"),
      minimumDayWidth: positiveFinite(input.timeGrid?.minimumDayWidth, defaultConfig.timeGrid.minimumDayWidth, "timeGrid.minimumDayWidth"),
      maxVisibleAllDayEvents: Math.floor(positiveFinite(input.timeGrid?.maxVisibleAllDayEvents, defaultConfig.timeGrid.maxVisibleAllDayEvents, "timeGrid.maxVisibleAllDayEvents")),
      stickyHeader: input.timeGrid?.stickyHeader ?? defaultConfig.timeGrid.stickyHeader,
      stickyTimeAxis: input.timeGrid?.stickyTimeAxis ?? defaultConfig.timeGrid.stickyTimeAxis,
    },
    layouts: { desktop, mobile, mobileBreakpoint },
  };
}
