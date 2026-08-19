import React from "react";
import { Link } from "@/navigation";
import { getGuideArticleBySlug } from "@/data/admin-guide";
import { GuideIcon } from "./guideIcons";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";

interface GuideQuickLinksProps {
  relatedSlugs: string[];
}

export function GuideQuickLinks({ relatedSlugs }: GuideQuickLinksProps) {
  const locale = useLocale() as "th" | "en" | "de";
  const t = useTranslations("Admin.guide");

  if (!relatedSlugs || relatedSlugs.length === 0) return null;

  const articles = relatedSlugs
    .map((slug) => getGuideArticleBySlug(slug))
    .filter(Boolean);

  if (articles.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-admin-border print:hidden">
      <h3 className="text-base font-bold text-admin-foreground mb-4">
        {t("relatedGuides")}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articles.map((article) => {
          if (!article) return null;

          return (
            <Link
              key={article.slug}
              href={`/admin/guide/${article.slug}`}
              className="flex items-start gap-3 p-4 bg-admin-surface border border-admin-border hover:border-admin-action hover:bg-admin-surface-muted transition-colors group"
            >
              <div className="p-2 bg-admin-surface-muted border border-admin-border text-admin-muted group-hover:text-admin-action group-hover:border-admin-action transition-colors">
                <GuideIcon name={article.iconName} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-admin-foreground group-hover:text-admin-action transition-colors truncate">
                  {article.title[locale]}
                </h4>
                <p className="text-xs text-admin-muted line-clamp-2 mt-1">
                  {article.summary[locale]}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-admin-muted group-hover:text-admin-action group-hover:translate-x-0.5 transition-all self-center flex-shrink-0"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
