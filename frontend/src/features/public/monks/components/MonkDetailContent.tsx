"use client";

import { Quote, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
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
        <div className="sticky top-24 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl shadow-primary/5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative aspect-[3/4] bg-zinc-100 dark:bg-zinc-800">
            <PublicImage
              src={imageUrl}
              alt={getLocalizedText(monk.name, locale)}
              fill
              fallbackSrc={publicMonkFallbackImage}
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 33vw"
            />
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500">{t("role")}</p>
                <p className="font-medium">{monk.title ? getLocalizedText(monk.title, locale) : "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-zinc-900 md:p-12">
          <Quote className="mb-4 h-16 w-16 text-primary/20" />
          <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            {t("biography")}
          </h2>
          <div className="mb-8 h-1.5 w-20 rounded-full bg-primary" />
          {monk.bio ? (
            <RichTextContent value={monk.bio} locale={locale} defaultLocale="th" />
          ) : (
            <p className="text-sm text-gray-500">{tState("emptyContent")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
