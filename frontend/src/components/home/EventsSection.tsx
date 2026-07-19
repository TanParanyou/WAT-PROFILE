"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePublicEventsQuery } from "@/features/public/events/queries";
import { Link } from "@/navigation";
import { EventCard } from "@/components/public/EventCard";
import { EventsListSkeleton } from "@/features/public/events/components/EventsListSkeleton";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { EmptyState } from "@/components/public/states/EmptyState";

export type ScheduleItem = {
  time: string;
  title: { th: string; en: string; de: string };
  description?: { th: string; en: string; de: string };
};

export default function EventsSection() {
  const t = useTranslations("EventsSection");
  const state = useTranslations("PublicState");
  const locale = useLocale();
  const query = usePublicEventsQuery(3);

  return (
    <section className="border-t border-gray-100 bg-zinc-50 py-20 dark:border-gray-800 dark:bg-zinc-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-bold text-primary md:text-4xl">{t("title")}</h2>
            <p className="mt-3 text-pretty text-lg text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
          </div>
          <Link href="/events" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            {t("viewAll")}
          </Link>
        </div>
        {query.isLoading ? <EventsListSkeleton /> : query.isError ? <QueryErrorState title={state("errorTitle")} description={state("errorDescription")} retryLabel={state("retry")} onRetry={() => query.refetch()} isRetrying={query.isFetching} /> : query.data?.length ? <div className="grid grid-cols-1 gap-8 md:grid-cols-3">{query.data.slice(0, 3).map((event) => <EventCard key={event.slug} event={event} locale={locale} />)}</div> : <EmptyState title={state("emptyEvents")} description={state("emptyContent")} />}
      </div>
    </section>
  );
}
