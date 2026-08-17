"use client";

import React, { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { mediaService } from "@/services/mediaService";
import type { Media } from "@/types/entities";
import { MediaDetailsSidebar } from "@/components/admin/website/MediaDetailsSidebar";
import { Button } from "@/components/ui/Button";
import { useAdminListState } from "@/features/admin-list/useAdminListState";
import { useAdminListQuery } from "@/features/admin-list/useAdminListQuery";
import type { AdminFilterRecord, AdminFilterDefinition } from "@/features/admin-list/types";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminDateRangeFilter } from "@/components/admin/list/AdminDateRangeFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { AdminListExportButton } from "@/components/admin/list/AdminListExportButton";
import { exportToCsv } from "@/services/adminListExportService";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface MediaFilters extends AdminFilterRecord {
  mime: string[];
  category: string[];
  alt_missing: string[];
  from?: string;
  to?: string;
}

export default function MediaLibraryPage() {
  const t = useTranslations("Admin.media");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listState = useAdminListState<MediaFilters>({
    schema: {
      defaultSort: "created_at",
      defaultOrder: "desc",
      multi: ["mime", "category", "alt_missing"],
      single: ["from", "to"],
      allowedSorts: ["id", "filename", "file_size", "created_at", "mime_type"],
    },
  });

  const listQuery = useAdminListQuery<Media, MediaFilters>({
    queryKey: ["admin", "media"],
    params: listState.params,
    fetcher: (params) => mediaService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const { data: filterOptions } = useQuery({
    queryKey: ["admin", "media", "filter-options"],
    queryFn: () => mediaService.getFilterOptions(),
  });

  const trashQuery = useQuery({
    queryKey: ["admin", "media", "trash"],
    queryFn: () => mediaService.getTrash(),
    enabled: showTrash,
  });

  const visibleRows = showTrash ? trashQuery.data || [] : listQuery.rows;
  const localeLabels: Record<string, string> = {
    th: t("filters.locales.th"),
    en: t("filters.locales.en"),
    de: t("filters.locales.de"),
  };

  const filterDefinitions: AdminFilterDefinition<MediaFilters>[] = [
    {
      key: "mime",
      kind: "multi",
      label: t("filters.mimeType"),
      options: (filterOptions?.mime_types || []).map((m: string) => ({ value: m, label: m })),
    },
    {
      key: "category",
      kind: "multi",
      label: t("filters.category"),
      options: (filterOptions?.categories || []).map((f: string) => ({ value: f, label: f })),
    },
    {
      key: "alt_missing",
      kind: "multi",
      label: t("filters.altMissing"),
      options: (filterOptions?.alt_missing_locales || []).map((locale) => ({
        value: locale,
        label: localeLabels[locale] || locale,
      })),
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const mt of listState.params.filters.mime || []) {
    activeChips.push({ key: "mime", value: mt, label: `${t("filters.mimeType")}: ${mt}` });
  }
  for (const f of listState.params.filters.category || []) {
    activeChips.push({ key: "category", value: f, label: `${t("filters.category")}: ${f}` });
  }
  for (const locale of listState.params.filters.alt_missing || []) {
    activeChips.push({ key: "alt_missing", value: locale, label: `${t("filters.altMissing")}: ${localeLabels[locale] || locale}` });
  }
  if (listState.params.filters.from) {
    activeChips.push({
      key: "from",
      value: listState.params.filters.from,
      label: t("common.filter.fromDate", { date: listState.params.filters.from }),
    });
  }
  if (listState.params.filters.to) {
    activeChips.push({
      key: "to",
      value: listState.params.filters.to,
      label: t("common.filter.toDate", { date: listState.params.filters.to }),
    });
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const media = await mediaService.upload(file);
      setSelectedMedia(media);
      toast.success(t("media.uploadSuccess"));
      await queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    } catch {
      toast.error(t("media.uploadError"));
    } finally {
      setIsUploading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExportCsv = () => {
    exportToCsv(
      listQuery.rows,
      [
        { header: "ID", accessor: (item) => item.id },
        { header: "File Name", accessor: (item) => item.filename || "" },
        { header: "URL", accessor: (item) => item.url || "" },
        { header: "Mime Type", accessor: (item) => item.mime_type || "" },
        { header: "File Size", accessor: (item) => item.size || 0 },
        {
          header: "Created At",
          accessor: (item) =>
            item.created_at ? new Date(item.created_at).toLocaleDateString("th-TH") : "",
        },
      ],
      "media_export"
    );
  };

  return (
    <div className="flex h-[calc(100vh-6rem)]">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pr-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-admin-foreground tracking-tight">
              {showTrash ? t("mediaSafety.trash") : t("sidebar.media")}
            </h1>
            <p className="text-xs text-admin-muted mt-0.5">
              {showTrash
                ? t("mediaLibrary.trashSub") || "Items in trash can be restored or permanently purged."
                : t("mediaLibrary.sub") || "Manage image assets, crop metadata, and inspect system references."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowTrash((value) => !value);
                setSelectedMedia(null);
              }}
              className="mr-2 text-xs uppercase tracking-wider"
            >
              {showTrash ? t("media.backToLibrary") : t("media.trash")}
            </Button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-xs uppercase tracking-wider flex items-center gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-admin-on-action" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
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
            <>
              <AdminMultiSelectFilter
                label={t("filters.mimeType")}
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.mime || []}
                onChange={(val) => listState.actions.setFilter("mime", val)}
              />
              <AdminMultiSelectFilter
                label={t("filters.category")}
                options={filterDefinitions[1].options || []}
                values={listState.params.filters.category || []}
                onChange={(val) => listState.actions.setFilter("category", val)}
              />
              <AdminMultiSelectFilter
                label={t("filters.altMissing")}
                options={filterDefinitions[2].options || []}
                values={listState.params.filters.alt_missing || []}
                onChange={(val) => listState.actions.setFilter("alt_missing", val)}
              />
            </>
          }
          activeFilters={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <AdminActiveFilterChips
                filters={activeChips}
                onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof MediaFilters, val)}
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
        >
          <AdminDateRangeFilter
            label={t("common.filter.uploadDate")}
            from={listState.params.filters.from}
            to={listState.params.filters.to}
            onChange={({ from, to }) => {
              listState.actions.setFilters({
                from: from,
                to: to,
              });
            }}
          />
        </AdminListToolbar>

        {(showTrash ? trashQuery.isLoading : listQuery.isLoading) ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-admin-action" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {visibleRows.map((media) => (
              <button
                key={media.id}
                onClick={() => setSelectedMedia(media)}
                className={`group relative aspect-video overflow-hidden rounded-none border bg-admin-surface-muted transition focus-visible:outline-2 focus-visible:outline-admin-focus ${selectedMedia?.id === media.id
                  ? "border-admin-focus ring-2 ring-admin-focus/20"
                  : "border-admin-border hover:border-admin-control-border"
                  }`}
              >
                <img
                  src={media.url}
                  alt=""
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <MediaDetailsSidebar
        key={selectedMedia?.id || "empty"}
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        onUpdated={(updated) => {
          setSelectedMedia(updated);
          void queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
        }}
        onDeleted={() => {
          setSelectedMedia(null);
          void queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
        }}
      />
    </div>
  );
}
