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
import { useConfirm } from "@/components/ui/Modal";
import { useDataTable } from "@/hooks/useDataTable";
import { Button } from "@/components/ui/Button";
import { galleryAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Gallery } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";
import { Icons } from "@/components/ui/Icons";

export default function GalleryListPage() {
  const t = useTranslations("Admin");
  const { data, pagination, sort, isLoading, onPageChange, onSort, fetchData } =
    useDataTable<Gallery>({
      fetcher: (p) =>
        galleryAdminService.getAll({ page: p.page, limit: p.limit }),
    });
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const selectedIds = useRowSelection();

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
          fetchData();
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
          fetchData();
        } catch (err) {
          toast.error(t("common.error"));

          throw err;
        }
      },
    });
  };

  const handleExportCsv = () => {
    const exportData = data.map((item) => ({
      id: item.id,
      caption: item.caption?.th || "",
      category: item.category?.name?.th || "",
      display_order: item.display_order,
      is_active: item.is_active ? "Active" : "Inactive",
    }));

    exportToCsv("gallery_export", exportData, [
      { label: "ID", key: "id" },
      { label: "Caption", key: "caption" },
      { label: "Category", key: "category" },
      { label: "Display Order", key: "display_order" },
      { label: "Status", key: "is_active" },
    ]);
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
            className="h-16 w-24 rounded object-cover border border-zinc-200"
          />
        ) : (
          <div className="h-16 w-24 rounded bg-zinc-100 border border-dashed border-zinc-200" />
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
              className="p-1.5 rounded hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors"
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
            <Button
              onClick={handleExportCsv}
              variant="outline"
              icon={<Icons.Download size={14} />}
              className="shadow-sm"
            >
              Export CSV
            </Button>
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

      <BulkActionToolbar
        selectedCount={selectedIds.selectedCount}
        onClear={selectedIds.clearSelection}
      >
        <PermissionGuard resource="gallery" action="delete">
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors text-sm font-medium"
          >
            <Icons.Delete size={16} />
            {t("common.delete")}
          </button>
        </PermissionGuard>
      </BulkActionToolbar>

      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        sorting={sort}
        isLoading={isLoading}
        onPageChange={onPageChange}
        onSort={onSort}
        selectable={true}
        selectedIds={selectedIds.selectedIds as Set<string | number>}
        onSelect={(id) => selectedIds.toggleSelection(id)}
        onSelectAll={(ids) => selectedIds.selectAll(ids)}
      />
      <ConfirmDialog />
    </div>
  );
}
