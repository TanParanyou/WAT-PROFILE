"use client";

import React from "react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
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

export default function MonksListPage() {
  const t = useTranslations("Admin");
  const { data, pagination, sort, isLoading, onPageChange, onSort, fetchData } =
    useDataTable<Monk>({
      fetcher: (p) => monkAdminService.getAll({ page: p.page, limit: p.limit }),
    });
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const selectedIds = useRowSelection();

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
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-200" />
        ),
    },
    {
      header: t("columns.nameTh"),
      accessorKey: "name",
      cell: (v) => (v as Monk["name"])?.th || "-",
      sortable: true,
    },
    { header: t("columns.position"), accessorKey: "position", sortable: true },
    {
      header: t("columns.status"),
      accessorKey: "is_active",
      cell: (v) => <StatusBadge label={v ? "Active" : "Inactive"} />,
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => (
        <div className="flex gap-2">
          <PermissionGuard resource="monks" action="update">
            <Link
              href={`/admin/monks/${row.id}/edit`}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            >
              <Pencil size={16} />
            </Link>
          </PermissionGuard>
          <PermissionGuard resource="monks" action="delete">
            <Button
              onClick={() => handleDelete(row.id)}
              variant="danger"
              size="icon"
            >
              <Trash2 size={16} />
            </Button>
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
          <PermissionButton
            resource="monks"
            action="create"
            icon={<Plus size={16} />}
          >
            <Link href="/admin/monks/create">{t("monks.create")}</Link>
          </PermissionButton>
        }
      />

      <div className="flex justify-between items-center mb-4 mt-4">
        <div />
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
        >
          {t("common.exportCsv")}
        </button>
      </div>

      <BulkActionToolbar
        selectedCount={selectedIds.selectedCount}
        onClear={selectedIds.clearSelection}
      >
        <PermissionGuard resource="monks" action="delete">
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            {t("common.bulkDelete")}
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
