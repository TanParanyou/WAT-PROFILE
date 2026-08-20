"use client";

import React from "react";
import { Link } from "@/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminTableAction, AdminTableActionGroup } from "@/components/admin/AdminTableAction";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/hooks/useConfirm";
import { userAdminService, roleAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useTranslations } from "next-intl";
import type { User } from "@/types/entities";
import { useApiError } from "@/hooks/useApiError";
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
import { useQuery } from "@tanstack/react-query";

interface UserFilters extends AdminFilterRecord {
  status: string[];
  role: string[];
}

export default function UsersListPage() {
  const t = useTranslations("Admin");
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const selectedIds = useRowSelection<string>();

  const listState = useAdminListState<UserFilters>({
    schema: {
      defaultSort: "id",
      defaultOrder: "asc",
      multi: ["status", "role"],
      allowedSorts: ["id", "name", "email", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<User, UserFilters>({
    queryKey: ["admin", "users"],
    params: listState.params,
    fetcher: (params) => userAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const { data: rolesData } = useQuery({
    queryKey: ["admin", "roles", "options"],
    queryFn: async () => {
      const res = await roleAdminService.getPaginated({
        page: 1,
        limit: 100,
        search: "",
        order: "asc",
        filters: { status: [] },
      });
      return res.data || [];
    },
  });

  const filterDefinitions: AdminFilterDefinition<UserFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: t("common.filter.status"),
      options: [
        { value: "active", label: t("common.filter.statusActive") },
        { value: "inactive", label: t("common.filter.statusInactive") },
      ],
    },
    {
      key: "role",
      kind: "multi",
      label: t("common.filter.role"),
      options: (rolesData || []).map((r) => ({ value: String(r.id), label: r.name })),
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({
      key: "status",
      value: s,
      label: t("common.filter.statusWithVal", {
        value: s === "active" ? t("common.filter.statusActive") : s === "inactive" ? t("common.filter.statusInactive") : s,
      }),
    });
  }
  for (const rId of listState.params.filters.role || []) {
    const rName = rolesData?.find((r) => String(r.id) === rId)?.name || rId;
    activeChips.push({
      key: "role",
      value: rId,
      label: t("common.filter.roleWithVal", { value: rName }),
    });
  }

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
          await userAdminService.bulkDelete(selectedIds.selectedArray);
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
        { header: "Email", accessor: (item) => item.email || "" },
        { header: "Role", accessor: (item) => (item.role as User["role"])?.name || "" },
        { header: "Status", accessor: (item) => (item.is_active ? "Active" : "Inactive") },
        {
          header: "Last Login",
          accessor: (item) =>
            item.last_login_at ? new Date(item.last_login_at as string).toLocaleDateString("th-TH") : "",
        },
      ],
      "users_export"
    );
  };

  const columns: Column<User>[] = [
    { header: t("columns.name"), accessorKey: "name", sortable: true },
    { header: t("columns.email"), accessorKey: "email", sortable: true },
    {
      header: t("columns.role"),
      accessorKey: "role",
      cell: (v) => (v as User["role"])?.name || "-",
    },
    {
      header: t("columns.status"),
      accessorKey: "is_active",
      cell: (v) => (
        <StatusBadge
          label={v ? t("common.filter.statusActive") : t("common.filter.statusInactive")}
          variant={v ? "success" : "default"}
        />
      ),
    },
    {
      header: t("columns.lastLogin"),
      accessorKey: "last_login_at",
      cell: (v) =>
        v ? new Date(v as string).toLocaleDateString("th-TH") : "-",
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => (
        <AdminTableActionGroup>
          <AdminTableAction
            resource="users"
            action="update"
            label={t("common.edit") || "แก้ไข"}
            icon={<Icons.Edit size={16} />}
            href={`/admin/users/${row.id}`}
          />
          <AdminTableAction
            resource="users"
            action="delete"
            variant="danger"
            label={t("common.delete") || "ลบ"}
            icon={<Icons.Delete size={16} />}
            onClick={() => handleDelete(String(row.id))}
          />
        </AdminTableActionGroup>
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
            icon={<Icons.Plus size={14} />}
          >
            <Link href="/admin/users/create">{t("users.create")}</Link>
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
            <>
              <AdminMultiSelectFilter
                label={t("common.filter.status")}
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.status || []}
                onChange={(val) => listState.actions.setFilter("status", val)}
              />
              <AdminMultiSelectFilter
                label={t("common.filter.role")}
                options={filterDefinitions[1].options || []}
                values={listState.params.filters.role || []}
                onChange={(val) => listState.actions.setFilter("role", val)}
              />
            </>
          }
          activeFilters={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <AdminActiveFilterChips
                filters={activeChips}
                onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof UserFilters, val)}
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
            {t("common.bulkDelete")}
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
    </div>
  );
}
