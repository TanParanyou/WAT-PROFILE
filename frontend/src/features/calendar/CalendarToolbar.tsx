"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarLabels } from "./calendar-copy";
import { CalendarViewTabs } from "./CalendarViewTabs";
import type { CalendarController } from "./useCalendar";

interface CalendarToolbarProps {
  controller: CalendarController;
  labels: CalendarLabels;
  variant: "public" | "admin";
}

export function CalendarToolbar({ controller, labels, variant }: CalendarToolbarProps) {
  const buttonClass = variant === "public"
    ? "border border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface focus-visible:outline-site-focus"
    : "border border-admin-border bg-admin-surface text-admin-body hover:bg-admin-surface-muted focus-visible:outline-admin-focus";
  const periodLabel = labels.periodLabel?.(controller.date, controller.view) ?? controller.visibleRange.startDate;

  return (
    <div className="flex flex-col gap-3 border-b border-current/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <button type="button" onClick={controller.previous} aria-label={labels.previous ?? labels.previousMonth} className={`min-h-11 min-w-11 inline-flex items-center justify-center ${buttonClass}`}>
          <ChevronLeft aria-hidden="true" size={18} />
        </button>
        <button type="button" onClick={controller.today} className={`min-h-11 px-4 text-sm ${buttonClass}`}>
          {labels.today}
        </button>
        <button type="button" onClick={controller.next} aria-label={labels.next ?? labels.nextMonth} className={`min-h-11 min-w-11 inline-flex items-center justify-center ${buttonClass}`}>
          <ChevronRight aria-hidden="true" size={18} />
        </button>
        <h2 className="ml-2 min-w-0 truncate text-base font-semibold" aria-live="polite">{periodLabel}</h2>
      </div>
      <CalendarViewTabs view={controller.view} labels={labels} onViewChange={controller.setView} variant={variant} />
    </div>
  );
}
