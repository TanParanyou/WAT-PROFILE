"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePublicEventsQuery } from "@/features/public/events/queries";
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
    <section className="border-t border-[#333] bg-[#fffef2] px-6 py-[clamp(4rem,9vw,8rem)] text-[#333] sm:px-10 lg:px-[8vw]"><div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><p className="text-sm text-[#666]">{t("subtitle")}</p><h2 className="max-w-[16ch] text-balance font-heading text-[clamp(2.3rem,4.8vw,4.7rem)] font-normal leading-[1.14]">{t("title")}</h2></div>
        <div className="mt-16">{query.isLoading ? <EventsListSkeleton /> : query.isError ? <QueryErrorState title={state("errorTitle")} description={state("errorDescription")} retryLabel={state("retry")} onRetry={() => query.refetch()} isRetrying={query.isFetching} /> : query.data?.length ? <div className="grid grid-cols-1 border-t border-[#333] md:grid-cols-3">{query.data.slice(0, 3).map((event) => <EventCard key={event.slug} event={event} locale={locale} />)}</div> : <EmptyState title={state("emptyEvents")} description={state("emptyContent")} />}</div>
      </div>
    </section>
  );
}
