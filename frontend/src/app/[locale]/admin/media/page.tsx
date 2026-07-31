"use client";

import React, { useRef, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";

interface MediaFilters extends AdminFilterRecord {
  mime_type: string[];
  folder: string[];
  created_from?: string;
  created_to?: string;
}

export default function MediaLibraryPage() {
  const { toast } = useToast();
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listState = useAdminListState<MediaFilters>({
    schema: {
      defaultSort: "created_at",
      defaultOrder: "desc",
      multi: ["mime_type", "folder"],
      single: ["created_from", "created_to"],
      allowedSorts: ["id", "filename", "size", "created_at"],
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

  const filterDefinitions: AdminFilterDefinition<MediaFilters>[] = [
    {
      key: "mime_type",
      kind: "multi",
      label: "ประเภทไฟล์ (Mime Type)",
      options: (filterOptions?.mime_types || []).map((m: string) => ({ value: m, label: m })),
    },
    {
      key: "folder",
      kind: "multi",
      label: "หมวดหมู่ (Category)",
      options: (filterOptions?.categories || []).map((f: string) => ({ value: f, label: f })),
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const mt of listState.params.filters.mime_type || []) {
    activeChips.push({ key: "mime_type", value: mt, label: `Mime: ${mt}` });
  }
  for (const f of listState.params.filters.folder || []) {
    activeChips.push({ key: "folder", value: f, label: `Folder: ${f}` });
  }
  if (listState.params.filters.created_from) {
    activeChips.push({ key: "created_from", value: listState.params.filters.created_from, label: `ตั้งแต่วันที่: ${listState.params.filters.created_from}` });
  }
  if (listState.params.filters.created_to) {
    activeChips.push({ key: "created_to", value: listState.params.filters.created_to, label: `ถึงวันที่: ${listState.params.filters.created_to}` });
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const media = await mediaService.upload(file);
      setSelectedMedia(media);
      toast.success("อัปโหลดรูปภาพเรียบร้อยแล้ว");
      listQuery.refetch();
    } catch {
      toast.error("อัปโหลดรูปภาพไม่สำเร็จ");
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
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 font-sans text-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-950">
              Media Library
            </h1>
            <p className="text-sm text-zinc-500">
              Manage public content media files
            </p>
          </div>

          <div>
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
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
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
                label="ประเภทไฟล์ (Mime Type)"
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.mime_type || []}
                onChange={(val) => listState.actions.setFilter("mime_type", val)}
              />
              <AdminMultiSelectFilter
                label="โฟลเดอร์ (Folder)"
                options={filterDefinitions[1].options || []}
                values={listState.params.filters.folder || []}
                onChange={(val) => listState.actions.setFilter("folder", val)}
              />
            </>
          }
          activeFilters={
            <div className="flex items-center justify-between">
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
            label="ช่วงวันที่อัปโหลด"
            from={listState.params.filters.created_from}
            to={listState.params.filters.created_to}
            onChange={({ from, to }) => {
              listState.actions.setFilter("created_from", from);
              listState.actions.setFilter("created_to", to);
            }}
          />
        </AdminListToolbar>

        {listQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {listQuery.rows.map((media) => (
              <button
                key={media.id}
                onClick={() => setSelectedMedia(media)}
                className={`group relative aspect-video overflow-hidden border bg-zinc-50 ${
                  selectedMedia?.id === media.id
                    ? "border-zinc-950"
                    : "border-zinc-200"
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
          listQuery.refetch();
        }}
        onDeleted={() => {
          setSelectedMedia(null);
          listQuery.refetch();
        }}
      />
    </div>
  );
}
