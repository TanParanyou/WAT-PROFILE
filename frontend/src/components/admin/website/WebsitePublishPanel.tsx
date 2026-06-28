"use client";

import { Button } from "@/components/ui/Button";
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
  const dirty = hasDraftDifference(page);

  return (
    <div className="border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Publish</p>
          <div className="mt-2 text-sm text-zinc-600">Last published: {formatCmsTimestamp(page.published_at)}</div>
          <div className={dirty ? "mt-2 text-sm text-amber-700" : "mt-2 text-sm text-emerald-700"}>
            {dirty ? "Draft changes are waiting to be published." : "Published content matches the current draft."}
          </div>
        </div>
        <Button type="button" isLoading={isPublishing} onClick={onPublish} disabled={!dirty && !isPublishing}>
          Publish now
        </Button>
      </div>
    </div>
  );
}
