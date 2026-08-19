"use client";

import React from "react";
import { Link, usePathname } from "@/navigation";
import { guideCategories, getGuideArticlesByCategory } from "@/data/admin-guide";
import { GuideIcon } from "./guideIcons";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import type { GuideCategory } from "@/types/adminGuide";

import { usePermission } from "@/hooks/usePermission";

interface GuideCategoryNavProps {
  currentCategory?: GuideCategory;
  currentSlug?: string;
  onItemClick?: () => void;
  className?: string;
}

export function GuideCategoryNav({
  currentSlug,
  onItemClick,
  className,
}: GuideCategoryNavProps) {
  const locale = useLocale() as "th" | "en" | "de";
  const t = useTranslations("Admin.guide");
  const pathname = usePathname();
  const { isSuperAdmin } = usePermission();

  const isHubHome = pathname === "/admin/guide" || pathname.endsWith("/admin/guide");

  return (
    <nav className={cn("space-y-4", className)}>
      {/* All Guides Hub link */}
      <div>
        <Link
          href="/admin/guide"
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-none text-sm transition-colors border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus min-h-11",
            isHubHome
              ? "bg-admin-selected text-admin-selected-foreground border-admin-selected font-medium"
              : "bg-admin-surface text-admin-foreground border-admin-border hover:bg-admin-surface-muted",
          )}
        >
          <span className="font-semibold">
            {t("allArticlesHub")}
          </span>
        </Link>
      </div>

      {/* Category Groups */}
      <div className="space-y-4">
        {guideCategories.map((category) => {
          const articles = getGuideArticlesByCategory(category.id).filter(
            (a) => !a.superAdminOnly || isSuperAdmin,
          );

          if (articles.length === 0) return null;

          return (
            <div key={category.id} className="space-y-1">
              <div className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-admin-muted uppercase tracking-wider">
                <GuideIcon name={category.iconName} size={14} className="text-admin-muted" />
                <span>{category.title[locale]}</span>
                <span className="ml-auto text-[10px] bg-admin-surface-muted px-1.5 py-0.5 border border-admin-border text-admin-muted">
                  {articles.length}
                </span>
              </div>

              <div className="space-y-0.5 pl-2">
                {articles.map((article) => {
                  const isArticleActive = currentSlug === article.slug;

                  return (
                    <Link
                      key={article.slug}
                      href={`/admin/guide/${article.slug}`}
                      onClick={onItemClick}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-none text-xs sm:text-sm transition-colors border border-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus min-h-10",
                        isArticleActive
                          ? "bg-admin-selected text-admin-selected-foreground font-medium border-admin-selected"
                          : "text-admin-body hover:bg-admin-surface-muted hover:text-admin-foreground",
                      )}
                    >
                      <GuideIcon name={article.iconName} size={16} className="flex-shrink-0" />
                      <span className="truncate">{article.title[locale]}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
