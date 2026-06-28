"use client";

import { useDeferredValue, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PageLoading } from "@/components/ui/Loading";
import { WebsitePagesList } from "@/components/admin/website/WebsitePagesList";
import { useWebsitePagesQuery } from "@/hooks/website-cms";
import type { ContentStatus } from "@/types/website-cms";

export function WebsitePagesManager() {
  const t = useTranslations("Admin");
  const pagesQuery = useWebsitePagesQuery();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContentStatus | "all">("all");
  const deferredSearch = useDeferredValue(search);

  if (pagesQuery.isLoading) {
    return <PageLoading text={t("common.loading")} />;
  }

  const pages = pagesQuery.data ?? [];
  const filteredPages = pages.filter((page) => {
    const term = deferredSearch.trim().toLowerCase();
    const matchesSearch =
      !term ||
      page.page_key.toLowerCase().includes(term) ||
      page.slug.toLowerCase().includes(term) ||
      Object.values(page.title).some((value) => value?.toLowerCase().includes(term));
    const matchesStatus = status === "all" || page.status === status;
    return matchesSearch && matchesStatus;
  });

  const publishedCount = pages.filter((page) => page.status === "published").length;
  const draftCount = pages.filter((page) => page.status === "draft").length;
  const sectionCount = pages.reduce((total, page) => total + page.sections.length, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950">Website</h1>
        <p className="text-sm text-zinc-500">Website pages</p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Pages" value={pages.length} />
        <Metric label="Published" value={publishedCount} />
        <Metric label="Draft" value={draftCount} />
        <Metric label="Sections" value={sectionCount} />
      </div>
      <div className="flex flex-col gap-3 border border-zinc-200 bg-white p-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <Input
            label="Search pages"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="PAGE-CONTACT, contact, title..."
            className="pl-9"
          />
          <Search size={15} className="-mt-7 ml-3 text-zinc-400" />
        </div>
        <div className="flex gap-2">
          {(["all", "published", "draft", "archived"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={
                status === item
                  ? "border border-zinc-950 bg-zinc-950 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white"
                  : "border border-zinc-200 bg-white px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-600 hover:bg-zinc-50"
              }
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <WebsitePagesList
        pages={filteredPages}
        isLoading={pagesQuery.isLoading}
        error={pagesQuery.error as Error | null}
        onRetry={() => pagesQuery.refetch()}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-zinc-200 bg-white p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-zinc-950">{value}</div>
    </div>
  );
}
