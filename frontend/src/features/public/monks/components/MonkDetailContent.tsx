"use client";

import { User } from "lucide-react";
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
        <div className="overflow-hidden border border-[#333] bg-[#fffef2] lg:sticky lg:top-24">
          <div className="relative aspect-[3/4] bg-[#f7ecdd]">
            <PublicImage
              src={imageUrl}
              alt={getLocalizedText(monk.name, locale)}
              fill
              fallbackSrc={publicMonkFallbackImage}
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 33vw"
            />
          </div>
          {monk.title ? <div className="border-t border-[#333] p-6">
            <div className="flex items-center gap-3 text-[#505050]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#333] text-[#945c26]">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#666]">{t("role")}</p>
                <p className="font-medium">{getLocalizedText(monk.title, locale)}</p>
              </div>
            </div>
          </div> : null}
        </div>
      </div>

      <div className="lg:col-span-8">
        <article className="border border-[#333] bg-[#fffef2] p-8 md:p-12">
          <h2 className="mb-8 font-heading text-3xl font-medium text-[#333] md:text-4xl">
            {t("biography")}
          </h2>
          <div className="max-w-[75ch]">
            {monk.bio ? (
              <RichTextContent value={monk.bio} locale={locale} defaultLocale="th" />
            ) : (
              <p className="text-sm text-[#666]">{tState("emptyContent")}</p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
