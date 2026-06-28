"use client";

import { ArrowLeft, ExternalLink, Send } from "lucide-react";
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
  onBeforeLeave: () => boolean;
  onPublish: () => void;
}) {
  const router = useRouter();
  const publicHref = getPublicPageHref(page, locale);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-zinc-200 bg-white px-4 py-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={14} />}
          onClick={() => {
            if (!onBeforeLeave()) return;
            router.push("/admin/website");
          }}
        >
          Back
        </Button>
        <div className="min-w-0">
          <div className="text-sm font-medium text-zinc-950">{page.page_key}</div>
          <div className="text-xs text-zinc-500">{page.slug}</div>
        </div>
        <PageStatusPill status={page.status} />
        <span
          className={
            hasUnpublishedChanges
              ? "max-w-full border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-amber-700 sm:tracking-[0.16em]"
              : "max-w-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 sm:tracking-[0.16em]"
          }
        >
          {hasUnpublishedChanges ? "Draft has changes" : "Published is current"}
        </span>
        {hasUnsavedChanges ? (
          <span className="max-w-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-red-700 sm:tracking-[0.16em]">
            Unsaved edits
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="text-right text-xs text-zinc-500">
          <div>Updated {formatCmsTimestamp(page.updated_at)}</div>
          <div>Published {formatCmsTimestamp(page.published_at)}</div>
        </div>
        <Button
          type="button"
          variant="outline"
          icon={<ExternalLink size={14} />}
          onClick={() => window.open(publicHref, "_blank", "noopener,noreferrer")}
        >
          View public
        </Button>
        <Button type="button" isLoading={isPublishing} icon={<Send size={14} />} onClick={onPublish}>
          Publish
        </Button>
      </div>
    </div>
  );
}
