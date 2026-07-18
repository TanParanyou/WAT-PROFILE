"use client";

import { useTranslations } from "next-intl";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageHeader title={tPage("title")} subtitle={tPage("subtitle")} />
      <PageContainer>
        <div className="mx-auto mb-16 max-w-6xl space-y-10">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            {schedulesQuery.isLoading ? (
              <div className="space-y-4">
                <div className="h-6 w-48 rounded bg-gray-200" />
                <div className="h-40 rounded-2xl bg-gray-100" />
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
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-amber-600">
                  {tPage("upcomingEvents")}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">{tPage("title")}</h2>
              </div>
              {eventsQuery.isFetching && eventsQuery.data ? (
                <span className="text-sm text-gray-500">{tState("refreshing")}</span>
              ) : null}
            </div>

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
          </section>
        </div>
      </PageContainer>
    </div>
  );
}
