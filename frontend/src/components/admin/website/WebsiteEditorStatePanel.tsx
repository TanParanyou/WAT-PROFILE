"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function WebsiteEditorStatePanel({
  savingPage,
  savingSection,
  publishing,
  pageSaved,
  sectionSaved,
  published,
  pageError,
  sectionError,
  publishError,
}: {
  savingPage: boolean;
  savingSection: boolean;
  publishing: boolean;
  pageSaved: boolean;
  sectionSaved: boolean;
  published: boolean;
  pageError: Error | null;
  sectionError: Error | null;
  publishError: Error | null;
}) {
  const t = useTranslations("Admin.website");
  const items = [
    savingPage && { tone: "loading", text: t("savingPage") },
    savingSection && { tone: "loading", text: t("savingSection") },
    publishing && { tone: "loading", text: t("publishingPage") },
    pageSaved && { tone: "success", text: t("pageSaved") },
    sectionSaved && { tone: "success", text: t("sectionSaved") },
    published && { tone: "success", text: t("pagePublished") },
    pageError && { tone: "error", text: pageError.message },
    sectionError && { tone: "error", text: sectionError.message },
    publishError && { tone: "error", text: publishError.message },
  ].filter(Boolean) as Array<{ tone: "loading" | "success" | "error"; text: string }>;

  if (!items.length) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={`${item.tone}-${item.text}`}
          className={
            item.tone === "error"
              ? "flex items-center gap-2 border border-admin-danger-border bg-admin-danger-surface px-3 py-2 text-sm text-admin-danger rounded-lg"
              : item.tone === "success"
                ? "flex items-center gap-2 border border-admin-success-border bg-admin-success-surface px-3 py-2 text-sm text-admin-success rounded-lg"
                : "flex items-center gap-2 border border-admin-border bg-admin-surface-muted px-3 py-2 text-sm text-admin-body rounded-lg"
          }
        >
          {item.tone === "loading" ? <Loader2 size={14} className="animate-spin" /> : null}
          {item.tone === "success" ? <CheckCircle2 size={14} /> : null}
          {item.tone === "error" ? <AlertCircle size={14} /> : null}
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
}
