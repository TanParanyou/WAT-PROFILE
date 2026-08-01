"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { FormModal } from "@/components/ui/Modal";
import { useConfirm } from "@/hooks/useConfirm";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
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
import { Icons } from "@/components/ui/Icons";
import { useAdminListState } from "@/features/admin-list/useAdminListState";
import { useAdminListQuery } from "@/features/admin-list/useAdminListQuery";
import type { AdminFilterRecord, AdminFilterDefinition } from "@/features/admin-list/types";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { AdminListExportButton } from "@/components/admin/list/AdminListExportButton";
import { exportToCsv } from "@/services/adminListExportService";

interface RoleFilters extends AdminFilterRecord {
  status: string[];
}

export default function RolesPage() {
  const t = useTranslations("Admin");
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const selectedIds = useRowSelection<string>();

  const listState = useAdminListState<RoleFilters>({
    schema: {
      defaultSort: "id",
      defaultOrder: "asc",
      multi: ["status"],
      allowedSorts: ["id", "name", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<Role, RoleFilters>({
    queryKey: ["admin", "roles"],
    params: listState.params,
    fetcher: (params) => roleAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const filterDefinitions: AdminFilterDefinition<RoleFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: "สถานะ",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({ key: "status", value: s, label: `สถานะ: ${s}` });
  }

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

    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await roleAdminService.delete(id);
          toast.success(t("common.success"));
          selectedIds.clearSelection();
          listQuery.refetch();
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
          await roleAdminService.bulkDelete(selectedIds.selectedArray);
          toast.success(t("common.success"));
          selectedIds.clearSelection();
          listQuery.refetch();
        } catch (err: unknown) {
          handleApiError(err);
          throw err;
        }
      },
    });
  };

  const handleExportCsv = () => {
    exportToCsv(
      listQuery.rows,
      [
        { header: "ID", accessor: (item) => item.id },
        { header: "Name", accessor: (item) => item.name || "" },
        { header: "Description", accessor: (item) => item.description || "" },
        { header: "Status", accessor: (item) => (item.is_active ? "Active" : "Inactive") },
      ],
      "roles_export"
    );
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
      listQuery.refetch();
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
              className="p-1.5 rounded hover:bg-admin-surface-muted text-admin-muted hover:text-admin-foreground transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <Icons.Edit size={16} />
            </button>
          </PermissionGuard>
          <PermissionGuard resource="users" action="delete">
            <button
              type="button"
              onClick={() => handleDelete(String(row.id), row.name)}
              className="p-1.5 rounded hover:bg-admin-danger-surface text-admin-muted hover:text-admin-danger transition-colors disabled:opacity-50 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-admin-focus"
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
          <PermissionButton
            onClick={handleOpenCreate}
            resource="users"
            action="create"
            icon={<Icons.Plus size={14} />}
          >
            {t("roles.create")}
          </PermissionButton>
        }
      />

      <div className="mt-4">
        <AdminListToolbar
          activeFilterCount={activeChips.length}
          search={
            <AdminSearchInput
              value={listState.draftSearch}
              isDebouncing={listState.isDebouncing}
              onChange={(val) => listState.actions.setSearch(val)}
              onSubmit={(val) => listState.actions.setSearch(val, true)}
              onClear={() => listState.actions.setSearch("", true)}
            />
          }
          primaryFilters={
            <AdminMultiSelectFilter
              label="สถานะ"
              options={filterDefinitions[0].options || []}
              values={listState.params.filters.status || []}
              onChange={(val) => listState.actions.setFilter("status", val)}
            />
          }
          activeFilters={
            <div className="flex items-center justify-between">
              <AdminActiveFilterChips
                filters={activeChips}
                onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof RoleFilters, val)}
                onClear={listState.actions.clearFilters}
              />
              <AdminListExportButton
                isExporting={false}
                completed={0}
                total={listQuery.pagination.total}
                onExport={handleExportCsv}
              />
            </div>
          }
        />
      </div>

      <BulkActionToolbar
        selectedCount={selectedIds.selectedCount}
        onClear={selectedIds.clearSelection}
      >
        <PermissionGuard resource="users" action="delete">
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-admin-danger hover:brightness-90 text-admin-on-action rounded-none transition-colors text-sm font-medium focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            <Icons.Delete size={16} />
            {t("common.delete")}
          </button>
        </PermissionGuard>
      </BulkActionToolbar>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={listQuery.rows}
          pagination={listQuery.pagination}
          sorting={{ key: listState.params.sort || "id", order: listState.params.order }}
          isLoading={listQuery.isLoading}
          onPageChange={listState.actions.setPage}
          onLimitChange={listState.actions.setLimit}
          onSort={(field) => listState.actions.setSort(field)}
          selectable={true}
          selectedIds={selectedIds.selectedIds as Set<string | number>}
          onSelect={(id) => selectedIds.toggleSelection(id as string)}
          onSelectAll={(ids) => selectedIds.selectAll(ids as string[])}
        />
      </div>

      <ConfirmDialog />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? t("roles.edit") : t("roles.create")}
        onSubmit={(e) => {
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
            <label className="block text-sm font-medium text-admin-body mb-2">
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
              <p className="text-sm text-admin-danger mt-1">
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
                  <Switch
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
