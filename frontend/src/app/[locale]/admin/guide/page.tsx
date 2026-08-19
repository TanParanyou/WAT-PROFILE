"use client";

import React, { useState } from "react";
import { Link } from "@/navigation";
import { guideCategories, allGuideArticles, searchGuideArticles } from "@/data/admin-guide";
import { GuideIcon } from "@/components/admin/guide/guideIcons";
import { GuidePrintHeader } from "@/components/admin/guide/GuidePrintHeader";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  BookOpen,
  ChevronRight,
  Printer,
  Sparkles,
  Compass,
  ArrowUpRight,
} from "lucide-react";

export default function GuideHubPage() {
  const t = useTranslations("Admin.guide");
  const locale = useLocale() as "th" | "en" | "de";
  const [filterQuery, setFilterQuery] = useState("");

  const filteredArticles = filterQuery.trim()
    ? searchGuideArticles(filterQuery, locale)
    : null;

  return (
    <div className="space-y-8">
      {/* Print-only Full Manual Header */}
      <GuidePrintHeader />

      {/* Hero Welcome Banner */}
      <div className="bg-admin-surface border border-admin-border p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-admin-surface-muted border border-admin-border text-xs font-semibold text-admin-foreground">
              <Sparkles size={14} className="text-admin-action" />
              <span>WAT-PROFILE Knowledge Base</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-admin-foreground tracking-tight">
              {t("hubTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-admin-body leading-relaxed">
              {t("hubSubtitle")}
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-admin-surface border border-admin-border hover:bg-admin-surface-muted text-admin-foreground text-xs sm:text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus min-h-10 cursor-pointer print:hidden"
            title={t("printHandbook")}
          >
            <Printer size={16} />
            <span>{t("printHandbook")}</span>
          </button>
        </div>

        {/* In-page Filter / Search Input */}
        <div className="relative print:hidden">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none"
          />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-10 pr-4 py-3 bg-admin-surface-muted border border-admin-border text-admin-foreground placeholder:text-admin-muted text-sm focus:bg-admin-surface focus:border-admin-action outline-hidden transition-colors"
          />
        </div>
      </div>

      {/* Search Results (if active) */}
      {filteredArticles ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-admin-foreground">
              {t("searchResultsFor", { query: filterQuery, count: filteredArticles.length })}
            </h2>
            <button
              onClick={() => setFilterQuery("")}
              className="text-xs text-admin-action hover:underline cursor-pointer"
            >
              {t("clearSearch")}
            </button>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((article) => {
                return (
                  <Link
                    key={article.slug}
                    href={`/admin/guide/${article.slug}`}
                    className="p-5 bg-admin-surface border border-admin-border hover:border-admin-action transition-all flex items-start gap-4 group"
                  >
                    <div className="p-2.5 bg-admin-surface-muted border border-admin-border text-admin-action group-hover:bg-admin-action group-hover:text-white transition-colors">
                      <GuideIcon name={article.iconName} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-admin-surface-muted border border-admin-border text-admin-muted">
                          {article.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-admin-foreground group-hover:text-admin-action transition-colors mt-1.5">
                        {article.title[locale]}
                      </h3>
                      <p className="text-xs text-admin-muted line-clamp-2 mt-1">
                        {article.summary[locale]}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-admin-muted group-hover:text-admin-action group-hover:translate-x-0.5 transition-all self-center"
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-admin-surface border border-admin-border text-admin-muted">
              <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t("noResults")}</p>
            </div>
          )}
        </section>
      ) : (
        /* Normal Category Cards View */
        <div className="space-y-10">
          {/* Quick Start Box */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Compass size={18} className="text-admin-action" />
              <h2 className="text-base font-bold text-admin-foreground uppercase tracking-wider">
                {t("quickStart")}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allGuideArticles.slice(0, 3).map((article) => {
                return (
                  <Link
                    key={article.slug}
                    href={`/admin/guide/${article.slug}`}
                    className="p-4 bg-admin-surface border border-admin-border hover:border-admin-action hover:bg-admin-surface-muted/50 transition-colors flex flex-col justify-between group min-h-32"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2 bg-admin-surface-muted border border-admin-border text-admin-action group-hover:text-admin-foreground">
                        <GuideIcon name={article.iconName} size={18} />
                      </div>
                      <ArrowUpRight
                        size={16}
                        className="text-admin-muted group-hover:text-admin-action transition-colors"
                      />
                    </div>
                    <div className="mt-3">
                      <h3 className="font-bold text-sm text-admin-foreground group-hover:text-admin-action transition-colors">
                        {article.title[locale]}
                      </h3>
                      <p className="text-xs text-admin-muted line-clamp-1 mt-0.5">
                        {article.summary[locale]}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* All Categories Grid */}
          <section className="space-y-6">
            <div className="border-b border-admin-border pb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-admin-foreground">
                {t("categories")} ({guideCategories.length})
              </h2>
              <span className="text-xs text-admin-muted">
                {t("allArticlesTotal", { count: allGuideArticles.length })}
              </span>
            </div>

            <div className="space-y-8">
              {guideCategories.map((category) => {
                const articles = allGuideArticles.filter(
                  (a) => a.category === category.id,
                );

                return (
                  <div
                    key={category.id}
                    className="bg-admin-surface border border-admin-border p-6 space-y-4 shadow-2xs"
                  >
                    <div className="flex items-start gap-3 pb-3 border-b border-admin-border/60">
                      <div className="p-2.5 bg-admin-surface-muted border border-admin-border text-admin-action">
                        <GuideIcon name={category.iconName} size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-admin-foreground">
                          {category.title[locale]}
                        </h3>
                        <p className="text-xs text-admin-muted mt-0.5">
                          {category.description[locale]}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {articles.map((article) => {
                        return (
                          <Link
                            key={article.slug}
                            href={`/admin/guide/${article.slug}`}
                            className="p-3.5 bg-admin-surface-muted/40 border border-admin-border hover:border-admin-action hover:bg-admin-surface transition-colors flex items-start gap-3 group"
                          >
                            <GuideIcon
                              name={article.iconName}
                              size={16}
                              className="text-admin-muted group-hover:text-admin-action transition-colors mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-semibold text-admin-foreground group-hover:text-admin-action transition-colors truncate">
                                {article.title[locale]}
                              </h4>
                              <p className="text-[11px] text-admin-muted line-clamp-1 mt-0.5">
                                {article.summary[locale]}
                              </p>
                            </div>
                            <ChevronRight
                              size={14}
                              className="text-admin-muted group-hover:text-admin-action transition-colors self-center flex-shrink-0"
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
