"use client";

import { User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { isRichTextDocumentEmpty, getLocalizedRichText as getRichTextDoc } from "@/lib/rich-text/document";
import { getLocalizedText } from "../mappers";
import type { PublicMonkDto } from "../types";
import { usePublicMonkQuery } from "../queries";
import { EmptyState } from "@/components/public/states/EmptyState";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { PublicImage } from "@/components/public/media/PublicImage";
import { publicMonkFallbackImage } from "@/components/public/media/publicImageFallbacks";
import { MonkDetailSkeleton } from "./MonkDetailSkeleton";

interface MonkDetailContentProps {
  slug: string;
  initialMonk?: PublicMonkDto;
}

export function MonkDetailContent({ slug, initialMonk }: MonkDetailContentProps) {
  const locale = useLocale();
  const t = useTranslations("MonksPage");
  const tState = useTranslations("PublicState");
  const monkQuery = usePublicMonkQuery(slug, initialMonk);

  if (monkQuery.isLoading) return <MonkDetailSkeleton />;

  if (monkQuery.isError) {
    return (
      <QueryErrorState
        title={tState("errorTitle")}
        description={tState("errorDescription")}
        retryLabel={tState("retry")}
        onRetry={() => monkQuery.refetch()}
        isRetrying={monkQuery.isFetching}
      />
    );
  }

  if (!monkQuery.data) {
    return <EmptyState title={tState("emptyMonks")} description={tState("emptyContent")} />;
  }

  const monk = monkQuery.data;
  const imageUrl = monk.image_url;

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="overflow-hidden border border-site-border bg-site-canvas lg:sticky lg:top-24">
          <div className="relative aspect-[3/4] bg-site-surface">
            <PublicImage
              src={imageUrl}
              alt={getLocalizedText(monk.name, locale)}
              fill
              fallbackSrc={publicMonkFallbackImage}
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 33vw"
            />
          </div>
          <div className="border-t border-site-border divide-y divide-site-border">
            {monk.dharma_name && getLocalizedText(monk.dharma_name, locale) ? (
              <div className="p-6">
                <p className="text-xs font-bold text-site-muted">{t("dharmaName")}</p>
                <p className="font-medium text-site-foreground text-base">
                  {getLocalizedText(monk.dharma_name, locale)}
                </p>
              </div>
            ) : null}

            {monk.title && getLocalizedText(monk.title, locale) ? (
              <div className="p-6">
                <div className="flex items-center gap-3 text-site-body">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-site-border text-site-accent">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-site-muted">{t("role")}</p>
                    <p className="font-medium text-site-foreground">{getLocalizedText(monk.title, locale)}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {monk.education && getLocalizedText(monk.education, locale) ? (
              <div className="p-6">
                <p className="text-xs font-bold text-site-muted">{t("education")}</p>
                <p className="font-medium text-site-foreground text-sm">
                  {getLocalizedText(monk.education, locale)}
                </p>
              </div>
            ) : null}

            {monk.ordination_date ? (
              <div className="p-6">
                <p className="text-xs font-bold text-site-muted">{t("ordinationDate")}</p>
                <p className="font-medium text-site-foreground text-sm">
                  {monk.ordination_date.split("T")[0]}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <article className="border border-site-border bg-site-canvas p-8 md:p-12">
          <h2 className="mb-8 font-heading text-3xl font-medium text-site-foreground md:text-4xl">
            {t("biography")}
          </h2>
          <div className="max-w-[75ch]">
            {monk.bio && !isRichTextDocumentEmpty(getRichTextDoc(monk.bio, locale, "th")) ? (
              <RichTextContent value={monk.bio} locale={locale} defaultLocale="th" />
            ) : (
              <p className="text-sm text-site-muted">{tState("emptyContent")}</p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
