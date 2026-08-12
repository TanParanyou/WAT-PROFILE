"use client";

import { format, isSameMonth, isSameYear, parse } from "date-fns";
import { de, enUS, th } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Calendar } from "@/features/calendar/Calendar";
import { useCalendar } from "@/features/calendar/useCalendar";
import { useCalendarEntries } from "@/features/calendar/queries";
import type { CalendarLabels } from "@/features/calendar/calendar-copy";
import type { CalendarEntry, CalendarLocale } from "@/features/calendar/types";

export default function CalendarPageContent() {
  const localeValue = useLocale();
  const locale: CalendarLocale = localeValue === "de" || localeValue === "en" ? localeValue : "th";
  const t = useTranslations("CalendarPage");
  const router = useRouter();
  const controller = useCalendar({ scope: "public", weekStartsOn: locale === "th" ? 0 : 1, initialView: "month" });
  const query = useCalendarEntries({ scope: "public", locale, range: controller.visibleRange });
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

  const activateEntry = (entry: CalendarEntry) => {
    if (entry.detail.href) router.push(entry.detail.href);
  };

  return (
    <div className="min-h-screen bg-site-canvas">
      <PageHeader variant="color" density="compact" align="left" title={t("title")} subtitle={t("subtitle")} />
      <PageContainer width="content">
        <Calendar controller={controller} query={query} variant="public" labels={labels} onEntryActivate={activateEntry} />
      </PageContainer>
    </div>
  );
}
