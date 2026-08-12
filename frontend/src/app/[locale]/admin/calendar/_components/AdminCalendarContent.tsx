"use client";

import { format, isSameMonth, isSameYear, parse } from "date-fns";
import { de, enUS, th } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useCalendar } from "@/features/calendar/useCalendar";
import { useCalendarEntries } from "@/features/calendar/queries";
import type { CalendarLabels } from "@/features/calendar/calendar-copy";
import type { CalendarEntry, CalendarLocale } from "@/features/calendar/types";
import { CalendarRoot } from "@/features/calendar/ui/CalendarRoot";
import { planningPreset } from "@/features/calendar/presets/planning";
import { getCalendarDays } from "@/features/calendar/views/calendar-view-utils";
import { MonthView } from "@/features/calendar/views/MonthView";
import { TimeGrid } from "@/features/calendar/views/TimeGrid";
import {
  formatWatEventTime,
  getWatEventBarClass,
  getWatEventLocation,
  toCalendarEvents,
  type WatCalendarEvent,
} from "@/features/calendar/adapters/wat-calendar";
import { CalendarEntryDrawer } from "./CalendarEntryDrawer";

export default function AdminCalendarContent() {
  const localeValue = useLocale();
  const locale: CalendarLocale = localeValue === "de" || localeValue === "en" ? localeValue : "th";
  const t = useTranslations("Admin.calendar");
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const controller = useCalendar({ scope: "admin", weekStartsOn: locale === "th" ? 0 : 1, initialView: "month" });
  const query = useCalendarEntries({ scope: "admin", locale, range: controller.visibleRange });
  const dateFnsLocale = locale === "th" ? th : locale === "de" ? de : enUS;
  const labels: CalendarLabels = {
    previousMonth: t("previous"),
    nextMonth: t("next"),
    previous: t("previous"),
    next: t("next"),
    today: t("today"),
    moreEvents: (count) => t("moreEvents", { count }),
    eventsCount: (count) => t("eventsCount", { count }),
    noEventsOnDate: t("noEventsOnDate"),
    calendarInstructions: t("calendarInstructions"),
    dayNames: [t("dayNames.sunday"), t("dayNames.monday"), t("dayNames.tuesday"), t("dayNames.wednesday"), t("dayNames.thursday"), t("dayNames.friday"), t("dayNames.saturday")],
    viewMonth: t("views.month"),
    viewWeek: t("views.week"),
    viewDay: t("views.day"),
    allDay: t("allDay"),
    timedEvents: t("timedEvents"),
    eventDetails: t("eventDetails"),
    selectedDateLabel: (date) => t("selectedDate", { date: format(date, "PPP", { locale: dateFnsLocale }) }),
    formatDayHeader: (date, { includeWeekday }) => format(date, includeWeekday ? "EEE d" : "d", { locale: dateFnsLocale }),
    formatTime: (minutes) => format(new Date(2026, 0, 1, Math.floor(minutes / 60), minutes % 60), "HH:mm", { locale: dateFnsLocale }),
    loading: t("loading"),
    refreshing: t("refreshing"),
    retry: t("retry"),
    empty: t("empty"),
    error: t("error"),
    periodLabel: (date, visibleRange, view) => {
      if (view === "month") return format(date, "LLLL yyyy", { locale: dateFnsLocale });
      if (view === "day") return format(date, "PPP", { locale: dateFnsLocale });

      const rangeStart = parse(visibleRange.startDate, "yyyy-MM-dd", new Date(0));
      const rangeEnd = parse(visibleRange.endDate, "yyyy-MM-dd", new Date(0));
      if (isSameMonth(rangeStart, rangeEnd)) {
        return `${format(rangeStart, "d", { locale: dateFnsLocale })}–${format(rangeEnd, "d LLL yyyy", { locale: dateFnsLocale })}`;
      }
      if (isSameYear(rangeStart, rangeEnd)) {
        return `${format(rangeStart, "d LLL", { locale: dateFnsLocale })} – ${format(rangeEnd, "d LLL yyyy", { locale: dateFnsLocale })}`;
      }
      return `${format(rangeStart, "d LLL yyyy", { locale: dateFnsLocale })} – ${format(rangeEnd, "d LLL yyyy", { locale: dateFnsLocale })}`;
    },
  };

  const events = query.data ? toCalendarEvents(query.data.entries) : [];
  const activateEvent = (event: WatCalendarEvent) => setSelectedEntry(event.meta.originalEntry);
  const visibleDays = getCalendarDays(controller.visibleRange);
  const formatEventTime = (event: WatCalendarEvent, date: string) => formatWatEventTime(event, date, labels.allDay);
  const renderEvent = (event: WatCalendarEvent) => event.title;
  const getEventBarClass = (
    event: WatCalendarEvent,
    density: "summary" | "row" | "timeGrid",
  ) => getWatEventBarClass(event, "admin", density);
  const timeGridDays = controller.view === "day" ? [controller.selectedDate] : visibleDays;

  return (
    <main className="admin-theme min-h-full bg-admin-canvas px-4 py-6 text-admin-foreground sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-admin-muted">{t("subtitle")}</p>
      </header>
      {query.isFetching && query.data ? <p className="mb-3 text-sm text-admin-muted" role="status">{labels.refreshing ?? labels.loading ?? "Refreshing"}</p> : null}
      {!query.data && query.isPending ? <p className="py-12 text-center text-sm" role="status">{labels.loading ?? "Loading"}</p> : null}
      {!query.data && query.isError ? (
        <div className="space-y-3 border border-admin-border p-6 text-center">
          <p>{labels.error ?? "Unable to load calendar"}</p>
          <button type="button" onClick={() => void query.refetch()} className="min-h-11 border border-admin-border px-4 text-sm">{labels.retry ?? "Retry"}</button>
        </div>
      ) : null}
      {query.data ? (
        <CalendarRoot
          preset={planningPreset}
          view={controller.view}
          date={controller.date}
          selectedDate={controller.selectedDate}
          visibleRange={controller.visibleRange}
          events={events}
          labels={labels}
          onViewChange={controller.setView}
          onPrevious={controller.previous}
          onNext={controller.next}
          onToday={controller.today}
          onSelectDate={controller.selectDate}
          onEventActivate={activateEvent}
          renderEvent={renderEvent}
          renderMonth={() => (
            <MonthView
              controller={controller}
              entries={events}
              labels={labels}
              variant="admin"
              onEntryActivate={activateEvent}
              renderEvent={renderEvent}
              formatTime={formatEventTime}
              formatLocation={getWatEventLocation}
              eventClassName="bg-admin-surface-muted"
              getEventClassName={getEventBarClass}
            />
          )}
          renderAgenda={() => null}
          renderTimeGrid={() => (
            <TimeGrid
              days={timeGridDays}
              entries={events}
              labels={labels}
              variant="admin"
              onEntryActivate={activateEvent}
              showDayHeaders
              selectedDate={controller.selectedDate}
              onDaySelect={controller.selectDate}
              renderEvent={renderEvent}
              getEventClassName={(event) => getEventBarClass(event, "timeGrid")}
            />
          )}
          themeClassName="admin-theme bg-admin-surface text-admin-foreground"
          controlClassName="border border-admin-border bg-admin-surface text-admin-body hover:bg-admin-surface-muted"
          activeTabClassName="bg-admin-action text-admin-on-action"
          inactiveTabClassName="text-admin-body hover:bg-admin-surface-muted"
          focusClassName="focus-visible:outline-admin-focus"
        />
      ) : null}
      <CalendarEntryDrawer entry={selectedEntry} open={selectedEntry !== null} onClose={() => setSelectedEntry(null)} labels={{ edit: t("drawer.edit"), close: t("drawer.close"), source: t("drawer.source"), status: t("drawer.status"), active: t("drawer.active"), inactive: t("drawer.inactive"), location: t("drawer.location"), description: t("drawer.description") }} />
    </main>
  );
}
