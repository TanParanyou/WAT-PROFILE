"use client";

import type { KeyboardEvent } from "react";
import type { CalendarLabels } from "./calendar-copy";
import { getCalendarViewLabels } from "./useCalendar";
import type { CalendarView } from "./types";

interface CalendarViewTabsProps {
  view: CalendarView;
  labels: CalendarLabels;
  onViewChange: (view: CalendarView) => void;
  variant: "public" | "admin";
}

const views: readonly CalendarView[] = ["month", "week", "day", "dayGrid", "timeline"];

export function CalendarViewTabs({ view, labels, onViewChange, variant }: CalendarViewTabsProps) {
  const names = getCalendarViewLabels(labels);
  const activeIndex = views.indexOf(view);
  const focusView = (index: number) => onViewChange(views[(index + views.length) % views.length] ?? "month");

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
    <div className={variant === "public" ? "border border-site-border" : "border border-admin-border"} role="tablist" aria-label="Calendar views">
      {views.map((item) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={item === view}
          tabIndex={item === view ? 0 : -1}
          onClick={() => onViewChange(item)}
          onKeyDown={handleKeyDown}
          className={`min-h-11 px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${item === view ? activeClass : inactiveClass}`}
        >
          {names[item]}
        </button>
      ))}
    </div>
  );
}
