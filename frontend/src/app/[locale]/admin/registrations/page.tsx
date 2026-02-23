"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Select";
import { useDataTable } from "@/hooks/useDataTable";
import { registrationAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/admin/Toast";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/Modal";

const statusOptions = [
  { value: "pending", label: "รอดำเนินการ" },
  { value: "approved", label: "อนุมัติ" },
  { value: "rejected", label: "ปฏิเสธ" },
  { value: "cancelled", label: "ยกเลิก" },
];

export default function RegistrationsPage() {
  const { toasts, toast, removeToast } = useToast();
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
        title: "ลบการลงทะเบียน",
        message: "ยืนยันการลบ?",
        variant: "danger",
      })
    ) {
      try {
        await registrationAdminService.delete(id);
        toast.success("ลบสำเร็จ");
        selectedIds.clearSelection();
        fetchData();
      } catch {
        toast.error("ลบไม่สำเร็จ");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.selectedCount === 0) return;
    if (
      await confirm({
        title: "ลบการลงทะเบียน",
        message: "ยืนยันการลบที่เลือก?",
        variant: "danger",
      })
    ) {
      try {
        await registrationAdminService.bulkDelete(selectedIds.selectedArray);
        toast.success("ลบสำเร็จ");
        selectedIds.clearSelection();
        fetchData();
      } catch {
        toast.error("ลบไม่สำเร็จ");
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
      toast.success("อัปเดตสถานะสำเร็จ");
      fetchData();
    } catch {
      toast.error("อัปเดตไม่สำเร็จ");
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      header: "ชื่อ",
      accessorKey: "name",
      sortable: true,
      cell: (v) => <span className="font-medium">{String(v || "-")}</span>,
    },
    {
      header: "อีเมล",
      accessorKey: "email",
      sortable: true,
      cell: (v) => String(v || "-"),
    },
    { header: "โทรศัพท์", accessorKey: "phone", cell: (v) => String(v || "-") },
    {
      header: "กิจกรรม",
      accessorKey: "event_title",
      sortable: true,
      cell: (v) => String(v || "-"),
    },
    {
      header: "สถานะ",
      accessorKey: "status",
      sortable: true,
      cell: (v) => <StatusBadge label={String(v || "pending")} />,
    },
    {
      header: "วันที่",
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
      header: "สถานะ",
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
      header: "จัดการ",
      cell: (_, row) => (
        <div className="flex gap-2">
          <PermissionGuard resource="events" action="delete">
            <button
              onClick={() => handleDelete(Number(row.id))}
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
        title="การลงทะเบียน"
        breadcrumbs={[{ label: "การลงทะเบียน" }]}
      />

      <div className="flex justify-between items-center mb-4 mt-4">
        <div />
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
        >
          Export CSV
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
            ลบข้อมูลที่เลือก
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
