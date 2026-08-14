"use client";

import { format, isSameMonth, isSameYear, parse } from "date-fns";
import { de, enUS, th } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { useRoutedCalendar } from "@/features/calendar/integrations/next/useRoutedCalendar";
import { useCalendarEntries } from "@/features/calendar/queries";
import type { CalendarLabels } from "@/features/calendar/calendar-copy";
import { CalendarRoot } from "@/features/calendar/ui/CalendarRoot";
import { discoveryPreset } from "@/features/calendar/presets/discovery";
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
import type { CalendarLocale } from "@/features/calendar/types";

export default function CalendarPageContent() {
  const localeValue = useLocale();
  const locale: CalendarLocale = localeValue === "de" || localeValue === "en" ? localeValue : "th";
  const t = useTranslations("CalendarPage");
  const router = useRouter();
  const controller = useRoutedCalendar({ scope: "public", weekStartsOn: locale === "th" ? 0 : 1, initialView: "month" });
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
    eventDetails: t("eventDetails"),
    selectedDateLabel: (date) => t("selectedDate", { date: format(date, "PPP", { locale: dateFnsLocale }) }),
    formatDayHeader: (date, { includeWeekday }) => format(date, includeWeekday ? "EEE d" : "d", { locale: dateFnsLocale }),
    formatTime: (minutes) => format(new Date(2026, 0, 1, Math.floor(minutes / 60), minutes % 60), "HH:mm", { locale: dateFnsLocale }),
    loading: t("loading"),
    refreshing: t("refreshing"),
    retry: t("retry"),
    empty: t("empty"),
    error: t("error"),
    closeDialog: t("closeDialog"),
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

  const events = query.data ? toCalendarEvents(query.data.entries) : [];
  const activateEvent = (event: WatCalendarEvent) => {
    if (event.meta.detail.href) router.push(event.meta.detail.href);
  };

  const visibleDays = getCalendarDays(controller.visibleRange);
  const formatEventTime = (event: WatCalendarEvent, date: string) => formatWatEventTime(event, date, labels.allDay);
  const renderEvent = (event: WatCalendarEvent) => event.title;
  const getEventBarClass = (
    event: WatCalendarEvent,
    density: "summary" | "row" | "timeGrid",
  ) => getWatEventBarClass(event, "public", density);
  const timeGridDays = controller.view === "day" ? [controller.selectedDate] : visibleDays;

  return (
    <div className="min-h-screen bg-site-canvas">
      <PageHeader variant="color" density="compact" align="left" title={t("title")} subtitle={t("subtitle")} />
      <PageContainer width="wide">
        {query.isFetching && query.data ? <p className="mb-3 text-sm opacity-70" role="status">{labels.refreshing ?? labels.loading ?? "Refreshing"}</p> : null}
        {!query.data && query.isPending ? <p className="py-12 text-center text-sm" role="status">{labels.loading ?? "Loading"}</p> : null}
        {!query.data && query.isError ? (
          <div className="space-y-3 border border-current/20 p-6 text-center">
            <p>{labels.error ?? "Unable to load calendar"}</p>
            <button type="button" onClick={() => void query.refetch()} className="min-h-11 border border-current px-4 text-sm">{labels.retry ?? "Retry"}</button>
          </div>
        ) : null}
        {query.data ? (
          <CalendarRoot
            preset={discoveryPreset}
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
                variant="public"
                onEntryActivate={activateEvent}
                renderEvent={renderEvent}
                formatTime={formatEventTime}
                formatLocation={getWatEventLocation}
                eventClassName="bg-site-surface"
                getEventClassName={getEventBarClass}
              />
            )}
            renderAgenda={() => null}
            renderTimeGrid={() => (
              <TimeGrid
                days={timeGridDays}
                entries={events}
                labels={labels}
                variant="public"
                onEntryActivate={activateEvent}
                showDayHeaders
                selectedDate={controller.selectedDate}
                onDaySelect={controller.selectDate}
                renderEvent={renderEvent}
                getEventClassName={(event) => getEventBarClass(event, "timeGrid")}
              />
            )}
            themeClassName="public-theme bg-site-canvas text-site-foreground"
            controlClassName="border border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
            activeTabClassName="bg-site-action text-site-on-action"
            inactiveTabClassName="text-site-foreground hover:bg-site-surface"
            focusClassName="focus-visible:outline-site-focus"
          />
        ) : null}
      </PageContainer>
    </div>
  );
}
