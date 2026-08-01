"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { PageLoading } from "@/components/ui/Loading";
import { WebsitePagesList } from "@/components/admin/website/WebsitePagesList";
import { websiteCmsAdminService } from "@/services/websiteCmsService";
import type { ContentPage } from "@/types/website-cms";
import { useAdminListState } from "@/features/admin-list/useAdminListState";
import { useAdminListQuery } from "@/features/admin-list/useAdminListQuery";
import type { AdminFilterRecord, AdminFilterDefinition } from "@/features/admin-list/types";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { AdminListExportButton } from "@/components/admin/list/AdminListExportButton";
import { exportToCsv } from "@/services/adminListExportService";
import { useQuery } from "@tanstack/react-query";

interface WebsitePageFilters extends AdminFilterRecord {
  status: string[];
}

export function WebsitePagesManager() {
  const t = useTranslations("Admin");

  const listState = useAdminListState<WebsitePageFilters>({
    schema: {
      defaultSort: "id",
      defaultOrder: "asc",
      multi: ["status"],
      allowedSorts: ["id", "slug", "page_key", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<ContentPage, WebsitePageFilters>({
    queryKey: ["admin", "website-pages"],
    params: listState.params,
    fetcher: (params) => websiteCmsAdminService.getPaginatedPages(params),
    setPage: listState.actions.setPage,
  });

  const { data: allPagesData } = useQuery({
    queryKey: ["admin", "website-pages", "all-metrics"],
    queryFn: () => websiteCmsAdminService.listPages(),
  });

  const filterDefinitions: AdminFilterDefinition<WebsitePageFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: "สถานะ",
      options: [
        { value: "published", label: "Published" },
        { value: "draft", label: "Draft" },
        { value: "archived", label: "Archived" },
      ],
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({ key: "status", value: s, label: `สถานะ: ${s}` });
  }

  const handleExportCsv = () => {
    exportToCsv(
      listQuery.rows,
      [
        { header: "ID", accessor: (item) => item.id },
        { header: "Page Key", accessor: (item) => item.page_key },
        { header: "Slug", accessor: (item) => item.slug },
        { header: "Title (TH)", accessor: (item) => item.title?.th || "" },
        { header: "Title (EN)", accessor: (item) => item.title?.en || "" },
        { header: "Status", accessor: (item) => item.status },
        { header: "Sections Count", accessor: (item) => item.sections?.length || 0 },
      ],
      "website_pages_export"
    );
  };

  if (listQuery.isLoading && !allPagesData) {
    return <PageLoading text={t("common.loading")} />;
  }

  const allPages = allPagesData ?? [];
  const publishedCount = allPages.filter((page) => page.status === "published").length;
  const draftCount = allPages.filter((page) => page.status === "draft").length;
  const sectionCount = allPages.reduce((total, page) => total + (page.sections?.length || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-admin-foreground">Website</h1>
        <p className="text-sm text-admin-muted">Website pages</p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Pages" value={allPages.length} />
        <Metric label="Published" value={publishedCount} />
        <Metric label="Draft" value={draftCount} />
        <Metric label="Sections" value={sectionCount} />
      </div>

      <AdminListToolbar
        activeFilterCount={activeChips.length}
        search={
          <AdminSearchInput
            value={listState.draftSearch}
            isDebouncing={listState.isDebouncing}
            onChange={(val) => listState.actions.setSearch(val)}
            onSubmit={(val) => listState.actions.setSearch(val, true)}
            onClear={() => listState.actions.setSearch("", true)}
          />
        }
        primaryFilters={
          <AdminMultiSelectFilter
            label="สถานะ"
            options={filterDefinitions[0].options || []}
            values={listState.params.filters.status || []}
            onChange={(val) => listState.actions.setFilter("status", val)}
          />
        }
        activeFilters={
          <div className="flex items-center justify-between">
            <AdminActiveFilterChips
              filters={activeChips}
              onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof WebsitePageFilters, val)}
              onClear={listState.actions.clearFilters}
            />
            <AdminListExportButton
              isExporting={false}
              completed={0}
              total={listQuery.pagination.total}
              onExport={handleExportCsv}
            />
          </div>
        }
      />

      <WebsitePagesList
        pages={listQuery.rows}
        isLoading={listQuery.isLoading}
        error={listQuery.error as Error | null}
        onRetry={() => listQuery.refetch()}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-admin-border bg-admin-surface p-4 rounded-none">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-admin-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-admin-foreground">{value}</div>
    </div>
  );
}
