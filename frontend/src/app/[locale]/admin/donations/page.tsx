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
import { donationAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/admin/Toast";
import type { Donation } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";

export default function DonationsPage() {
  const t = useTranslations("Admin");
  const { toasts, toast, removeToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const selectedIds = useRowSelection();

  const { data, pagination, sort, onPageChange, onSort, isLoading, fetchData } =
    useDataTable<Donation>({
      fetcher: (p) =>
        donationAdminService.getAll({ page: p.page, limit: p.limit }),
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
        await donationAdminService.delete(id);
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
        await donationAdminService.bulkDelete(selectedIds.selectedArray);
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
      receipt_number: item.receipt_number || "",
      donor_name: item.donor_name || "",
      amount: item.amount || 0,
      currency: item.currency || "THB",
      donation_method: item.donation_method || "",
      category: item.category?.name?.th || "",
      donation_date: item.donation_date
        ? new Date(item.donation_date).toLocaleDateString("th-TH")
        : "",
      status: item.status || "",
    }));

    exportToCsv("donations_export", exportData, [
      { label: "ID", key: "id" },
      { label: "Receipt Number", key: "receipt_number" },
      { label: "Donor Name", key: "donor_name" },
      { label: "Amount", key: "amount" },
      { label: "Currency", key: "currency" },
      { label: "Method", key: "donation_method" },
      { label: "Category", key: "category" },
      { label: "Date", key: "donation_date" },
      { label: "Status", key: "status" },
    ]);
  };

  const columns: Column<Donation>[] = [
    { header: t("donations.receiptNumber"), accessorKey: "receipt_number", sortable: true },
    {
      header: t("donations.donor"),
      accessorKey: "donor_name",
      sortable: true,
      cell: (v, row) => (
        <div>
          <span className="font-medium">{v}</span>
          {row.is_anonymous && (
            <span className="ml-1 text-xs text-gray-500">{t("donations.anonymous")}</span>
          )}
        </div>
      ),
    },
    {
      header: t("donations.amount"),
      accessorKey: "amount",
      sortable: true,
      cell: (v, row) => (
        <span className="font-semibold text-green-600">
          {Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 })}{" "}
          {row.currency}
        </span>
      ),
    },
    { header: t("donations.method"), accessorKey: "donation_method", sortable: true },
    {
      header: t("columns.category"),
      accessorKey: "category",
      cell: (v) => (v as Donation["category"])?.name?.th || "-",
    },
    {
      header: t("columns.date"),
      accessorKey: "donation_date",
      sortable: true,
      cell: (v) =>
        new Date(v as string).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      header: t("columns.status"),
      accessorKey: "status",
      sortable: true,
      cell: (v) => <StatusBadge label={v as string} />,
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => (
        <PermissionGuard resource="donations" action="delete">
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
        title={t("donations.title")}
        breadcrumbs={[{ label: t("donations.title") }]}
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
        <PermissionGuard resource="donations" action="delete">
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
