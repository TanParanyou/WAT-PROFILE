"use client";

import React from "react";
import { Link } from "@/navigation";
import { Calendar, ArrowRight, Tag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useLocalizedText } from "@/hooks/useLocalizedText";
import { PublicImage } from "@/components/public/media/PublicImage";
import type { NewsArticle } from "@/types/news";

interface ArticleCardProps {
  article: NewsArticle;
  featured?: boolean;
}

const fallbackNewsImage = "/images/hero-bg.png";

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const locale = useLocale();
  const t = useTranslations("news");
  const getLocalizedText = useLocalizedText();

  const title = getLocalizedText(article.title);
  const excerpt = getLocalizedText(article.excerpt);
  const categoryName = article.category ? getLocalizedText(article.category.name) : null;

  const dateStr = article.published_at || article.created_at;
  const formattedDate = dateStr
    ? new Intl.DateTimeFormat(locale === "th" ? "th-TH" : locale === "de" ? "de-DE" : "en-US", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(dateStr))
    : "";

  if (featured) {
    return (
      <article className="group border border-site-border bg-site-canvas grid grid-cols-1 lg:grid-cols-12 overflow-hidden transition-colors hover:border-site-foreground focus-within:outline-3 focus-within:outline-site-focus">
        {article.cover_image_url && (
          <div className="lg:col-span-7 relative min-h-[260px] sm:min-h-[360px] bg-site-surface overflow-hidden border-b lg:border-b-0 lg:border-r border-site-border">
            <PublicImage
              src={article.cover_image_url}
              alt={title}
              fill
              priority
              fallbackSrc={fallbackNewsImage}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          </div>
        )}
        <div
          className={`p-6 sm:p-8 lg:p-10 flex flex-col justify-between ${
            article.cover_image_url ? "lg:col-span-5" : "lg:col-span-12"
          }`}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 bg-site-action px-2.5 py-1 text-xs font-semibold text-site-on-action uppercase tracking-wider">
                {t("featuredBadge")}
              </span>
              {categoryName && (
                <span className="inline-flex items-center gap-1 border border-site-border bg-site-surface px-2.5 py-1 text-xs font-medium text-site-foreground">
                  <Tag className="size-3 text-site-accent" />
                  <span>{categoryName}</span>
                </span>
              )}
              {formattedDate && (
                <span className="inline-flex items-center gap-1 font-mono text-xs text-site-muted">
                  <Calendar className="size-3.5 text-site-muted" />
                  <span>{formattedDate}</span>
                </span>
              )}
            </div>

            <h2 className="font-heading text-2xl sm:text-3xl font-medium tracking-[-0.02em] text-site-foreground leading-snug group-hover:text-site-accent transition-colors">
              <Link href={`/news/${article.slug}`} className="focus:outline-none">
                {title}
              </Link>
            </h2>

            {excerpt && (
              <p className="text-site-body text-base leading-relaxed line-clamp-3">
                {excerpt}
              </p>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-site-border">
            <Link
              href={`/news/${article.slug}`}
              className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-action px-5 py-2.5 text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
            >
              <span>{t("readFullArticle")}</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group border border-site-border bg-site-canvas flex flex-col h-full overflow-hidden transition-colors hover:bg-site-surface/30 hover:border-site-foreground focus-within:outline-3 focus-within:outline-site-focus">
      {article.cover_image_url && (
        <div className="relative aspect-[16/10] bg-site-surface overflow-hidden border-b border-site-border">
          <PublicImage
            src={article.cover_image_url}
            alt={title}
            fill
            fallbackSrc={fallbackNewsImage}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {categoryName && (
              <span className="inline-flex items-center gap-1 border border-site-border bg-site-surface px-2 py-0.5 text-[11px] font-medium text-site-foreground">
                {categoryName}
              </span>
            )}
            {formattedDate && (
              <span className="font-mono text-[11px] text-site-muted">
                {formattedDate}
              </span>
            )}
          </div>

          <h3 className="font-heading text-lg sm:text-xl font-medium tracking-[-0.015em] text-site-foreground leading-snug group-hover:text-site-accent transition-colors line-clamp-2">
            <Link href={`/news/${article.slug}`} className="focus:outline-none">
              {title}
            </Link>
          </h3>

          {excerpt && (
            <p className="text-site-body text-sm leading-relaxed line-clamp-3">
              {excerpt}
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-site-border flex items-center justify-between">
          <Link
            href={`/news/${article.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-site-foreground group-hover:text-site-accent transition-colors focus-visible:outline-2 focus-visible:outline-site-focus"
          >
            <span>{t("readMore")}</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
