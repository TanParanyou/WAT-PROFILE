"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/components/ui/Modal";
import { useDataTable } from "@/hooks/useDataTable";
import { memberAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/admin/Toast";
import type { Member } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";

export default function MembersPage() {
  const t = useTranslations("Admin");
  const { toasts, toast, removeToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const selectedIds = useRowSelection();

  const { data, pagination, sort, onPageChange, onSort, isLoading, fetchData } =
    useDataTable<Member>({
      fetcher: (p) =>
        memberAdminService.getAll({ page: p.page, limit: p.limit }),
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
        await memberAdminService.delete(id);
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
        await memberAdminService.bulkDelete(selectedIds.selectedArray);
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
      id: item.id,
      member_code: item.member_code || "",
      first_name_th: item.first_name_th || "",
      last_name_th: item.last_name_th || "",
      phone: item.phone || "",
      membership_type: item.membership_type || "",
      membership_status: item.membership_status || "",
      membership_date: item.membership_date
        ? new Date(item.membership_date).toLocaleDateString("th-TH")
        : "",
    }));

    exportToCsv("members_export", exportData, [
      { label: "ID", key: "id" },
      { label: "Member Code", key: "member_code" },
      { label: "First Name (TH)", key: "first_name_th" },
      { label: "Last Name (TH)", key: "last_name_th" },
      { label: "Phone", key: "phone" },
      { label: "Type", key: "membership_type" },
      { label: "Status", key: "membership_status" },
      { label: "Date", key: "membership_date" },
    ]);
  };

  const columns: Column<Member>[] = [
    {
      header: t("columns.image"),
      accessorKey: "profile_image_url",
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
    { header: t("members.memberCode"), accessorKey: "member_code", sortable: true },
    {
      header: t("members.fullName"),
      accessorKey: "first_name_th",
      sortable: true,
      cell: (_, row) => `${row.first_name_th} ${row.last_name_th}`,
    },
    { header: t("columns.phone"), accessorKey: "phone" },
    { header: t("columns.type"), accessorKey: "membership_type", sortable: true },
    {
      header: t("columns.status"),
      accessorKey: "membership_status",
      sortable: true,
      cell: (v) => <StatusBadge label={v as string} />,
    },
    {
      header: t("members.joinDate"),
      accessorKey: "membership_date",
      sortable: true,
      cell: (v) =>
        v ? new Date(v as string).toLocaleDateString("th-TH") : "-",
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => (
        <PermissionGuard resource="members" action="delete">
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded hover:bg-red-50 text-red-500"
          >
            <Trash2 size={16} />
          </button>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("members.title")}
        breadcrumbs={[{ label: t("members.title") }]}
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
        <PermissionGuard resource="members" action="delete">
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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
