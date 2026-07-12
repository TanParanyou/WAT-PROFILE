"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { FormModal, useConfirm } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { useDataTable } from "@/hooks/useDataTable";
import { Button } from "@/components/ui/Button";
import { roleAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import { PermissionEditor } from "@/components/admin/PermissionEditor";
import { useTranslations } from "next-intl";
import type { Role } from "@/types/entities";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleSchema, type RoleFormData } from "@/schemas/role.schema";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";
import { Icons } from "@/components/ui/Icons";

export default function RolesPage() {
  const t = useTranslations("Admin");
  const { data, isLoading, fetchData } = useDataTable<Role>({
    fetcher: () => roleAdminService.getAll(),
  });
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const selectedIds = useRowSelection<string>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
      permissions: {},
    },
  });

  const handleOpenCreate = () => {
    setEditingRole(null);
    reset({
      name: "",
      description: "",
      is_active: true,
      permissions: {},
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    reset({
      name: role.name,
      description: role.description || "",
      is_active: role.is_active,
      permissions: role.permissions || {},
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (name === "admin") {
      toast.error("Cannot delete 'admin' role");
      return;
    }

    const ok = await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
    });
    if (ok) {
      try {
        await roleAdminService.delete(id);
        toast.success(t("common.success"));
        selectedIds.clearSelection();
        fetchData();
      } catch (err: unknown) {
        handleApiError(err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.selectedCount === 0) return;
    const ok = await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
    });
    if (ok) {
      try {
        await roleAdminService.bulkDelete(selectedIds.selectedArray);
        toast.success(t("common.success"));
        selectedIds.clearSelection();
        fetchData();
      } catch (err: unknown) {
        handleApiError(err);
      }
    }
  };

  const handleExportCsv = () => {
    const exportData = data.map((item) => ({
      id: item.id,
      name: item.name || "",
      description: item.description || "",
      is_active: item.is_active ? "Active" : "Inactive",
    }));

    exportToCsv("roles_export", exportData, [
      { label: "ID", key: "id" },
      { label: "Name", key: "name" },
      { label: "Description", key: "description" },
      { label: "Status", key: "is_active" },
    ]);
  };

  const onSubmit = async (data: RoleFormData) => {
    setIsSaving(true);
    try {
      if (editingRole) {
        await roleAdminService.update(editingRole.id, data);
        toast.success(t("common.success"));
      } else {
        await roleAdminService.create(data);
        toast.success(t("common.success"));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      handleApiError(err, setError);
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<Role>[] = [
    { header: "ชื่อบทบาท", accessorKey: "name", sortable: true },
    { header: "รายละเอียด", accessorKey: "description" },
    {
      header: "สถานะ",
      accessorKey: "is_active",
      cell: (v) => <StatusBadge label={v ? "Active" : "Inactive"} />,
    },
    {
      header: "จัดการ",
      cell: (_, row) => (
        <div className="flex gap-1.5">
          <PermissionGuard resource="users" action="update">
            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 transition-colors"
            >
              <Icons.Edit size={16} />
            </button>
          </PermissionGuard>
          <PermissionGuard resource="users" action="delete">
            <button
              type="button"
              onClick={() => handleDelete(String(row.id), row.name)}
              className="p-1.5 rounded hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              disabled={row.name === "admin"}
            >
              <Icons.Delete
                size={16}
                className={row.name === "admin" ? "opacity-30" : ""}
              />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("roles.title")}
        breadcrumbs={[{ label: t("roles.title") }]}
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
              onClick={handleOpenCreate}
              resource="users"
              action="create"
              icon={<Icons.Plus size={14} />}
            >
              {t("roles.create")}
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
            {t("common.delete")}
          </button>
        </PermissionGuard>
      </BulkActionToolbar>

      {/* Roles are usually few, so hide pagination */}
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        hidePagination
        selectable={true}
        selectedIds={selectedIds.selectedIds as Set<string | number>}
        onSelect={(id) => selectedIds.toggleSelection(id as string)}
        onSelectAll={(ids) => selectedIds.selectAll(ids as string[])}
      />

      <ConfirmDialog />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? t("roles.edit") : t("roles.create")}
        onSubmit={(e) => {
          // Need to pass event through RHF's handleSubmit
          handleSubmit(onSubmit)(e);
        }}
        isLoading={isSaving}
        size="xl"
      >
        <div className="space-y-4 pt-2">
          <Input
            id="role-name"
            label="ชื่อบทบาท *"
            {...register("name")}
            error={errors.name?.message}
            disabled={editingRole?.name === "admin"}
          />

          <Input
            id="role-description"
            label="รายละเอียด"
            {...register("description")}
            error={errors.description?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สิทธิ์การเข้าถึง (Permissions)
            </label>
            <Controller
              control={control}
              name="permissions"
              render={({ field }) => (
                <PermissionEditor
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.permissions?.message && (
              <p className="text-sm text-red-600 mt-1">
                {String(errors.permissions.message)}
              </p>
            )}
          </div>

          {editingRole?.name !== "admin" && (
            <div className="mt-4">
              <Controller
                control={control}
                name="is_active"
                render={({ field }) => (
                  <Checkbox
                    id="role-is-active"
                    label="เปิดใช้งานบทบาท"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </div>
          )}
        </div>
      </FormModal>
    </div>
  );
}
