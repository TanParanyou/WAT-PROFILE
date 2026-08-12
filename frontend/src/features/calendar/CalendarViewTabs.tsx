"use client";

import type { KeyboardEvent } from "react";
import { useRef } from "react";
import type { CalendarLabels } from "./calendar-copy";
import { calendarFocusClass } from "./calendar-theme";
import { getCalendarViewLabels } from "./useCalendar";
import type { CalendarView } from "./types";

interface CalendarViewTabsProps {
  view: CalendarView;
  labels: CalendarLabels;
  onViewChange: (view: CalendarView) => void;
  variant: "public" | "admin";
}

const views: readonly CalendarView[] = ["month", "week", "day"];

export function CalendarViewTabs({ view, labels, onViewChange, variant }: CalendarViewTabsProps) {
  const names = getCalendarViewLabels(labels);
  const activeIndex = views.indexOf(view);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusView = (index: number) => {
    const nextIndex = (index + views.length) % views.length;
    onViewChange(views[nextIndex] ?? "month");
    requestAnimationFrame(() => tabRefs.current[nextIndex]?.focus());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusView(activeIndex + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusView(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusView(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusView(views.length - 1);
    }
  };

  const activeClass = variant === "public" ? "bg-site-action text-site-on-action" : "bg-admin-action text-admin-on-action";
  const inactiveClass = variant === "public" ? "text-site-foreground hover:bg-site-surface" : "text-admin-body hover:bg-admin-surface-muted";

  return (
    <div className={`${variant === "public" ? "border border-site-border" : "border border-admin-border"} max-w-full overflow-x-auto whitespace-nowrap`} role="tablist" aria-label="Calendar views">
      <div className="flex min-w-max">
      {views.map((item, index) => (
        <button
          key={item}
          ref={(element) => { tabRefs.current[index] = element; }}
          type="button"
          role="tab"
          aria-selected={item === view}
          tabIndex={item === view ? 0 : -1}
          onClick={() => onViewChange(item)}
          onKeyDown={handleKeyDown}
          className={`min-h-11 px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${calendarFocusClass(variant)} ${item === view ? activeClass : inactiveClass}`}
        >
          {names[item]}
        </button>
      ))}
      </div>
    </div>
  );
}
