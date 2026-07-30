"use client";

import { useTranslations } from "next-intl";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/public/states/EmptyState";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { MonksGrid } from "@/features/public/monks/components/MonksGrid";
import { MonksGridSkeleton } from "@/features/public/monks/components/MonksGridSkeleton";
import { usePublicMonksQuery } from "@/features/public/monks/queries";
import { toMonkListItem } from "@/features/public/monks/mappers";

export default function MonksContent() {
  const t = useTranslations("MonksPage");
  const tState = useTranslations("PublicState");
  const monksQuery = usePublicMonksQuery();
  const monks = monksQuery.data?.map(toMonkListItem) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader variant="color" align="left" title={t("title")} subtitle={t("subtitle")} />
      <PageContainer width="content">
        {monksQuery.isLoading ? (
          <MonksGridSkeleton />
        ) : monksQuery.isError ? (
          <QueryErrorState
            title={tState("errorTitle")}
            description={tState("errorDescription")}
            retryLabel={tState("retry")}
            onRetry={() => monksQuery.refetch()}
            isRetrying={monksQuery.isFetching}
          />
        ) : monks.length === 0 ? (
          <EmptyState
            title={tState("emptyMonks")}
            description={tState("emptyContent")}
          />
        ) : (
          <MonksGrid monks={monks} />
        )}
      </PageContainer>
    </div>
  );
}
