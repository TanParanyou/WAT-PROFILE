"use client";

import React from "react";
import { Link } from "@/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { publicNewsService } from "@/services/newsService";
import { ArticleCard } from "@/components/public/ArticleCard";
import type { NewsArticle } from "@/types/news";

export default function HomeNewsSection() {
  const t = useTranslations("news");

  const { data: response, isLoading } = useQuery({
    queryKey: ["public-home-news"],
    queryFn: () => publicNewsService.getArticles({ limit: 3 }),
  });

  const articles: NewsArticle[] = response?.data || [];

  if (!isLoading && articles.length === 0) return null;

  return (
    <section className="border-t border-site-border bg-site-canvas px-6 py-[clamp(4rem,9vw,8rem)] text-site-foreground sm:px-10 lg:px-[8vw]">
      <div>
        {/* Section Header */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] border-b border-site-border pb-8">
          <div>
            <p className="text-sm font-semibold text-site-muted uppercase tracking-wider">
              {t("subtitle")}
            </p>
            <div className="mt-4">
              <Link
                href="/news"
                className="inline-flex items-center gap-2 text-sm font-semibold text-site-foreground hover:text-site-accent transition-colors focus-visible:outline-2 focus-visible:outline-site-focus"
              >
                <span>{t("viewAllNews")}</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <h2 className="max-w-[16ch] text-balance font-heading text-[clamp(2.3rem,4.8vw,4.7rem)] font-normal leading-[1.14] text-site-foreground">
            {t("latestNews")}
          </h2>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-site-border bg-site-canvas">
                <div className="aspect-[16/10] bg-site-surface" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-24 bg-site-surface" />
                  <div className="h-6 w-3/4 bg-site-surface" />
                  <div className="h-4 w-full bg-site-surface" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* News Grid */}
        {!isLoading && articles.length > 0 && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
