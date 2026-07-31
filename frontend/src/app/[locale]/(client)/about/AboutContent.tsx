"use client";

import { usePublicAboutQuery } from "@/features/public/content/queries";
import { PublicContentStateBoundary } from "@/features/public/content/components/PublicContentStateBoundary";
import { PublicAboutPageLayout } from "@/components/public/website/PublicAboutPageLayout";

export default function AboutContent() {
  const query = usePublicAboutQuery();

  return (
    <PublicContentStateBoundary
      isLoading={query.isLoading}
      isError={query.isError}
      isFetching={query.isFetching}
      hasData={Boolean(query.data)}
      onRetry={() => query.refetch()}
      loading={<div className="min-h-screen animate-pulse bg-site-surface" />}
    >
      <PublicAboutPageLayout page={query.data ?? null} />
    </PublicContentStateBoundary>
  );
}
