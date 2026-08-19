import React from "react";
import { useTranslations, useLocale } from "next-intl";

interface GuidePrintHeaderProps {
  articleTitle?: string;
  categoryTitle?: string;
}

export function GuidePrintHeader({
  articleTitle,
  categoryTitle,
}: GuidePrintHeaderProps) {
  const t = useTranslations("Admin.guide");
  const locale = useLocale();
  const currentDate = new Date().toLocaleDateString(
    locale === "th" ? "th-TH" : locale === "de" ? "de-DE" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <div className="hidden print:block mb-8 pb-4 border-b-2 border-admin-border text-admin-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {t("printHeaderTitle")}
          </h1>
          <p className="text-xs text-admin-muted mt-0.5">
            {t("printHeaderSubtitle")}
          </p>
        </div>
        <div className="text-right text-xs text-admin-muted">
          <div>{t("printDate", { date: currentDate })}</div>
          <div>WAT-PROFILE CMS • Official Guide</div>
        </div>
      </div>

      {(articleTitle || categoryTitle) && (
        <div className="mt-4 pt-3 border-t border-admin-border/50 flex items-center justify-between text-xs font-medium">
          {categoryTitle && <span>{t("printCategory", { name: categoryTitle })}</span>}
          {articleTitle && <span>{t("printArticle", { name: articleTitle })}</span>}
        </div>
      )}
    </div>
  );
}
