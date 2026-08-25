"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { BookOpen, Music, Search, ChevronRight, Clock } from "lucide-react";
import type { Chanting, ChantingCategory } from "@/types/chanting";

interface ChantingCatalogProps {
  initialChantings: Chanting[];
  locale: "th" | "en" | "de";
}

const CATEGORIES: ChantingCategory[] = [
  "all",
  "morning_chant",
  "evening_chant",
  "paritta",
  "blessing",
  "funeral",
  "general",
];

export function ChantingCatalog({
  initialChantings,
  locale,
}: ChantingCatalogProps) {
  const t = useTranslations("Chanting");
  const [selectedCategory, setSelectedCategory] = useState<ChantingCategory>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredChantings = useMemo(() => {
    return initialChantings.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const titleTh = (item.title?.th || "").toLowerCase();
        const titleEn = (item.title?.en || "").toLowerCase();
        const titleDe = (item.title?.de || "").toLowerCase();
        const paliThai = (item.pali_thai || "").toLowerCase();
        const paliRoman = (item.pali_roman || "").toLowerCase();

        return (
          titleTh.includes(query) ||
          titleEn.includes(query) ||
          titleDe.includes(query) ||
          paliThai.includes(query) ||
          paliRoman.includes(query)
        );
      }

      return true;
    });
  }, [initialChantings, selectedCategory, searchTerm]);

  return (
    <div className="space-y-8">
      {/* Search & Category Filter Section */}
      <section aria-label="Filters" className="border border-site-border bg-site-surface/40 p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-site-muted"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-full border border-site-border bg-site-canvas py-2.5 pl-10 pr-4 text-sm text-site-foreground placeholder:text-site-muted rounded-none focus-visible:outline-2 focus-visible:outline-site-focus"
            />
          </div>

          {/* Result Count */}
          <p className="text-xs font-mono text-site-muted tabular-nums">
            {t("totalCount", { count: filteredChantings.length })}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-site-border pt-4">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded-none focus-visible:outline-2 focus-visible:outline-site-focus ${
                  isActive
                    ? "border-site-border bg-site-action text-site-on-action"
                    : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
                }`}
              >
                {t(`categories.${cat}`)}
              </button>
            );
          })}
        </div>
      </section>

      {/* Chanting Cards Grid */}
      <main>
        {filteredChantings.length === 0 ? (
          <div className="border border-dashed border-site-border p-12 text-center">
            <BookOpen size={36} className="mx-auto text-site-muted mb-3 opacity-60" />
            <p className="text-sm font-medium text-site-muted">{t("noChantsFound")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {filteredChantings.map((item) => {
              const title =
                item.title?.[locale] ||
                item.title?.th ||
                item.title?.en ||
                item.slug;

              const subtitle =
                item.subtitle?.[locale] ||
                item.subtitle?.th ||
                item.subtitle?.en;

              return (
                <article
                  key={item.id}
                  className="group flex flex-col justify-between border border-site-border bg-site-canvas p-6 transition-all hover:border-site-foreground/60 hover:shadow-md"
                >
                  <div>
                    {/* Tags */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="border border-site-border bg-site-surface px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-site-muted">
                        {t(`categories.${item.category}`)}
                      </span>

                      <div className="flex items-center gap-2 text-[11px] text-site-muted font-mono">
                        {item.audio_url ? (
                          <span className="inline-flex items-center gap-1 text-site-accent font-semibold">
                            <Music size={12} aria-hidden />
                            <span>{t("audioAvailable")}</span>
                          </span>
                        ) : null}
                        {item.duration_seconds > 0 && (
                          <span className="inline-flex items-center gap-1 text-site-muted">
                            <Clock size={11} aria-hidden />
                            <span>{Math.round(item.duration_seconds / 60)} min</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chant Title */}
                    <h3 className="mt-3.5 font-heading text-lg sm:text-xl font-bold text-site-foreground group-hover:text-site-accent transition-colors leading-snug">
                      <Link
                        href={`/chanting/${item.slug}`}
                        className="focus-visible:outline-2 focus-visible:outline-site-focus"
                      >
                        {title}
                      </Link>
                    </h3>

                    {/* Chant Subtitle / Excerpt */}
                    {subtitle && (
                      <p className="mt-2 text-xs sm:text-sm text-site-muted leading-relaxed line-clamp-2">
                        {subtitle}
                      </p>
                    )}

                    {/* Pali Preview Snippet */}
                    <div className="mt-3.5 border-l-2 border-site-accent/40 pl-3 py-1 font-heading text-xs sm:text-sm text-site-foreground/80 italic line-clamp-2">
                      {locale === "th" ? item.pali_thai : item.pali_roman}
                    </div>
                  </div>

                  {/* Card Footer Action */}
                  <div className="mt-5 border-t border-site-border/60 pt-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-site-muted group-hover:text-site-foreground transition-colors">
                      {t("readAndListen")}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-site-muted group-hover:translate-x-1 group-hover:text-site-accent transition-all"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
