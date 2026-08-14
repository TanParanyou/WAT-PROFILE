"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import type { CalendarEvent, CalendarRange, CalendarView } from "../core/types";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarPreset } from "../presets/types";

export interface CalendarRootProps<TMeta> {
  preset: CalendarPreset;
  view: CalendarView;
  date: Date;
  selectedDate: Date;
  visibleRange: CalendarRange;
  events: readonly CalendarEvent<TMeta>[];
  labels: CalendarLabels;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onSelectDate: (date: Date) => void;
  onEventActivate: (event: CalendarEvent<TMeta>) => void;
  renderEvent: (event: CalendarEvent<TMeta>, density: "summary" | "row" | "timeGrid") => ReactNode;
  renderMonth: () => ReactNode;
  renderAgenda: () => ReactNode;
  renderTimeGrid?: () => ReactNode;
  showTooltip?: boolean;
  renderTooltip?: (event: CalendarEvent<TMeta>) => ReactNode;
  stickyHeader?: boolean;
  stickyTimeAxis?: boolean;
  themeClassName?: string;
  controlClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
  focusClassName?: string;
}

export function getCalendarTabViews(preset: CalendarPreset): readonly CalendarView[] {
  return preset.enabledViews;
}

export function getRovingViewIndex(
  activeIndex: number,
  key: string,
  viewCount: number,
): number | null {
  if (viewCount === 0) return null;
  if (key === "Home") return 0;
  if (key === "End") return viewCount - 1;
  if (key === "ArrowRight" || key === "ArrowDown") return (activeIndex + 1) % viewCount;
  if (key === "ArrowLeft" || key === "ArrowUp") return (activeIndex - 1 + viewCount) % viewCount;
  return null;
}

export function CalendarRoot<TMeta>({
  preset,
  view,
  date,
  visibleRange,
  labels,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  renderMonth,
  renderAgenda,
  renderTimeGrid,
  themeClassName = "",
  controlClassName = "border border-current/20 bg-transparent hover:bg-current/5",
  activeTabClassName = "bg-current text-[Canvas]",
  inactiveTabClassName = "text-current hover:bg-current/5",
  focusClassName = "focus-visible:outline-current",
}: CalendarRootProps<TMeta>) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const periodLabel = labels.periodLabel(date, visibleRange, view);
  const viewLabels: Record<CalendarView, string> = {
    month: labels.viewMonth ?? "Month",
    week: labels.viewWeek ?? "Week",
    day: labels.viewDay ?? "Day",
  };
  const mode = preset.viewModes[view];
  const tabViews = getCalendarTabViews(preset);
  const activeIndex = tabViews.indexOf(view);
  const focusView = (index: number) => {
    const nextView = tabViews[index];
    if (!nextView) return;
    onViewChange(nextView);
    requestAnimationFrame(() => tabRefs.current[index]?.focus());
  };
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const nextIndex = getRovingViewIndex(activeIndex, event.key, tabViews.length);
    if (nextIndex === null) return;
    event.preventDefault();
    focusView(nextIndex);
  };

  return (
    <section className={`${themeClassName} space-y-4`} aria-label={labels.calendarInstructions}>
      <div className="flex flex-col gap-3 border-b border-current/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={onPrevious} aria-label={labels.previous ?? labels.previousMonth} className={`inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-[3px] focus-visible:outline-offset-2 ${controlClassName} ${focusClassName}`}>
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <button type="button" onClick={onToday} className={`min-h-11 px-4 text-sm focus-visible:outline-[3px] focus-visible:outline-offset-2 ${controlClassName} ${focusClassName}`}>
            {labels.today}
          </button>
          <button type="button" onClick={onNext} aria-label={labels.next ?? labels.nextMonth} className={`inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-[3px] focus-visible:outline-offset-2 ${controlClassName} ${focusClassName}`}>
            <ChevronRight aria-hidden="true" size={18} />
          </button>
          <h2 className="ml-2 min-w-0 truncate text-base font-semibold" aria-live="polite">{periodLabel}</h2>
        </div>
        <div className="max-w-full overflow-x-auto whitespace-nowrap" role="tablist" aria-label={labels.calendarInstructions}>
          <div className="flex min-w-max border border-current/15">
            {tabViews.map((item, index) => (
              <button
                key={item}
                ref={(element) => { tabRefs.current[index] = element; }}
                type="button"
                role="tab"
                aria-selected={item === view}
                tabIndex={item === view ? 0 : -1}
                onClick={() => onViewChange(item)}
                onKeyDown={handleTabKeyDown}
                className={`min-h-11 px-3 text-sm focus-visible:outline-[3px] focus-visible:outline-offset-2 ${focusClassName} ${item === view ? activeTabClassName : inactiveTabClassName}`}
              >
                {viewLabels[item]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div data-calendar-view={view} data-calendar-mode={mode} className="min-h-72">
        {mode === "monthGrid" ? renderMonth() : null}
        {mode === "agenda" ? renderAgenda() : null}
        {mode === "timeGrid" ? renderTimeGrid ? renderTimeGrid() : <p className="border border-current/15 p-6 text-center text-sm">{labels.error ?? "Calendar view unavailable"}</p> : null}
      </div>
    </section>
  );
}
