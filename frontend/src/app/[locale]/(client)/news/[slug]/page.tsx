"use client";

import React from "react";
import { Link } from "@/navigation";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, User, ArrowLeft, Tag, Image as ImageIcon } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import { publicNewsService } from "@/services/newsService";
import { ShareButtons } from "@/components/public/ShareButtons";
import { ArticleCard } from "@/components/public/ArticleCard";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { useLocalizedText } from "@/hooks/useLocalizedText";
import { PublicImage } from "@/components/public/media/PublicImage";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import type { NewsArticle } from "@/types/news";

const fallbackNewsImage = "/images/hero-bg.png";

export default function NewsDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = useLocale();
  const t = useTranslations("news");
  const getLocalizedText = useLocalizedText();

  // Fetch Current Article
  const {
    data: article,
    isLoading,
    error,
  } = useQuery<NewsArticle>({
    queryKey: ["public-news-detail", slug],
    queryFn: () => publicNewsService.getArticleBySlug(slug),
    enabled: Boolean(slug),
  });

  // Fetch Related Articles
  const { data: relatedResponse } = useQuery({
    queryKey: ["public-news-related", article?.category_id],
    queryFn: () =>
      publicNewsService.getArticles({
        category_id: article?.category_id || undefined,
        limit: 3,
      }),
    enabled: Boolean(article?.category_id),
  });

  const relatedArticles = (relatedResponse?.data || [])
    .filter((a) => a.id !== article?.id)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-site-canvas flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin size-6 border-2 border-site-foreground border-t-transparent" />
          <p className="text-sm text-site-muted">กำลังโหลดบทความ...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-site-canvas py-20 px-4">
        <div className="max-w-2xl mx-auto text-center border border-site-border bg-site-canvas p-10 space-y-5">
          <h1 className="font-heading text-2xl font-semibold text-site-foreground">
            ไม่พบบทความที่คุณค้นหา
          </h1>
          <p className="text-sm text-site-body">
            บทความนี้อาจถูกย้าย ลบ หรือไม่มีอยู่ในระบบ
          </p>
          <div className="pt-2">
            <Link
              href="/news"
              className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-action px-5 py-2.5 text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action/90"
            >
              <ArrowLeft className="size-4" />
              <span>{t("backToNews")}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const title = getLocalizedText(article.title);
  const excerpt = getLocalizedText(article.excerpt);
  const categoryName = article.category ? getLocalizedText(article.category.name) : null;
  const author = article.author_name || "วัดหลวงพ่อใส";

  const dateStr = article.published_at || article.created_at;
  const formattedDate = dateStr
    ? new Intl.DateTimeFormat(locale === "th" ? "th-TH" : locale === "de" ? "de-DE" : "en-US", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(dateStr))
    : "";

  return (
    <article className="min-h-screen bg-site-canvas text-site-foreground">
      {/* Entity Analytics Tracker */}
      <AnalyticsTracker resourceType="news" resourceId={article.id} />

      {/* Header & Breadcrumb Section */}
      <header className="border-b border-site-border bg-site-surface pb-12 pt-24 md:pb-14 md:pt-28">
        <div className="mx-auto w-full max-w-4xl px-6 sm:px-10 space-y-6">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-semibold text-site-muted hover:text-site-foreground transition-colors focus-visible:outline-2 focus-visible:outline-site-focus"
          >
            <ArrowLeft className="size-4" />
            <span>{t("backToNews")}</span>
          </Link>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {categoryName && (
                <span className="inline-flex items-center gap-1 border border-site-border bg-site-canvas px-2.5 py-1 font-medium text-site-foreground">
                  <Tag className="size-3 text-site-accent" />
                  <span>{categoryName}</span>
                </span>
              )}
              {formattedDate && (
                <span className="inline-flex items-center gap-1 font-mono text-site-muted">
                  <Calendar className="size-3.5 text-site-muted" />
                  <span>{formattedDate}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-site-muted">
                <User className="size-3.5 text-site-muted" />
                <span>{author}</span>
              </span>
            </div>

            <h1 className="font-heading text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.15] tracking-[-0.03em] text-site-foreground text-balance">
              {title}
            </h1>

            {excerpt && (
              <p className="text-lg sm:text-xl text-site-body leading-relaxed max-w-3xl pt-2 border-l-2 border-site-accent pl-4 italic text-pretty">
                {excerpt}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <PageContainer width="wide">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Cover Photo */}
          {article.cover_image_url && (
            <div className="relative w-full aspect-[16/9] bg-site-surface border border-site-border overflow-hidden">
              <PublicImage
                src={article.cover_image_url}
                alt={title}
                fill
                priority
                fallbackSrc={fallbackNewsImage}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 896px"
              />
            </div>
          )}

          {/* Article Rich Text Body */}
          <div className="prose prose-site max-w-none text-site-body text-base sm:text-lg leading-relaxed space-y-6">
            <RichTextContent
              value={article.content}
              locale={locale}
              defaultLocale="th"
              className="prose-site max-w-none"
            />
          </div>

          {/* Photo Gallery Grid (if present) */}
          {article.gallery_urls && article.gallery_urls.length > 0 && (
            <section className="pt-8 border-t border-site-border space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-site-foreground">
                <ImageIcon className="size-4 text-site-accent" />
                <span>{t("gallery")}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {article.gallery_urls.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-[4/3] bg-site-surface border border-site-border overflow-hidden group"
                  >
                    <PublicImage
                      src={url}
                      alt={`${title} photo ${index + 1}`}
                      fill
                      fallbackSrc={fallbackNewsImage}
                      className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Social Share Buttons */}
          <div className="pt-6 border-t border-site-border">
            <ShareButtons title={title} description={excerpt} />
          </div>

          {/* Related Articles Section */}
          {relatedArticles.length > 0 && (
            <section className="pt-12 border-t border-site-border space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-medium text-site-foreground">
                    {t("relatedNews")}
                  </h2>
                </div>
                <Link
                  href="/news"
                  className="text-sm font-semibold text-site-accent hover:underline focus-visible:outline-2 focus-visible:outline-site-focus"
                >
                  {t("viewAllNews")} &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((rel) => (
                  <ArticleCard key={rel.id} article={rel} />
                ))}
              </div>
            </section>
          )}
        </div>
      </PageContainer>
    </article>
  );
}
