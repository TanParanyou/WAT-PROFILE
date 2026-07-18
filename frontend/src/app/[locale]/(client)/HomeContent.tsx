"use client";

import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/public/states/EmptyState";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { usePublicEventsQuery } from "@/features/public/events/queries";
import { usePublicMonksQuery } from "@/features/public/monks/queries";
import { PublicHomePageLayout } from "@/components/public/website/PublicHomePageLayout";
import type { PublicContentPage } from "@/types/website-cms";

interface HomeContentProps {
  page: PublicContentPage | null;
  labels: React.ComponentProps<typeof PublicHomePageLayout>["labels"];
}

export default function HomeContent({ page, labels }: HomeContentProps) {
  const locale = useLocale();
  const t = useTranslations("PublicState");
  const eventsQuery = usePublicEventsQuery(3);
  const monksQuery = usePublicMonksQuery();

  if (eventsQuery.isLoading || monksQuery.isLoading) {
    return <div className="min-h-screen animate-pulse bg-zinc-100 dark:bg-zinc-950" />;
  }

  if (eventsQuery.isError) {
    return <QueryErrorState title={t("errorTitle")} description={t("errorDescription")} retryLabel={t("retry")} onRetry={() => eventsQuery.refetch()} isRetrying={eventsQuery.isFetching} />;
  }

  if (monksQuery.isError) {
    return <QueryErrorState title={t("errorTitle")} description={t("errorDescription")} retryLabel={t("retry")} onRetry={() => monksQuery.refetch()} isRetrying={monksQuery.isFetching} />;
  }

  if (!eventsQuery.data?.length && !monksQuery.data?.length) {
    return <EmptyState title={t("emptyContent")} description={t("emptyContent")} />;
  }

  return <PublicHomePageLayout page={page} locale={locale} latestEvents={eventsQuery.data ?? []} monks={monksQuery.data ?? []} labels={labels} />;
}
