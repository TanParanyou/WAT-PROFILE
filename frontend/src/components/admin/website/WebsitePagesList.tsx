"use client";

import { Link as LocaleLink } from "@/navigation";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { LanguageCompleteness } from "@/components/admin/website/LanguageCompleteness";
import { PageStatusPill } from "@/components/admin/website/PageStatusPill";
import type { ContentPage } from "@/types/website-cms";

export function WebsitePagesList({
  pages,
  isLoading,
  error,
  onRetry,
}: {
  pages: ContentPage[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  if (isLoading) {
    return <Loading text="Loading website pages..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-600">Error loading pages: {error.message}</p>
        <Button onClick={onRetry} variant="secondary">
          Retry
        </Button>
      </div>
    );
  }

  const activePages = pages.filter(
    (page) =>
      ["PAGE-HOME", "PAGE-CONTACT", "PAGE-ABOUT", "PAGE-PRIVACY", "PAGE-IMPRESSUM"].includes(page.page_key) ||
      ["home", "contact", "about", "privacy", "impressum"].includes(page.slug)
  );

  if (!activePages.length) {
    return <div className="border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">No pages yet.</div>;
  }

  return (
    <div className="divide-y divide-zinc-200 border border-zinc-200 bg-white">
      {activePages.map((page) => (
        <LocaleLink
          key={page.id}
          href={`/admin/website/${page.slug.toLowerCase()}`}
          className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50"
        >
          <div className="min-w-0">
            <div className="truncate font-medium text-zinc-950">{page.page_key}</div>
            <div className="truncate text-sm text-zinc-500">{page.slug}</div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <LanguageCompleteness value={page.title} />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                {page.sections.length} sections
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                Updated {new Date(page.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <PageStatusPill status={page.status} />
        </LocaleLink>
      ))}
    </div>
  );
}
