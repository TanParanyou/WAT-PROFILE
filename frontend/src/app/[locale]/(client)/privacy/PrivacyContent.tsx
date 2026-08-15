"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { PublicReadingPage } from "@/components/public/layout/PublicReadingPage";
import { PublicContentStateBoundary } from "@/features/public/content/components/PublicContentStateBoundary";
import { usePublicPrivacyQuery } from "@/features/public/content/queries";
import { toPublicQueryError } from "@/features/public/shared/query-error";
import { getLocalizedText } from "@/utils/localizedText";
import { PrivacyRequestModal } from "@/components/public/privacy/PrivacyRequestModal";

export default function PrivacyContent() {
  const locale = useLocale();
  const t = useTranslations("PrivacyPage");
  const query = usePublicPrivacyQuery();
  const page = query.data;
  const title = page ? getLocalizedText(page.title, locale) || t("title") : t("title");
  const lastUpdated = page?.body.last_updated || page?.updated_at;
  const subtitle = lastUpdated
    ? `${t("lastUpdated")}: ${new Date(lastUpdated).toLocaleDateString(locale)}`
    : undefined;

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <PublicReadingPage title={title} subtitle={subtitle}>
      <PublicContentStateBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        isFetching={query.isFetching}
        hasData={Boolean(page?.body.content)}
        isNotFound={
          query.error ? toPublicQueryError(query.error).kind === "not-found" : false
        }
        onRetry={() => query.refetch()}
        loading={<ReadingSkeleton />}
      >
        {page?.body.content ? (
          <div className="space-y-8">
            <RichTextContent value={page.body.content} locale={locale} defaultLocale="th" />

            {/* Privacy DSR Action Box */}
            <div className="border border-site-border bg-site-surface p-6 space-y-3 mt-8">
              <div className="flex items-center gap-2 text-site-action">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="text-base font-bold text-site-foreground">
                  {t("requestCtaTitle")}
                </h3>
              </div>
              <p className="text-xs text-site-muted leading-relaxed">
                {t("requestCtaDesc")}
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-site-action text-site-on-action text-xs font-semibold hover:bg-site-action-hover transition-colors"
                >
                  {t("requestCtaButton")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </PublicContentStateBoundary>

      <PrivacyRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </PublicReadingPage>
  );
}

function ReadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-label="Loading">
      <div className="space-y-3">
        <div className="h-7 w-2/3 rounded bg-primary/10" />
        <div className="h-4 w-full rounded bg-primary/10" />
        <div className="h-4 w-11/12 rounded bg-primary/10" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-1/2 rounded bg-primary/10" />
        <div className="h-4 w-full rounded bg-primary/10" />
        <div className="h-4 w-5/6 rounded bg-primary/10" />
      </div>
    </div>
  );
}
