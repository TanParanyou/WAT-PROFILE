"use client";

import { format } from "date-fns";
import { de, enUS, th } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { Calendar } from "@/features/calendar/Calendar";
import { useCalendar } from "@/features/calendar/useCalendar";
import { useCalendarEntries } from "@/features/calendar/queries";
import type { CalendarLabels } from "@/features/calendar/calendar-copy";
import type { CalendarEntry, CalendarLocale } from "@/features/calendar/types";
import { CalendarEntryDrawer } from "./CalendarEntryDrawer";
import { useState } from "react";

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
    viewDayGrid: t("views.dayGrid"),
    viewTimeline: t("views.timeline"),
    loading: t("loading"),
    refreshing: t("refreshing"),
    retry: t("retry"),
    empty: t("empty"),
    error: t("error"),
    periodLabel: (date, view) => format(date, view === "month" ? "LLLL yyyy" : "dd LLL yyyy", { locale: dateFnsLocale }),
  };

  return (
    <main className="admin-theme min-h-full bg-admin-canvas px-4 py-6 text-admin-foreground sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-admin-muted">{t("subtitle")}</p>
      </header>
      <Calendar controller={controller} query={query} variant="admin" labels={labels} onEntryActivate={setSelectedEntry} />
      <CalendarEntryDrawer entry={selectedEntry} open={selectedEntry !== null} onClose={() => setSelectedEntry(null)} labels={{ edit: t("drawer.edit"), close: t("drawer.close"), source: t("drawer.source"), status: t("drawer.status"), active: t("drawer.active"), inactive: t("drawer.inactive"), location: t("drawer.location"), description: t("drawer.description") }} />
    </main>
  );
}
