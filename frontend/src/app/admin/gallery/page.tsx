"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/components/ui/Modal";
import { useDataTable } from "@/hooks/useDataTable";
import { galleryAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/admin/Toast";
import type { Gallery } from "@/types/entities";

export default function GalleryListPage() {
  const t = useTranslations("Admin");
  const { data, pagination, sort, isLoading, onPageChange, onSort, fetchData } =
    useDataTable<Gallery>({
      fetcher: (p) =>
        galleryAdminService.getAll({ page: p.page, limit: p.limit }),
    });
  const { confirm, ConfirmDialog } = useConfirm();
  const { toasts, toast, removeToast } = useToast();

  const handleDelete = async (id: number) => {
    if (
      await confirm({
        title: t("common.delete"),
        message: t("common.confirmDelete"),
        variant: "danger",
      })
    ) {
      try {
        await galleryAdminService.delete(id);
        toast.success(t("common.success"));
        fetchData();
      } catch {
        toast.error(t("common.error"));
      }
    }
  };

  const columns: Column<Gallery>[] = [
    {
      header: "รูปภาพ",
      accessorKey: "thumbnail_url",
      cell: (v, row) => {
        const imgUrl = v || row.image_url;
        return imgUrl ? (
          <img src={imgUrl} alt="" className="h-16 w-24 object-cover rounded" />
        ) : (
          <div className="h-16 w-24 rounded bg-gray-200" />
        );
      },
    },
    {
      header: "คำอธิบาย (TH)",
      accessorKey: "caption",
      cell: (v) => v?.th || "-",
      sortable: true,
    },
    {
      header: "หมวดหมู่",
      accessorKey: "category",
      cell: (v) => v?.name?.th || "-",
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
        <div className="flex gap-2">
          <PermissionGuard resource="gallery" action="delete">
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded hover:bg-red-50 text-red-500"
            >
              <Trash2 size={16} />
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
              icon={<Plus size={16} />}
            >
              <Link href="/admin/gallery/upload">{t("gallery.upload")}</Link>
            </PermissionButton>
          </div>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        sorting={sort}
        isLoading={isLoading}
        onPageChange={onPageChange}
        onSort={onSort}
      />
      <ConfirmDialog />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
