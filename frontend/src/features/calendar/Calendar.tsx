"use client";

import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { CalendarLabels } from "./calendar-copy";
import { CalendarToolbar } from "./CalendarToolbar";
import type { CalendarController } from "./useCalendar";
import type { CalendarEntry, CalendarFeed } from "./types";
import { MonthView } from "./views/MonthView";
import { WeekView } from "./views/WeekView";
import { DayView } from "./views/DayView";
import { toCalendarEvents } from "./adapters/wat-calendar";

interface CalendarProps {
  controller: CalendarController;
  query: UseQueryResult<CalendarFeed>;
  variant: "public" | "admin";
  labels: CalendarLabels;
  onEntryActivate: (entry: CalendarEntry) => void;
  children?: ReactNode;
}

export function Calendar({ controller, query, variant, labels, onEntryActivate, children }: CalendarProps) {
  const themeClass = variant === "public"
    ? "public-theme bg-site-canvas text-site-foreground"
    : "admin-theme bg-admin-surface text-admin-foreground";
  const hasData = Boolean(query.data);
  const entries = query.data?.entries ?? [];
  const monthEvents = toCalendarEvents(entries);

  return (
    <section className={`${themeClass} space-y-4`} aria-label={labels.calendarInstructions}>
      <CalendarToolbar controller={controller} labels={labels} variant={variant} />
      {query.isFetching && hasData ? <p className="text-sm opacity-70" role="status">{labels.refreshing ?? labels.loading ?? "Refreshing"}</p> : null}
      {!hasData && query.isPending ? <p className="py-12 text-center text-sm" role="status">{labels.loading ?? "Loading"}</p> : null}
      {!hasData && query.isError ? (
        <div className="space-y-3 border border-current/20 p-6 text-center">
          <p>{labels.error ?? "Unable to load calendar"}</p>
          <button type="button" onClick={() => void query.refetch()} className="min-h-11 border border-current px-4 text-sm">
            {labels.retry ?? "Retry"}
          </button>
        </div>
      ) : null}
      {hasData ? children ?? (
        <div data-calendar-view={controller.view} className="min-h-72">
          {controller.view === "month" ? <MonthView controller={controller} entries={monthEvents} resources={query.data?.resources ?? []} labels={labels} variant={variant} onEntryActivate={(event) => onEntryActivate(event.meta.originalEntry)} /> : null}
          {controller.view === "week" ? <WeekView controller={controller} entries={entries} labels={labels} variant={variant} onEntryActivate={onEntryActivate} /> : null}
          {controller.view === "day" ? <DayView controller={controller} entries={entries} labels={labels} variant={variant} onEntryActivate={onEntryActivate} /> : null}
          {entries.length === 0 ? <p className="mt-4 border border-current/20 p-6 text-center text-sm">{labels.empty ?? labels.noEventsOnDate}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
