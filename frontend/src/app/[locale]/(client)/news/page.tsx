"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/public/states/EmptyState";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { ArticleCard } from "@/components/public/ArticleCard";
import { publicNewsService } from "@/services/newsService";
import { useLocalizedText } from "@/hooks/useLocalizedText";
import type { NewsCategory, NewsArticle } from "@/types/news";
import type { PaginatedResponse } from "@/types/api";

export default function NewsListingPage() {
  const t = useTranslations("news");
  const tState = useTranslations("PublicState");
  const getLocalizedText = useLocalizedText();

  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Fetch Categories
  const { data: categories = [] } = useQuery<NewsCategory[]>({
    queryKey: ["public-news-categories"],
    queryFn: publicNewsService.getCategories,
  });

  // Fetch Articles
  const {
    data: response,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<PaginatedResponse<NewsArticle>>({
    queryKey: ["public-news-articles", selectedCategory, searchQuery, currentPage],
    queryFn: () =>
      publicNewsService.getArticles({
        category_id: selectedCategory === "all" ? undefined : selectedCategory,
        search: searchQuery || undefined,
        page: currentPage,
        limit: 9,
      }),
  });

  const articles = response?.data || [];
  const pagination = response?.pagination;

  // Find Featured article on the first page when not searching
  const featuredArticle =
    selectedCategory === "all" && !searchQuery && currentPage === 1
      ? articles.find((a) => a.is_featured) || (articles.length > 0 ? articles[0] : null)
      : null;

  const regularArticles = featuredArticle
    ? articles.filter((a) => a.id !== featuredArticle.id)
    : articles;

  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="min-h-screen bg-site-canvas">
      {/* Standard Public PageHeader */}
      <PageHeader
        variant="color"
        density="compact"
        align="left"
        width="wide"
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {/* Standard Public PageContainer */}
      <PageContainer width="wide">
        <div className="space-y-10">
          {/* Controls: Search and Category Filter Tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-site-border pb-6">
            {/* Category Filter Tabs */}
            <div
              className="-mx-6 overflow-x-auto px-6 pb-2 sm:mx-0 sm:px-0 sm:pb-0"
              role="group"
              aria-label={t("allCategories")}
            >
              <div className="flex min-w-max gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setCurrentPage(1);
                  }}
                  aria-pressed={selectedCategory === "all"}
                  className={`min-h-11 border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${
                    selectedCategory === "all"
                      ? "border-site-border bg-site-action text-site-on-action"
                      : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
                  }`}
                >
                  {t("allCategories")}
                </button>
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setCurrentPage(1);
                      }}
                      aria-pressed={isActive}
                      className={`min-h-11 border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${
                        isActive
                          ? "border-site-border bg-site-action text-site-on-action"
                          : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
                      }`}
                    >
                      {getLocalizedText(cat.name)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-80 shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("searchPlaceholder")}
                className="w-full min-h-11 border border-site-border bg-site-canvas pl-10 pr-4 py-2 text-sm text-site-foreground placeholder:text-site-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
              />
              <Search className="size-4 text-site-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Loading Skeleton State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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

          {/* Error State */}
          {!isLoading && isError && (
            <QueryErrorState
              title={tState("errorTitle") || "เกิดข้อผิดพลาดในการโหลดข้อมูล"}
              description={tState("errorDescription") || "กรุณาลองใหม่อีกครั้ง"}
              retryLabel={tState("retry") || "ลองใหม่"}
              onRetry={() => refetch()}
              isRetrying={isFetching}
            />
          )}

          {/* Empty State */}
          {!isLoading && !isError && articles.length === 0 && (
            <EmptyState
              title={searchQuery ? t("noArticlesFound") : t("noArticlesInCategory")}
              description={tState("emptyContent") || "ยังไม่มีข้อมูลในส่วนนี้"}
            />
          )}

          {/* Article Display */}
          {!isLoading && !isError && articles.length > 0 && (
            <div className="space-y-10">
              {/* Featured Article Section */}
              {featuredArticle && (
                <div>
                  <ArticleCard article={featuredArticle} featured={true} />
                </div>
              )}

              {/* Regular Grid */}
              {regularArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {regularArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8 border-t border-site-border">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isCurrent = currentPage === pageNum;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        aria-current={isCurrent ? "page" : undefined}
                        className={`min-w-11 min-h-11 border px-3 text-sm font-mono font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus ${
                          isCurrent
                            ? "border-site-border bg-site-action text-site-on-action"
                            : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
