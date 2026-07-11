"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Select";
import { useDataTable } from "@/hooks/useDataTable";
import { registrationAdminService } from "@/services/adminService";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/Modal";

export default function RegistrationsPage() {
  const t = useTranslations("Admin");

  const statusOptions = [
    { value: "pending", label: t("registrations.pending") },
    { value: "approved", label: t("registrations.approved") },
    { value: "rejected", label: t("registrations.rejected") },
    { value: "cancelled", label: t("registrations.cancelled") },
  ];

  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const selectedIds = useRowSelection();

  const { data, pagination, sort, onPageChange, onSort, isLoading, fetchData } =
    useDataTable<Record<string, unknown>>({
      fetcher: (p) =>
        registrationAdminService.getAll({ page: p.page, limit: p.limit }),
    });

  const handleDelete = async (id: number) => {
    if (
      await confirm({
        title: t("common.delete"),
        message: t("common.confirmDelete"),
        variant: "danger",
      })
    ) {
      try {
        await registrationAdminService.delete(id);
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
        await registrationAdminService.bulkDelete(selectedIds.selectedArray);
        toast.success(t("common.success"));
        selectedIds.clearSelection();
        fetchData();
      } catch {
        toast.error(t("common.error"));
      }
    }
  };

  const handleExportCsv = () => {
    const exportData = data.map((item) => ({
      id: item.id || "",
      name: item.name || "",
      email: item.email || "",
      phone: item.phone || "",
      event_title: item.event_title || "",
      status: item.status || "",
      created_at: item.created_at
        ? new Date(item.created_at as string).toLocaleDateString("th-TH")
        : "",
    }));

    exportToCsv("registrations_export", exportData, [
      { label: "ID", key: "id" },
      { label: "Name", key: "name" },
      { label: "Email", key: "email" },
      { label: "Phone", key: "phone" },
      { label: "Event", key: "event_title" },
      { label: "Status", key: "status" },
      { label: "Date", key: "created_at" },
    ]);
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await registrationAdminService.updateStatus(id, newStatus);
      toast.success(t("common.success"));
      fetchData();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      header: t("columns.name"),
      accessorKey: "name",
      sortable: true,
      cell: (v) => <span className="font-medium">{String(v || "-")}</span>,
    },
    {
      header: t("columns.email"),
      accessorKey: "email",
      sortable: true,
      cell: (v) => String(v || "-"),
    },
    { header: t("columns.phone"), accessorKey: "phone", cell: (v) => String(v || "-") },
    {
      header: t("columns.event"),
      accessorKey: "event_title",
      sortable: true,
      cell: (v) => String(v || "-"),
    },
    {
      header: t("columns.status"),
      accessorKey: "status",
      sortable: true,
      cell: (v) => <StatusBadge label={String(v || "pending")} />,
    },
    {
      header: t("columns.date"),
      accessorKey: "created_at",
      sortable: true,
      cell: (v) =>
        v
          ? new Date(String(v)).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-",
    },
    {
      header: t("columns.status"),
      accessorKey: "id",
      cell: (v, row) => {
        const id = Number(v);
        return (
          <Select
            value={String(row.status || "pending")}
            onChange={(e) => handleStatusUpdate(id, e.target.value)}
            options={statusOptions}
            disabled={updatingId === id}
          />
        );
      },
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => (
        <div className="flex gap-2">
          <PermissionGuard resource="events" action="delete">
            <Button
              onClick={() => handleDelete(Number(row.id))}
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
        title={t("registrations.title")}
        breadcrumbs={[{ label: t("registrations.title") }]}
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
        <PermissionGuard resource="events" action="delete">
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
