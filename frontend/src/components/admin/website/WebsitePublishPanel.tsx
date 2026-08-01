"use client";

import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import type { ContentPage } from "@/types/website-cms";
import { formatCmsTimestamp, hasDraftDifference } from "@/utils/websiteCms";

export function WebsitePublishPanel({
  page,
  isPublishing,
  onPublish,
}: {
  page: ContentPage;
  isPublishing: boolean;
  onPublish: () => void;
}) {
  const t = useTranslations("Admin.website");
  const dirty = hasDraftDifference(page);

  return (
    <div className="border border-admin-border bg-admin-surface p-4 rounded-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-admin-muted">{t("publishPanel")}</p>
          <div className="mt-2 text-sm text-admin-body">{`${t("lastPublished")}: ${formatCmsTimestamp(page.published_at)}`}</div>
          <div className={dirty ? "mt-2 text-sm text-admin-warning" : "mt-2 text-sm text-admin-success"}>
            {dirty ? t("draftWaiting") : t("publishedMatchesDraft")}
          </div>
        </div>
        <Button type="button" isLoading={isPublishing} onClick={onPublish} disabled={!dirty && !isPublishing}>
          {t("publishNow")}
        </Button>
      </div>
    </div>
  );
}
