"use client";

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

export default function EventsContent() {
  const tPage = useTranslations("EventsPage");
  const tState = useTranslations("PublicState");
  const eventsQuery = usePublicEventsQuery();
  const schedulesQuery = usePublicSchedulesQuery();
  const events = eventsQuery.data?.map(toEventListItem) ?? [];
  const schedules = schedulesQuery.data ?? [];

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
                <div className="h-64 rounded-2xl bg-primary/10" />
                <div className="h-64 rounded-2xl bg-primary/10" />
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

        <section className="mt-20 border-t border-primary/15 pt-16" aria-labelledby="events-heading">
          <PublicSectionHeading
            id="events-heading"
            title={tPage("upcomingEvents")}
            description={tPage("subtitle")}
            action={
              eventsQuery.isFetching && eventsQuery.data ? (
                <span className="text-sm text-text-700" role="status">
                  {tState("refreshing")}
                </span>
              ) : null
            }
          />
          <div className="mt-8">
            {eventsQuery.isLoading ? (
              <EventsListSkeleton />
            ) : eventsQuery.isError ? (
              <QueryErrorState
                title={tState("errorTitle")}
                description={tState("errorDescription")}
                retryLabel={tState("retry")}
                onRetry={() => eventsQuery.refetch()}
                isRetrying={eventsQuery.isFetching}
              />
            ) : events.length === 0 ? (
              <EmptyState
                title={tState("emptyEvents")}
                description={tState("emptyContent")}
              />
            ) : (
              <EventsList events={events} />
            )}
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
