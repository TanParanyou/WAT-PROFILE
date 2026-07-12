"use client";

import React, { useState } from "react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/components/ui/Modal";
import { useDataTable } from "@/hooks/useDataTable";
import { Button } from "@/components/ui/Button";
import { monkAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Monk } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";
import { Icons } from "@/components/ui/Icons";
import { Drawer } from "@/components/ui/Drawer";
import { IframePreview } from "@/components/ui/IframePreview";
import { useAppOptions } from "@/hooks/useAppOptions";

export default function MonksListPage() {
  const t = useTranslations("Admin");
  const { getMonkPositionLabel } = useAppOptions();
  const { data, pagination, sort, isLoading, onPageChange, onSort, fetchData } =
    useDataTable<Monk>({
      fetcher: (p) => monkAdminService.getAll({ page: p.page, limit: p.limit }),
    });
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const selectedIds = useRowSelection();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDelete = async (id: number) => {
    if (
      await confirm({
        title: t("common.delete"),
        message: t("common.confirmDelete"),
        variant: "danger",
      })
    ) {
      try {
        await monkAdminService.delete(id);
        toast.success(t("common.success"));
        selectedIds.clearSelection();
        fetchData();
      } catch {
        toast.error(t("common.error"));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.selectedCount === 0) return;
    if (
      await confirm({
        title: t("common.delete"),
        message: t("common.confirmDelete"),
        variant: "danger",
      })
    ) {
      try {
        await monkAdminService.bulkDelete(selectedIds.selectedArray);
        toast.success(t("common.success"));
        selectedIds.clearSelection();
        fetchData();
      } catch {
        toast.error(t("common.error"));
      }
    }
  };

  const handleExportCsv = () => {
    const exportData = data.map((monk) => ({
      id: monk.id,
      "name.th": monk.name?.th || "",
      "name.en": monk.name?.en || "",
      position: monk.position || "",
      is_active: monk.is_active ? "Active" : "Inactive",
    }));
    exportToCsv("monks_export", exportData, [
      { label: "ID", key: "id" },
      { label: "Name (TH)", key: "name.th" },
      { label: "Name (EN)", key: "name.en" },
      { label: "Position", key: "position" },
      { label: "Status", key: "is_active" },
    ]);
  };

  const columns: Column<Monk>[] = [
    {
      header: t("columns.image"),
      accessorKey: "image_url",
      cell: (v) =>
        v ? (
          <img
            src={v as string}
            alt=""
            className="h-10 w-10 rounded-full object-cover border border-zinc-200"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-zinc-100 border border-dashed border-zinc-200" />
        ),
    },
    {
      header: t("columns.nameTh"),
      accessorKey: "name",
      cell: (v) => (v as Monk["name"])?.th || "-",
      sortable: true,
    },
    {
      header: t("columns.position"),
      accessorKey: "position",
      cell: (v) => getMonkPositionLabel(v as string),
      sortable: true,
    },
    {
      header: t("columns.status"),
      accessorKey: "is_active",
      cell: (v) => <StatusBadge label={v ? "Active" : "Inactive"} />,
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setPreviewUrl(`/monks/${row.slug}`)}
            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 transition-colors"
            title="ดูหน้าเว็บสาธารณะ"
          >
            <Icons.View size={16} />
          </button>
          <PermissionGuard resource="monks" action="update">
            <Link
              href={`/admin/monks/${row.id}`}
              className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 transition-colors"
            >
              <Icons.Edit size={16} />
            </Link>
          </PermissionGuard>
          <PermissionGuard resource="monks" action="delete">
            <button
              type="button"
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors"
              title={t("common.delete")}
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
        title={t("monks.title")}
        breadcrumbs={[{ label: t("monks.title") }]}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={handleExportCsv}
              variant="outline"
              icon={<Icons.Download size={14} />}
              className="shadow-sm"
            >
              {t("common.exportCsv")}
            </Button>
            <PermissionButton
              resource="monks"
              action="create"
              icon={<Icons.Plus size={14} />}
            >
              <Link href="/admin/monks/create">{t("monks.create")}</Link>
            </PermissionButton>
          </div>
        }
      />

      <BulkActionToolbar
        selectedCount={selectedIds.selectedCount}
        onClear={selectedIds.clearSelection}
      >
        <PermissionGuard resource="monks" action="delete">
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors text-sm font-medium"
          >
            <Icons.Delete size={16} />
            {t("common.bulkDelete")}
          </button>
        </PermissionGuard>
      </BulkActionToolbar>

      <div className="mt-6">
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
      </div>

      <ConfirmDialog />

      {/* Public View Slide-over Drawer */}
      <Drawer
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="ตัวอย่างบนเว็บไซต์ (Live Preview)"
      >
        {previewUrl && <IframePreview url={previewUrl} />}
      </Drawer>
    </div>
  );
}
