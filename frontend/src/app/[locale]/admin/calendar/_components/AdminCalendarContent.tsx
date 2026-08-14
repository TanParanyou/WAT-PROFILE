"use client";

import { format, isSameMonth, isSameYear, parse } from "date-fns";
import { de, enUS, th } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useRoutedCalendar } from "@/features/calendar/integrations/next/useRoutedCalendar";
import { Calendar } from "@/features/calendar/Calendar";
import { CalendarQueryBoundary } from "@/features/calendar/integrations/wat/CalendarQueryBoundary";
import { useCalendarEntries } from "@/features/calendar/queries";
import type { CalendarLabels } from "@/features/calendar/calendar-copy";
import type { CalendarEntry, CalendarLocale } from "@/features/calendar/types";
import { planningPreset } from "@/features/calendar/presets/planning";
import {
  formatWatEventTime,
  getWatEventBarClass,
  getWatEventLocation,
} from "@/features/calendar/adapters/wat-calendar";
import { CalendarEntryDrawer } from "./CalendarEntryDrawer";

export default function AdminCalendarContent() {
  const localeValue = useLocale();
  const locale: CalendarLocale = localeValue === "de" || localeValue === "en" ? localeValue : "th";
  const t = useTranslations("Admin.calendar");
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const controller = useRoutedCalendar({ scope: "admin", weekStartsOn: locale === "th" ? 0 : 1, initialView: "month" });
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
    scrollHorizontally: t("scrollHorizontally"),
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

  const activateEvent = (event: CalendarEntry) => setSelectedEntry(event);
  const formatEventTime = (event: CalendarEntry, date: string) => formatWatEventTime(event, date, labels.allDay);
  const renderEvent = (event: CalendarEntry) => event.title;
  const getEventBarClass = (
    event: CalendarEntry,
    density: "summary" | "row" | "timeGrid",
  ) => getWatEventBarClass(event, "admin", density);

  return (
    <main className="admin-theme min-h-full bg-admin-canvas px-4 py-6 text-admin-foreground sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-admin-muted">{t("subtitle")}</p>
      </header>
      <CalendarQueryBoundary query={query} labels={labels}>
        {(data) => (
          <Calendar
            preset={planningPreset}
            controller={controller}
            events={data.entries}
            labels={labels}
            variant="admin"
            onEventActivate={activateEvent}
            renderEvent={renderEvent}
            formatEventTime={formatEventTime}
            formatEventLocation={getWatEventLocation}
            getEventClassName={getEventBarClass}
            themeClassName="admin-theme bg-admin-surface text-admin-foreground"
            controlClassName="border border-admin-border bg-admin-surface text-admin-body hover:bg-admin-surface-muted"
            activeTabClassName="bg-admin-action text-admin-on-action"
            inactiveTabClassName="text-admin-body hover:bg-admin-surface-muted"
            focusClassName="focus-visible:outline-admin-focus"
          />
        )}
      </CalendarQueryBoundary>
      <CalendarEntryDrawer entry={selectedEntry} open={selectedEntry !== null} onClose={() => setSelectedEntry(null)} labels={{ edit: t("drawer.edit"), close: t("drawer.close"), source: t("drawer.source"), status: t("drawer.status"), active: t("drawer.active"), inactive: t("drawer.inactive"), location: t("drawer.location"), description: t("drawer.description") }} />
    </main>
  );
}
