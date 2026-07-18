"use client";

import { useLocale, useTranslations } from "next-intl";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { PublicContentStateBoundary } from "@/features/public/content/components/PublicContentStateBoundary";
import { usePublicPrivacyQuery } from "@/features/public/content/queries";
import { getLocalizedText } from "@/utils/localizedText";
import { toPublicQueryError } from "@/features/public/shared/query-error";

export default function PrivacyContent() {
  const locale = useLocale();
  const t = useTranslations("PrivacyPage");
  const query = usePublicPrivacyQuery();
  const page = query.data;
  const title = page ? getLocalizedText(page.title, locale) || t("title") : t("title");
  const lastUpdated = page?.body.last_updated || page?.updated_at;
  const subtitle = lastUpdated ? `${t("lastUpdated")}: ${new Date(lastUpdated).toLocaleDateString(locale)}` : undefined;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageHeader title={title} subtitle={subtitle} />
      <PageContainer>
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-zinc-900 md:p-16">
          <div className="prose prose-lg mx-auto max-w-3xl dark:prose-invert">
            <PublicContentStateBoundary
              isLoading={query.isLoading}
              isError={query.isError}
              isFetching={query.isFetching}
              hasData={Boolean(page?.body.content)}
              isNotFound={query.error ? toPublicQueryError(query.error).kind === "not-found" : false}
              onRetry={() => query.refetch()}
              loading={<div className="h-96 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />}
            >
              {page?.body.content ? <RichTextContent value={page.body.content} locale={locale} defaultLocale="th" /> : null}
            </PublicContentStateBoundary>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
