"use client";

import React from "react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { FolderOpen } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/hooks/useConfirm";
import { galleryAdminService, galleryCategoryAdminService, eventAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Gallery } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
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
import { useQuery } from "@tanstack/react-query";

interface GalleryFilters extends AdminFilterRecord {
  status: string[];
  category: string[];
  event: string[];
}

export default function GalleryListPage() {
  const t = useTranslations("Admin");
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const selectedIds = useRowSelection();

  const listState = useAdminListState<GalleryFilters>({
    schema: {
      defaultSort: "created_at",
      defaultOrder: "desc",
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

  const { data: categoriesData } = useQuery({
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

  const { data: eventsData } = useQuery({
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
      label: "สถานะ",
      options: [
        { value: "published", label: "Published" },
        { value: "draft", label: "Draft" },
        { value: "archived", label: "Archived" },
      ],
    },
    {
      key: "category",
      kind: "multi",
      label: "หมวดหมู่",
      options: (categoriesData || []).map((c) => ({ value: String(c.id), label: c.name?.th || String(c.id) })),
    },
    {
      key: "event",
      kind: "multi",
      label: "กิจกรรม",
      options: (eventsData || []).map((e) => ({ value: String(e.id), label: e.title?.th || String(e.id) })),
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({ key: "status", value: s, label: `สถานะ: ${s}` });
  }
  for (const cId of listState.params.filters.category || []) {
    const cName = categoriesData?.find((c) => String(c.id) === cId)?.name?.th || cId;
    activeChips.push({ key: "category", value: cId, label: `หมวดหมู่: ${cName}` });
  }
  for (const eId of listState.params.filters.event || []) {
    const eTitle = eventsData?.find((e) => String(e.id) === eId)?.title?.th || eId;
    activeChips.push({ key: "event", value: eId, label: `กิจกรรม: ${eTitle}` });
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

  const handleExportCsv = () => {
    exportToCsv(
      listQuery.rows,
      [
        { header: "ID", accessor: (item) => item.id },
        { header: "Caption", accessor: (item) => item.caption?.th || "" },
        { header: "Category", accessor: (item) => item.category?.name?.th || "" },
        { header: "Display Order", accessor: (item) => item.display_order },
        { header: "Status", accessor: (item) => (item.is_active ? "Active" : "Inactive") },
      ],
      "gallery_export"
    );
  };

  const columns: Column<Gallery>[] = [
    {
      header: t("columns.image"),
      accessorKey: "image_url",
      cell: (v) => {
        return v ? (
          <img
            src={v as string}
            alt=""
            className="h-16 w-24 rounded object-cover border border-admin-border"
          />
        ) : (
          <div className="h-16 w-24 rounded bg-admin-surface-muted border border-dashed border-admin-border" />
        );
      },
    },
    {
      header: "คำอธิบาย (TH)",
      accessorKey: "caption",
      cell: (v) => (v as Gallery["caption"])?.th || "-",
      sortable: true,
    },
    {
      header: "หมวดหมู่",
      accessorKey: "category",
      cell: (v) => (v as Gallery["category"])?.name?.th || "-",
    },
    { header: "ลำดับ", accessorKey: "display_order", sortable: true },
    {
      header: "สถานะ",
      accessorKey: "is_active",
      cell: (v) => <StatusBadge label={v ? "Active" : "Inactive"} />,
    },
    {
      header: "จัดการ",
      cell: (_, row) => (
        <div className="flex gap-1.5">
          <PermissionGuard resource="gallery" action="delete">
            <button
              type="button"
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded hover:bg-admin-danger-surface text-admin-muted hover:text-admin-danger transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <Icons.Delete size={16} />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("gallery.title")}
        breadcrumbs={[{ label: t("gallery.title") }]}
        actions={
          <div className="flex gap-2">
            <PermissionButton
              resource="gallery"
              action="create"
              variant="outline"
              icon={<FolderOpen size={16} />}
            >
              <Link href="/admin/gallery/categories">จัดการหมวดหมู่</Link>
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
                label="สถานะ"
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.status || []}
                onChange={(val) => listState.actions.setFilter("status", val)}
              />
              <AdminMultiSelectFilter
                label="หมวดหมู่"
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
                onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof GalleryFilters, val)}
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
            label="กิจกรรม"
            options={filterDefinitions[2].options || []}
            values={listState.params.filters.event || []}
            onChange={(val) => listState.actions.setFilter("event", val)}
          />
        </AdminListToolbar>
      </div>

      <BulkActionToolbar
        selectedCount={selectedIds.selectedCount}
        onClear={selectedIds.clearSelection}
      >
        <PermissionGuard resource="gallery" action="delete">
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-admin-danger hover:brightness-90 text-admin-on-action rounded-none transition-colors text-sm font-medium focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            <Icons.Delete size={16} />
            {t("common.delete")}
          </button>
        </PermissionGuard>
      </BulkActionToolbar>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={listQuery.rows}
          pagination={listQuery.pagination}
          sorting={{ key: listState.params.sort || "created_at", order: listState.params.order }}
          isLoading={listQuery.isLoading}
          onPageChange={listState.actions.setPage}
          onLimitChange={listState.actions.setLimit}
          onSort={(field) => listState.actions.setSort(field)}
          selectable={true}
          selectedIds={selectedIds.selectedIds as Set<string | number>}
          onSelect={(id) => selectedIds.toggleSelection(id)}
          onSelectAll={(ids) => selectedIds.selectAll(ids)}
        />
      </div>
      <ConfirmDialog />
    </div>
  );
}
