"use client";

import React, { useState } from "react";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getLocalizedText } from "@/utils/localizedText";
import { FolderOpen, Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Switch } from "@/components/ui/Switch";
import { useConfirm } from "@/hooks/useConfirm";
import {
  galleryAdminService,
  galleryCategoryAdminService,
  eventAdminService,
} from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Gallery } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { Icons } from "@/components/ui/Icons";
import { useAdminListState } from "@/features/admin-list/useAdminListState";
import { useAdminListQuery } from "@/features/admin-list/useAdminListQuery";
import type { AdminFilterRecord, AdminFilterDefinition } from "@/features/admin-list/types";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { AdminListExportButton } from "@/components/admin/list/AdminListExportButton";
import { exportToCsv } from "@/services/adminListExportService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ViewModeToggle } from "@/components/admin/ViewModeToggle";
import { GalleryGridView } from "@/components/admin/gallery/GalleryGridView";
import { GalleryLightboxModal } from "@/components/admin/gallery/GalleryLightboxModal";
import { GalleryEditDrawer } from "@/components/admin/gallery/GalleryEditDrawer";
import { GalleryBulkToolbar } from "@/components/admin/gallery/GalleryBulkToolbar";
import { GalleryRowActions } from "@/components/admin/gallery/GalleryRowActions";
import { BulkCategoryModal, BulkEventModal } from "@/components/admin/gallery/GalleryBulkModals";

interface GalleryFilters extends AdminFilterRecord {
  status: string[];
  category: string[];
  event: string[];
}

export default function GalleryListPage() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const selectedIds = useRowSelection();

  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_gallery_view_mode");
      if (saved === "table" || saved === "grid") return saved;
    }
    return "grid";
  });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [localItems, setLocalItems] = useState<Gallery[] | null>(null);

  const handleChangeViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("admin_gallery_view_mode", mode);
  };

  const listState = useAdminListState<GalleryFilters>({
    schema: {
      defaultSort: "display_order",
      defaultOrder: "asc",
      multi: ["status", "category", "event"],
      allowedSorts: ["id", "caption", "display_order", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<Gallery, GalleryFilters>({
    queryKey: ["admin", "gallery"],
    params: listState.params,
    fetcher: (params) => galleryAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const displayItems = localItems ?? listQuery.rows;

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["admin", "gallery-categories", "options"],
    queryFn: async () => {
      const res = await galleryCategoryAdminService.getPaginated({
        page: 1,
        limit: 100,
        search: "",
        order: "asc",
        filters: {},
      });
      return res.data || [];
    },
  });

  const { data: eventsData = [] } = useQuery({
    queryKey: ["admin", "events", "options"],
    queryFn: async () => {
      const res = await eventAdminService.getPaginated({
        page: 1,
        limit: 100,
        search: "",
        order: "asc",
        filters: {},
      });
      return res.data || [];
    },
  });

  const filterDefinitions: AdminFilterDefinition<GalleryFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: t("gallery.status"),
      options: [
        { value: "active", label: t("gallery.active") },
        { value: "inactive", label: t("gallery.inactive") },
      ],
    },
    {
      key: "category",
      kind: "multi",
      label: t("gallery.category"),
      options: categoriesData.map((c) => ({
        value: String(c.id),
        label: getLocalizedText(c.name, locale) || String(c.id),
      })),
    },
    {
      key: "event",
      kind: "multi",
      label: t("gallery.event"),
      options: eventsData.map((e) => ({
        value: String(e.id),
        label: getLocalizedText(e.title, locale) || String(e.id),
      })),
    },
  ];

  const statusLabelMap: Record<string, string> = {
    active: t("gallery.active"),
    inactive: t("gallery.inactive"),
  };

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({ key: "status", value: s, label: `${t("gallery.status")}: ${statusLabelMap[s] || s}` });
  }
  for (const cId of listState.params.filters.category || []) {
    const cat = categoriesData.find((c) => String(c.id) === cId);
    const cName = cat ? getLocalizedText(cat.name, locale) : cId;
    activeChips.push({ key: "category", value: cId, label: `${t("gallery.category")}: ${cName}` });
  }
  for (const eId of listState.params.filters.event || []) {
    const ev = eventsData.find((e) => String(e.id) === eId);
    const eTitle = ev ? getLocalizedText(ev.title, locale) : eId;
    activeChips.push({ key: "event", value: eId, label: `${t("gallery.event")}: ${eTitle}` });
  }

  const handleDelete = async (id: number) => {
    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await galleryAdminService.delete(id);
          toast.success(t("common.success"));
          selectedIds.clearSelection();
          listQuery.refetch();
        } catch (err) {
          toast.error(t("common.error"));
          throw err;
        }
      },
    });
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await galleryAdminService.bulkUpdateStatus([id], !currentStatus);
      toast.success(t("gallery.statusUpdated"));
      listQuery.refetch();
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.selectedCount === 0) return;
    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await galleryAdminService.bulkDelete(selectedIds.selectedArray);
          toast.success(t("common.success"));
          selectedIds.clearSelection();
          listQuery.refetch();
        } catch (err) {
          toast.error(t("common.error"));
          throw err;
        }
      },
    });
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedIds.selectedCount === 0) return;
    try {
      await galleryAdminService.bulkUpdateStatus(selectedIds.selectedArray, isActive);
      toast.success(isActive ? t("gallery.bulkActiveSuccess") : t("gallery.bulkInactiveSuccess"));
      selectedIds.clearSelection();
      listQuery.refetch();
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleBulkCategoryConfirm = async (categoryId: number | null) => {
    try {
      await galleryAdminService.bulkUpdateCategory(selectedIds.selectedArray, categoryId);
      toast.success(t("gallery.bulkCategorySuccess"));
      selectedIds.clearSelection();
      listQuery.refetch();
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleBulkEventConfirm = async (eventId: number | null) => {
    try {
      await galleryAdminService.bulkUpdateEvent(selectedIds.selectedArray, eventId);
      toast.success(t("gallery.bulkEventSuccess"));
      selectedIds.clearSelection();
      listQuery.refetch();
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const current = [...displayItems];
    const [movedItem] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, movedItem);

    // Instantly update local items with new sequential display_order
    const optimisticallyUpdated = current.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));

    setLocalItems(optimisticallyUpdated);
    setIsReordering(true);

    try {
      await galleryAdminService.reorder(optimisticallyUpdated.map((it) => it.id));
      toast.success(t("gallery.reorderSuccess"));
      // Invalidate to refresh cache in background
      await queryClient.invalidateQueries({ queryKey: ["admin", "gallery"] });
    } catch {
      toast.error(t("gallery.reorderFailed"));
      listQuery.refetch();
    } finally {
      setIsReordering(false);
      setLocalItems(null);
    }
  };

  const handleCopyUrl = async (url: string, id: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success(t("gallery.copied"));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleExportCsv = () => {
    exportToCsv(
      listQuery.rows,
      [
        { header: "ID", accessor: (item) => item.id },
        { header: "Caption", accessor: (item) => getLocalizedText(item.caption, locale) || "" },
        { header: "Category", accessor: (item) => getLocalizedText(item.category?.name, locale) || "" },
        { header: "Event", accessor: (item) => getLocalizedText(item.event?.title, locale) || "" },
        { header: "Display Order", accessor: (item) => item.display_order },
        { header: "Status", accessor: (item) => (item.is_active ? "Active" : "Inactive") },
      ],
      "gallery_export",
    );
  };

  const columns: Column<Gallery>[] = [
    {
      header: t("columns.image"),
      accessorKey: "image_url",
      cell: (v, row) => {
        const index = listQuery.rows.findIndex((item) => item.id === row.id);
        return v ? (
          <div
            className="group relative h-14 w-20 rounded-none overflow-hidden border border-admin-border cursor-pointer bg-admin-surface-muted"
            onClick={() => setLightboxIndex(index >= 0 ? index : 0)}
          >
            <img
              src={v as string}
              alt=""
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Eye size={14} className="text-white" />
            </div>
          </div>
        ) : (
          <div className="h-14 w-20 rounded-none bg-admin-surface-muted border border-dashed border-admin-border" />
        );
      },
    },
    {
      header: t("gallery.caption"),
      accessorKey: "caption",
      cell: (v) => getLocalizedText(v as Gallery["caption"], locale) || "-",
      sortable: true,
    },
    {
      header: t("gallery.category"),
      accessorKey: "category",
      cell: (v) => getLocalizedText((v as Gallery["category"])?.name, locale) || "-",
    },
    {
      header: t("gallery.event"),
      accessorKey: "event",
      cell: (v) => getLocalizedText((v as Gallery["event"])?.title, locale) || "-",
    },
    { header: t("gallery.displayOrder"), accessorKey: "display_order", sortable: true },
    {
      header: t("gallery.status"),
      accessorKey: "is_active",
      cell: (v, row) => (
        <div className="flex items-center gap-2">
          <StatusBadge label={v ? "Active" : "Inactive"} />
          <PermissionGuard resource="gallery" action="update">
            <Switch
              id={`table-status-${row.id}`}
              checked={Boolean(v)}
              onChange={() => handleToggleStatus(row.id, Boolean(v))}
            />
          </PermissionGuard>
        </div>
      ),
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => {
        const index = displayItems.findIndex((item) => item.id === row.id);
        return (
          <GalleryRowActions
            onPreview={() => setLightboxIndex(index >= 0 ? index : 0)}
            onEdit={() => setEditingGallery(row)}
            onCopyUrl={() => handleCopyUrl(row.image_url, row.id)}
            onDelete={() => handleDelete(row.id)}
            isCopied={copiedId === row.id}
          />
        );
      },
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("gallery.title")}
        breadcrumbs={[{ label: t("gallery.title") }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ViewModeToggle value={viewMode} onChange={handleChangeViewMode} />

            <PermissionButton
              resource="gallery"
              action="create"
              variant="outline"
              icon={<FolderOpen size={16} />}
            >
              <Link href="/admin/gallery/categories">{t("gallery.categories")}</Link>
            </PermissionButton>

            <PermissionButton
              resource="gallery"
              action="create"
              icon={<Icons.Plus size={14} />}
            >
              <Link href="/admin/gallery/upload">{t("gallery.upload")}</Link>
            </PermissionButton>
          </div>
        }
      />

      <div className="mt-4">
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
                label={t("gallery.status")}
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.status || []}
                onChange={(val) => listState.actions.setFilter("status", val)}
              />
              <AdminMultiSelectFilter
                label={t("gallery.category")}
                options={filterDefinitions[1].options || []}
                values={listState.params.filters.category || []}
                onChange={(val) => listState.actions.setFilter("category", val)}
              />
            </>
          }
          activeFilters={
            <div className="flex items-center justify-between">
              <AdminActiveFilterChips
                filters={activeChips}
                onRemove={(key, val) =>
                  listState.actions.removeFilterValue(key as keyof GalleryFilters, val)
                }
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
          <AdminMultiSelectFilter
            label={t("gallery.event")}
            options={filterDefinitions[2].options || []}
            values={listState.params.filters.event || []}
            onChange={(val) => listState.actions.setFilter("event", val)}
          />
        </AdminListToolbar>
      </div>

      {/* Enhanced Bulk Action Toolbar */}
      <GalleryBulkToolbar
        selectedCount={selectedIds.selectedCount}
        onClear={selectedIds.clearSelection}
        onBulkCategory={() => setIsCategoryModalOpen(true)}
        onBulkEvent={() => setIsEventModalOpen(true)}
        onBulkActive={() => handleBulkStatus(true)}
        onBulkInactive={() => handleBulkStatus(false)}
        onBulkDelete={handleBulkDelete}
      />

      {/* Main View Area (Table or Grid) */}
      <div className="mt-6">
        {viewMode === "grid" ? (
          <div className="space-y-4">
            {/* Grid selection toolbar */}
            <div className="flex items-center justify-between text-sm text-admin-muted px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedIds.selectedCount === displayItems.length) {
                      selectedIds.clearSelection();
                    } else {
                      selectedIds.selectAll(displayItems.map((item) => item.id));
                    }
                  }}
                  className="text-xs font-medium text-admin-foreground hover:underline p-1 min-h-[36px] flex items-center"
                >
                  {selectedIds.selectedCount === displayItems.length && displayItems.length > 0
                    ? t("gallery.clearSelection")
                    : t("gallery.selectAll")}
                </button>
              </div>
              <p className="text-xs">
                {t("gallery.showingCount", { current: displayItems.length, total: listQuery.pagination.total })}
              </p>
            </div>

            <GalleryGridView
              items={displayItems}
              isLoading={listQuery.isLoading}
              selectedIds={selectedIds.selectedIds as Set<string | number>}
              onToggleSelect={(id) => selectedIds.toggleSelection(id)}
              onPreview={(index) => setLightboxIndex(index)}
              onEdit={(item) => setEditingGallery(item)}
              onDelete={(id) => handleDelete(id)}
              onToggleStatus={(id, currentStatus) => handleToggleStatus(id, currentStatus)}
              onReorder={handleReorder}
              isReordering={isReordering}
            />

            {/* Pagination Controls for Grid Mode */}
            {listQuery.pagination.totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-admin-border pt-4">
                <p className="text-xs text-admin-muted">
                  {t("gallery.pageOf", { page: listQuery.pagination.page, totalPages: listQuery.pagination.totalPages })}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={listQuery.pagination.page <= 1}
                    onClick={() => listState.actions.setPage(listQuery.pagination.page - 1)}
                    className="px-4 py-2 min-h-[38px] text-xs font-medium rounded-none border border-admin-border bg-admin-surface hover:bg-admin-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {t("common.previous")}
                  </button>
                  <button
                    type="button"
                    disabled={listQuery.pagination.page >= listQuery.pagination.totalPages}
                    onClick={() => listState.actions.setPage(listQuery.pagination.page + 1)}
                    className="px-4 py-2 min-h-[38px] text-xs font-medium rounded-none border border-admin-border bg-admin-surface hover:bg-admin-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {t("common.next")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={displayItems}
            pagination={listQuery.pagination}
            sorting={{
              key: listState.params.sort || "display_order",
              order: listState.params.order,
            }}
            isLoading={listQuery.isLoading}
            onPageChange={listState.actions.setPage}
            onLimitChange={listState.actions.setLimit}
            onSort={(field) => listState.actions.setSort(field)}
            selectable={true}
            selectedIds={selectedIds.selectedIds as Set<string | number>}
            onSelect={(id) => selectedIds.toggleSelection(id)}
            onSelectAll={(ids) => selectedIds.selectAll(ids)}
          />
        )}
      </div>

      {/* Lightbox Modal */}
      <GalleryLightboxModal
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        items={displayItems}
        initialIndex={lightboxIndex ?? 0}
        onEdit={(item) => setEditingGallery(item)}
      />

      {/* Quick Edit Drawer */}
      <GalleryEditDrawer
        isOpen={editingGallery !== null}
        onClose={() => setEditingGallery(null)}
        gallery={editingGallery}
        categories={categoriesData}
        events={eventsData}
        onSuccess={() => listQuery.refetch()}
      />

      {/* Bulk Change Category Modal */}
      <BulkCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        selectedCount={selectedIds.selectedCount}
        categories={categoriesData}
        onConfirm={handleBulkCategoryConfirm}
      />

      {/* Bulk Assign Event Modal */}
      <BulkEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        selectedCount={selectedIds.selectedCount}
        events={eventsData}
        onConfirm={handleBulkEventConfirm}
      />

      <ConfirmDialog />
    </div>
  );
}
