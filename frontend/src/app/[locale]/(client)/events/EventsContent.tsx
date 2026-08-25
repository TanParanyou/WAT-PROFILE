"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { PublicSectionHeading } from "@/components/public/layout/PublicSectionHeading";
import { EmptyState } from "@/components/public/states/EmptyState";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { EventsList } from "@/features/public/events/components/EventsList";
import { SchedulesSection } from "@/features/public/events/components/SchedulesSection";
import { toEventListItem } from "@/features/public/events/mappers";
import { usePublicEventsQuery, usePublicSchedulesQuery } from "@/features/public/events/queries";
import { EventsListSkeleton } from "@/features/public/events/components/EventsListSkeleton";
import { PublicCalendarSection } from "@/features/calendar/integrations/wat/PublicCalendarSection";

type EventFilter = "upcoming" | "all" | "past";

export default function EventsContent() {
  const tPage = useTranslations("EventsPage");
  const tState = useTranslations("PublicState");
  const [filter, setFilter] = useState<EventFilter>("upcoming");

  const queryOptions = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    if (filter === "all") {
      return { from: "2000-01-01", to: "2099-12-31" };
    }
    if (filter === "past") {
      return { from: "2000-01-01", to: today };
    }
    return {};
  }, [filter]);

  const eventsQuery = usePublicEventsQuery(queryOptions);
  const schedulesQuery = usePublicSchedulesQuery();

  const events = useMemo(() => {
    const rawEvents = eventsQuery.data?.map(toEventListItem) ?? [];
    if (filter === "past") {
      return [...rawEvents].sort((a, b) => b.startDate.localeCompare(a.startDate));
    }
    return rawEvents;
  }, [eventsQuery.data, filter]);

  const schedules = schedulesQuery.data ?? [];

  const sectionTitle =
    filter === "upcoming"
      ? tPage("upcomingEvents")
      : filter === "past"
        ? tPage("pastEvents")
        : tPage("allEvents");

  return (
    <div className="min-h-screen bg-site-canvas">
      <PageHeader variant="color" align="left" width="content" title={tPage("title")} subtitle={tPage("subtitle")} />
      <PageContainer width="content">
        <section aria-labelledby="schedule-heading">
          <PublicSectionHeading id="schedule-heading" title={tPage("regularSchedule")} description={tPage("subtitle")} />
          <div className="mt-8">
            {schedulesQuery.isLoading ? <div className="grid animate-pulse gap-6 lg:grid-cols-2" aria-label={tState("loading")}><div className="h-64 bg-site-surface" /><div className="h-64 bg-site-surface" /></div> : schedulesQuery.isError ? <QueryErrorState title={tState("errorTitle")} description={tState("errorDescription")} retryLabel={tState("retry")} onRetry={() => schedulesQuery.refetch()} isRetrying={schedulesQuery.isFetching} /> : schedules.length === 0 ? <EmptyState title={tState("emptySchedules")} description={tState("emptyContent")} /> : <SchedulesSection schedules={schedules} />}
          </div>
        </section>
        <section className="mt-16 sm:mt-20" aria-labelledby="calendar-heading">
          <PublicSectionHeading
            id="calendar-heading"
            title={tPage("calendarTitle")}
            description={tPage("calendarDescription")}
          />
          <div className="mt-6">
            <PublicCalendarSection />
          </div>
        </section>
        <section className="mt-16 sm:mt-20" aria-labelledby="events-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <PublicSectionHeading id="events-heading" title={sectionTitle} description={tPage("subtitle")} />
            
            <div
              className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
              role="group"
              aria-label={tPage("viewLabel")}
            >
              <div className="flex min-w-max gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("upcoming")}
                  aria-pressed={filter === "upcoming"}
                  className={`min-h-11 border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${
                    filter === "upcoming"
                      ? "border-site-border bg-site-action text-site-on-action"
                      : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
                  }`}
                >
                  {tPage("upcomingEvents")}
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  aria-pressed={filter === "all"}
                  className={`min-h-11 border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${
                    filter === "all"
                      ? "border-site-border bg-site-action text-site-on-action"
                      : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
                  }`}
                >
                  {tPage("allEvents")}
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("past")}
                  aria-pressed={filter === "past"}
                  className={`min-h-11 border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${
                    filter === "past"
                      ? "border-site-border bg-site-action text-site-on-action"
                      : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
                  }`}
                >
                  {tPage("pastEvents")}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-8">
            {eventsQuery.isLoading ? <EventsListSkeleton /> : eventsQuery.isError ? <QueryErrorState title={tState("errorTitle")} description={tState("errorDescription")} retryLabel={tState("retry")} onRetry={() => eventsQuery.refetch()} isRetrying={eventsQuery.isFetching} /> : events.length === 0 ? <EmptyState title={tState("emptyEvents")} description={tState("emptyContent")} /> : <EventsList events={events} />}
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
