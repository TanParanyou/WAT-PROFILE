"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { format, startOfMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { de, enUS, th } from "date-fns/locale";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { PublicSectionHeading } from "@/components/public/layout/PublicSectionHeading";
import { EmptyState } from "@/components/public/states/EmptyState";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { EventsList } from "@/features/public/events/components/EventsList";
import { SchedulesSection } from "@/features/public/events/components/SchedulesSection";
import { toEventListItem, toPublicCalendarEvent } from "@/features/public/events/mappers";
import { usePublicEventsQuery, usePublicSchedulesQuery } from "@/features/public/events/queries";
import { EventsListSkeleton } from "@/features/public/events/components/EventsListSkeleton";
import { buildCalendarDays, getMonthGridRange } from "@/features/calendar/calendar-domain";
import { CalendarMonth } from "@/features/calendar/CalendarMonth";
import { CalendarViewToggle } from "@/features/calendar/CalendarViewToggle";
import type { CalendarEvent } from "@/features/calendar/calendar-domain";
import type { CalendarLabels } from "@/features/calendar/calendar-copy";
import { usePublicSiteSettings } from "@/features/public/settings/PublicSiteSettingsProvider";
import type { EventsView } from "@/features/public/settings/types";
import { EVENTS_VIEW_STORAGE_KEY, resolveEventsView } from "@/features/public/events/view-preference";

function subscribeToViewPreference(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getStoredViewPreference(): string | null {
  return window.localStorage.getItem(EVENTS_VIEW_STORAGE_KEY);
}

function getServerViewPreference(): string | null {
  return null;
}

export default function EventsContent() {
  const locale = useLocale();
  const tPage = useTranslations("EventsPage");
  const tState = useTranslations("PublicState");
  const siteSettings = usePublicSiteSettings();
  const storedView = useSyncExternalStore(
    subscribeToViewPreference,
    getStoredViewPreference,
    getServerViewPreference,
  );
  const [viewOverride, setViewOverride] = useState<EventsView | null>(null);
  const view = viewOverride ?? resolveEventsView(storedView, siteSettings.defaultEventsView);
  const [month, setMonth] = useState(() => startOfMonth(toZonedTime(new Date(), "Europe/Berlin")));
  const [selectedDate, setSelectedDate] = useState(() => format(toZonedTime(new Date(), "Europe/Berlin"), "yyyy-MM-dd"));
  const eventsQuery = usePublicEventsQuery();
  const weekStartsOn: 0 | 1 = locale === "th" ? 0 : 1;
  const visibleRange = useMemo(
    () => getMonthGridRange(month, weekStartsOn),
    [month, weekStartsOn],
  );
  const calendarQuery = usePublicEventsQuery({
    from: visibleRange.startDate,
    to: visibleRange.endDate,
  });
  const schedulesQuery = usePublicSchedulesQuery();
  const events = eventsQuery.data?.map(toEventListItem) ?? [];
  const calendarEvents = useMemo(
    () => calendarQuery.data?.map((event) => toPublicCalendarEvent(event, locale)) ?? [],
    [calendarQuery.data, locale],
  );
  const calendarDays = useMemo(
    () => buildCalendarDays(calendarEvents, visibleRange),
    [calendarEvents, visibleRange],
  );
  const schedules = schedulesQuery.data ?? [];

  const handleViewChange = (nextView: EventsView) => {
    setViewOverride(nextView);
    window.localStorage.setItem(EVENTS_VIEW_STORAGE_KEY, nextView);
    window.dispatchEvent(new StorageEvent("storage", { key: EVENTS_VIEW_STORAGE_KEY, newValue: nextView }));
  };

  const handleMonthChange = (nextMonth: Date) => {
    const normalizedMonth = startOfMonth(nextMonth);
    setMonth(normalizedMonth);
    setSelectedDate(format(normalizedMonth, "yyyy-MM-dd"));
  };

  const dateFnsLocale = locale === "th" ? th : locale === "de" ? de : enUS;
  const monthLabel = format(month, "LLLL yyyy", { locale: dateFnsLocale });
  const dayNames = [
    tPage("dayNames.sunday"),
    tPage("dayNames.monday"),
    tPage("dayNames.tuesday"),
    tPage("dayNames.wednesday"),
    tPage("dayNames.thursday"),
    tPage("dayNames.friday"),
    tPage("dayNames.saturday"),
  ];
  const calendarLabels: CalendarLabels = {
    previousMonth: tPage("previousMonth"),
    nextMonth: tPage("nextMonth"),
    today: tPage("today"),
    moreEvents: (count) => tPage("moreEvents", { count }),
    eventsCount: (count) => tPage("eventsCount", { count }),
    noEventsOnDate: tPage("noEventsOnDate"),
    calendarInstructions: tPage("calendarInstructions"),
    dayNames,
  };

  const renderCalendarEvent = (event: CalendarEvent, date: string) => {
    const className = "block min-h-8 w-full truncate border-l-2 border-site-accent bg-site-surface px-2 py-1 text-left text-xs text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-2 focus-visible:outline-site-focus";
    if (!event.href) return <span className={className}>{event.title}</span>;
    return <Link aria-label={`${event.title} ${date}`} className={className} href={event.href}>{event.title}</Link>;
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        variant="color"
        align="left"
        title={tPage("title")}
        subtitle={tPage("subtitle")}
      />
      <PageContainer width="content">
        <section aria-labelledby="schedule-heading">
          <PublicSectionHeading
            id="schedule-heading"
            title={tPage("regularSchedule")}
            description={tPage("subtitle")}
          />
          <div className="mt-8">
            {schedulesQuery.isLoading ? (
              <div className="grid animate-pulse gap-6 lg:grid-cols-2" aria-label={tState("loading")}>
                <div className="h-64 bg-site-surface" />
                <div className="h-64 bg-site-surface" />
              </div>
            ) : schedulesQuery.isError ? (
              <QueryErrorState
                title={tState("errorTitle")}
                description={tState("errorDescription")}
                retryLabel={tState("retry")}
                onRetry={() => schedulesQuery.refetch()}
                isRetrying={schedulesQuery.isFetching}
              />
            ) : schedules.length === 0 ? (
              <EmptyState
                title={tState("emptySchedules")}
                description={tState("emptyContent")}
              />
            ) : (
              <SchedulesSection schedules={schedules} />
            )}
          </div>
        </section>

        <section className="mt-20 border-t border-site-border pt-16" aria-labelledby="events-heading">
          <PublicSectionHeading
            id="events-heading"
            title={tPage("upcomingEvents")}
            description={tPage("subtitle")}
            action={
              <div className="flex flex-wrap items-center justify-end gap-3">
                {(view === "list" ? eventsQuery.isFetching && eventsQuery.data : calendarQuery.isFetching && calendarQuery.data) ? (
                  <span className="text-sm text-site-muted" role="status">
                    {tState("refreshing")}
                  </span>
                ) : null}
                <CalendarViewToggle
                  ariaLabel={tPage("viewLabel")}
                  labels={{ calendar: tPage("calendarView"), list: tPage("listView") }}
                  onChange={handleViewChange}
                  value={view}
                />
              </div>
            }
          />
          <div className="mt-8">
            {view === "list" && eventsQuery.isLoading ? (
              <EventsListSkeleton />
            ) : view === "list" && eventsQuery.isError ? (
              <QueryErrorState
                title={tState("errorTitle")}
                description={tState("errorDescription")}
                retryLabel={tState("retry")}
                onRetry={() => eventsQuery.refetch()}
                isRetrying={eventsQuery.isFetching}
              />
            ) : view === "list" && events.length === 0 ? (
              <EmptyState
                title={tState("emptyEvents")}
                description={tState("emptyContent")}
              />
            ) : view === "list" ? (
              <EventsList events={events} />
            ) : calendarQuery.isLoading ? (
              <div aria-label={tState("loading")} className="h-[34rem] animate-pulse bg-site-surface" />
            ) : calendarQuery.isError ? (
              <QueryErrorState
                title={tState("errorTitle")}
                description={tState("errorDescription")}
                retryLabel={tState("retry")}
                onRetry={() => calendarQuery.refetch()}
                isRetrying={calendarQuery.isFetching}
              />
            ) : calendarEvents.length === 0 ? (
              <EmptyState
                title={tState("emptyEvents")}
                description={tState("emptyContent")}
              />
            ) : (
              <CalendarMonth
                days={calendarDays}
                isLoading={calendarQuery.isFetching}
                labels={calendarLabels}
                month={month}
                monthLabel={monthLabel}
                onMonthChange={handleMonthChange}
                onSelectedDateChange={setSelectedDate}
                renderEvent={renderCalendarEvent}
                selectedDate={selectedDate}
                variant="public"
                weekStartsOn={weekStartsOn}
              />
            )}
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
