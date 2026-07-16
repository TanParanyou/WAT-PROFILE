"use client";

import React from "react";
import { Link } from "@/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/components/ui/Modal";
import { useDataTable } from "@/hooks/useDataTable";
import { Button } from "@/components/ui/Button";
import { userAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useTranslations } from "next-intl";
import type { User } from "@/types/entities";
import { useApiError } from "@/hooks/useApiError";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";
import { Icons } from "@/components/ui/Icons";

export default function UsersListPage() {
  const t = useTranslations("Admin");
  const { data, pagination, sort, isLoading, onPageChange, onSort, fetchData } =
    useDataTable<User>({
      fetcher: (p) => userAdminService.getAll({ page: p.page, limit: p.limit }),
    });
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const selectedIds = useRowSelection<string>();

  const handleDelete = async (id: string) => {
    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await userAdminService.delete(id);
          toast.success(t("common.success"));
          selectedIds.clearSelection();
          fetchData();
        } catch (err: unknown) {
          handleApiError(err);
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
          await userAdminService.bulkDelete(selectedIds.selectedArray);
          toast.success(t("common.success"));
          selectedIds.clearSelection();
          fetchData();
        } catch (err: unknown) {
          handleApiError(err);
          throw err;
        }
      },
    });
  };

  const handleExportCsv = () => {
    const exportData = data.map((item) => ({
      id: item.id,
      name: item.name || "",
      email: item.email || "",
      role: item.role?.name || "",
      is_active: item.is_active ? "Active" : "Inactive",
      last_login_at: item.last_login_at
        ? new Date(item.last_login_at as string).toLocaleDateString("th-TH")
        : "",
    }));

    exportToCsv("users_export", exportData, [
      { label: "ID", key: "id" },
      { label: "Name", key: "name" },
      { label: "Email", key: "email" },
      { label: "Role", key: "role" },
      { label: "Status", key: "is_active" },
      { label: "Last Login", key: "last_login_at" },
    ]);
  };

  const columns: Column<User>[] = [
    { header: "ชื่อ-นามสกุล", accessorKey: "name", sortable: true },
    { header: "อีเมล", accessorKey: "email", sortable: true },
    {
      header: "บทบาท",
      accessorKey: "role",
      cell: (v) => (v as User["role"])?.name || "-",
    },
    {
      header: "สถานะ",
      accessorKey: "is_active",
      cell: (v) => <StatusBadge label={v ? "Active" : "Inactive"} />,
    },
    {
      header: "เข้าสู่ระบบล่าสุด",
      accessorKey: "last_login_at",
      cell: (v) =>
        v ? new Date(v as string).toLocaleDateString("th-TH") : "-",
    },
    {
      header: "จัดการ",
      cell: (_, row) => (
        <div className="flex gap-1.5">
          <PermissionGuard resource="users" action="update">
            <Link
              href={`/admin/users/${row.id}`}
              className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 transition-colors"
            >
              <Icons.Edit size={16} />
            </Link>
          </PermissionGuard>
          <PermissionGuard resource="users" action="delete">
            <button
              type="button"
              onClick={() => handleDelete(String(row.id))}
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
        title={t("users.title")}
        breadcrumbs={[{ label: t("users.title") }]}
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
              resource="users"
              action="create"
              icon={<Icons.Plus size={14} />}
            >
              <Link href="/admin/users/create">{t("users.create")}</Link>
            </PermissionButton>
          </div>
        }
      />

      <BulkActionToolbar
        selectedCount={selectedIds.selectedCount}
        onClear={selectedIds.clearSelection}
      >
        <PermissionGuard resource="users" action="delete">
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
          onSelect={(id) => selectedIds.toggleSelection(id as string)}
          onSelectAll={(ids) => selectedIds.selectAll(ids as string[])}
        />
      </div>

      <ConfirmDialog />
    </div>
  );
}
