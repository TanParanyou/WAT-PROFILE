"use client";

import React from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/components/ui/Modal";
import { useDataTable } from "@/hooks/useDataTable";
import { userAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/admin/Toast";
import { useTranslations } from "next-intl";
import type { User } from "@/types/entities";
import { useApiError } from "@/hooks/useApiError";

export default function UsersListPage() {
  const t = useTranslations("Admin");
  const { data, pagination, sort, isLoading, onPageChange, onSort, fetchData } =
    useDataTable<User>({
      fetcher: (p) => userAdminService.getAll({ page: p.page, limit: p.limit }),
    });
  const { confirm, ConfirmDialog } = useConfirm();
  const { toasts, toast, removeToast } = useToast();
  const { handleApiError } = useApiError();

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
    });
    if (ok) {
      try {
        await userAdminService.delete(id);
        toast.success(t("common.success"));
        fetchData();
      } catch (err: unknown) {
        handleApiError(err);
      }
    }
  };

  const columns: Column<User>[] = [
    { header: "ชื่อ-นามสกุล", accessorKey: "name", sortable: true },
    { header: "อีเมล", accessorKey: "email", sortable: true },
    { header: "บทบาท", accessorKey: "role", cell: (v) => v?.name || "-" },
    {
      header: "สถานะ",
      accessorKey: "is_active",
      cell: (v) => <StatusBadge label={v ? "Active" : "Inactive"} />,
    },
    {
      header: "เข้าสู่ระบบล่าสุด",
      accessorKey: "last_login_at",
      cell: (v) => (v ? new Date(v).toLocaleDateString("th-TH") : "-"),
    },
    {
      header: "จัดการ",
      cell: (_, row) => (
        <div className="flex gap-2">
          <PermissionGuard resource="users" action="update">
            <Link
              href={`/admin/users/${row.id}/edit`}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            >
              <Pencil size={16} />
            </Link>
          </PermissionGuard>
          <PermissionGuard resource="users" action="delete">
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
        title={t("users.title")}
        breadcrumbs={[{ label: t("users.title") }]}
        actions={
          <PermissionButton
            resource="users"
            action="create"
            icon={<Plus size={16} />}
          >
            <Link href="/admin/users/create">{t("users.create")}</Link>
          </PermissionButton>
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
