"use client";

import { ArrowLeft, ExternalLink, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/Button";
import { PageStatusPill } from "@/components/admin/website/PageStatusPill";
import type { ContentPage } from "@/types/website-cms";
import { formatCmsTimestamp, getPublicPageHref } from "@/utils/websiteCms";

export function WebsiteEditorToolbar({
  page,
  locale,
  isPublishing,
  hasUnpublishedChanges,
  hasUnsavedChanges,
  onBeforeLeave,
  onPublish,
}: {
  page: ContentPage;
  locale: string;
  isPublishing: boolean;
  hasUnpublishedChanges: boolean;
  hasUnsavedChanges: boolean;
  onBeforeLeave: () => Promise<boolean>;
  onPublish: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("Admin.website");
  const publicHref = getPublicPageHref(page, locale);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-admin-border bg-admin-surface px-4 py-3 rounded-none">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={14} />}
          onClick={async () => {
            if (!(await onBeforeLeave())) return;
            router.push("/admin/website");
          }}
        >
          {t("back")}
        </Button>
        <div className="min-w-0">
          <div className="text-sm font-medium text-admin-foreground">{page.page_key}</div>
          <div className="text-xs text-admin-muted">{page.slug}</div>
        </div>
        <PageStatusPill status={page.status} />
        <span
          className={
            hasUnpublishedChanges
              ? "max-w-full border border-admin-warning-border bg-admin-warning-surface px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-admin-warning rounded sm:tracking-[0.16em]"
              : "max-w-full border border-admin-border bg-admin-surface-muted px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-admin-muted rounded sm:tracking-[0.16em]"
          }
        >
          {hasUnpublishedChanges ? t("draftWaiting") : t("publishedMatchesDraft")}
        </span>
        {hasUnsavedChanges ? (
          <span className="max-w-full border border-admin-danger-border bg-admin-danger-surface px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-admin-danger rounded sm:tracking-[0.16em]">
            {t("unsavedEdits")}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="text-right text-xs text-admin-muted">
          <div>{`${page.updated_at ? "Updated" : ""} ${formatCmsTimestamp(page.updated_at)}`}</div>
          <div>{`${page.published_at ? "Published" : ""} ${formatCmsTimestamp(page.published_at)}`}</div>
        </div>
        <Button
          type="button"
          variant="outline"
          icon={<ExternalLink size={14} />}
          onClick={() => window.open(publicHref, "_blank", "noopener,noreferrer")}
        >
          {t("viewPublic")}
        </Button>
        <Button type="button" isLoading={isPublishing} icon={<Send size={14} />} onClick={onPublish}>
          {t("publish")}
        </Button>
      </div>
    </div>
  );
}
