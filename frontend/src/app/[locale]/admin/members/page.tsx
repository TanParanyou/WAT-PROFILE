"use client";

import React from "react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminTableAction } from "@/components/admin/AdminTableAction";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/hooks/useConfirm";
import { memberAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Member } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { Icons } from "@/components/ui/Icons";
import { useAdminListState } from "@/features/admin-list/useAdminListState";
import { useAdminListQuery } from "@/features/admin-list/useAdminListQuery";
import type { AdminFilterRecord, AdminFilterDefinition } from "@/features/admin-list/types";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminDateRangeFilter } from "@/components/admin/list/AdminDateRangeFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { AdminListExportButton } from "@/components/admin/list/AdminListExportButton";
import { exportToCsv } from "@/services/adminListExportService";

interface MemberFilters extends AdminFilterRecord {
  status: string[];
  type: string[];
  from?: string;
  to?: string;
}

export default function MembersPage() {
  const t = useTranslations("Admin");
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const selectedIds = useRowSelection();

  const listState = useAdminListState<MemberFilters>({
    schema: {
      defaultSort: "created_at",
      defaultOrder: "desc",
      multi: ["status", "type"],
      single: ["from", "to"],
      allowedSorts: ["id", "member_code", "first_name_th", "membership_type", "membership_status", "membership_date", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<Member, MemberFilters>({
    queryKey: ["admin", "members"],
    params: listState.params,
    fetcher: (params) => memberAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const statusLabelMap: Record<string, string> = {
    active: t("members.status.active"),
    pending: t("members.status.pending"),
    inactive: t("members.status.inactive"),
  };

  const typeLabelMap: Record<string, string> = {
    monk: t("members.types.monk"),
    layperson: t("members.types.layperson"),
    vip: t("members.types.vip"),
    general: t("members.types.general"),
  };

  const filterDefinitions: AdminFilterDefinition<MemberFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: t("common.filter.memberStatus"),
      options: [
        { value: "active", label: t("members.status.active") },
        { value: "pending", label: t("members.status.pending") },
        { value: "inactive", label: t("members.status.inactive") },
      ],
    },
    {
      key: "type",
      kind: "multi",
      label: t("common.filter.memberType"),
      options: [
        { value: "monk", label: t("members.types.monk") },
        { value: "layperson", label: t("members.types.layperson") },
        { value: "vip", label: t("members.types.vip") },
        { value: "general", label: t("members.types.general") },
      ],
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({
      key: "status",
      value: s,
      label: t("common.filter.statusWithVal", { value: statusLabelMap[s] || s }),
    });
  }
  for (const tp of listState.params.filters.type || []) {
    activeChips.push({
      key: "type",
      value: tp,
      label: t("common.filter.typeWithVal", { value: typeLabelMap[tp] || tp }),
    });
  }
  if (listState.params.filters.from) {
    activeChips.push({
      key: "from",
      value: listState.params.filters.from,
      label: t("common.filter.fromDate", { date: listState.params.filters.from }),
    });
  }
  if (listState.params.filters.to) {
    activeChips.push({
      key: "to",
      value: listState.params.filters.to,
      label: t("common.filter.toDate", { date: listState.params.filters.to }),
    });
  }

  const handleDelete = async (id: number) => {
    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await memberAdminService.delete(id);
          toast.success(t("common.success"));
          selectedIds.clearSelection();
          listQuery.refetch();
        } catch (err) {
          toast.error(t("common.error"));
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
          await memberAdminService.bulkDelete(selectedIds.selectedArray);
          toast.success(t("common.success"));
          selectedIds.clearSelection();
          listQuery.refetch();
        } catch (err) {
          toast.error(t("common.error"));
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
        { header: "Member Code", accessor: (item) => item.member_code || "" },
        { header: "First Name (TH)", accessor: (item) => item.first_name_th || "" },
        { header: "Last Name (TH)", accessor: (item) => item.last_name_th || "" },
        { header: "Phone", accessor: (item) => item.phone || "" },
        { header: "Type", accessor: (item) => item.membership_type || "" },
        { header: "Status", accessor: (item) => item.membership_status || "" },
        {
          header: "Date",
          accessor: (item) =>
            item.membership_date ? new Date(item.membership_date).toLocaleDateString("th-TH") : "",
        },
      ],
      "members_export"
    );
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
          <div className="h-10 w-10 rounded-full bg-admin-surface-muted border border-admin-border" />
        ),
    },
    {
      header: t("members.memberCode"),
      accessorKey: "member_code",
      sortable: true,
    },
    {
      header: t("members.fullName"),
      accessorKey: "first_name_th",
      sortable: true,
      cell: (_, row) => `${row.first_name_th || ""} ${row.last_name_th || ""}`,
    },
    { header: t("columns.phone"), accessorKey: "phone" },
    {
      header: t("columns.type"),
      accessorKey: "membership_type",
      sortable: true,
    },
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
        <AdminTableAction
          resource="members"
          action="delete"
          variant="danger"
          label={t("common.delete") || "ลบ"}
          icon={<Icons.Delete size={16} />}
          onClick={() => handleDelete(row.id)}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("members.title")}
        breadcrumbs={[{ label: t("members.title") }]}
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
                label={t("common.filter.memberStatus")}
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.status || []}
                onChange={(val) => listState.actions.setFilter("status", val)}
              />
              <AdminMultiSelectFilter
                label={t("common.filter.memberType")}
                options={filterDefinitions[1].options || []}
                values={listState.params.filters.type || []}
                onChange={(val) => listState.actions.setFilter("type", val)}
              />
            </>
          }
          activeFilters={
            <div className="flex items-center justify-between">
              <AdminActiveFilterChips
                filters={activeChips}
                onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof MemberFilters, val)}
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
        >
          <AdminDateRangeFilter
            label={t("common.filter.applyDate")}
            from={listState.params.filters.from}
            to={listState.params.filters.to}
            onChange={({ from, to }) => {
              listState.actions.setFilters({
                from: from,
                to: to,
              });
            }}
          />
        </AdminListToolbar>
      </div>

      <BulkActionToolbar
        selectedCount={selectedIds.selectedCount}
        onClear={selectedIds.clearSelection}
      >
        <PermissionGuard resource="members" action="delete">
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
        {listQuery.isError ? (
          <div
            className="mb-4 flex flex-col gap-3 border border-admin-danger bg-admin-danger-surface p-4 text-sm text-admin-danger sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p>{t("members.loadError")}</p>
            <button
              type="button"
              onClick={() => void listQuery.refetch()}
              className="min-h-11 border border-admin-danger px-4 py-2 font-medium text-admin-danger hover:bg-admin-surface focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              {t("members.retry")}
            </button>
          </div>
        ) : null}

        {!listQuery.isFetching && !listQuery.isError && listQuery.pagination.total === 0 ? (
          <div className="mb-4 border border-admin-border bg-admin-surface-muted p-5">
            <h2 className="text-base font-semibold text-admin-foreground">
              {t("members.emptyTitle")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-admin-muted">
              {t("members.emptyDescription")}
            </p>
            <PermissionGuard resource="account_operations" action="read">
              <Link
                href="/admin/accounts"
                className="mt-4 inline-flex min-h-11 items-center border border-admin-control-border bg-admin-surface px-4 py-2 text-sm font-medium text-admin-foreground hover:bg-admin-surface-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
              >
                {t("members.viewAccounts")}
              </Link>
            </PermissionGuard>
          </div>
        ) : null}

        <DataTable
          columns={columns}
          data={listQuery.rows}
          pagination={listQuery.pagination}
          sorting={{ key: listState.params.sort || "created_at", order: listState.params.order }}
          isLoading={listQuery.isLoading}
          onPageChange={listState.actions.setPage}
          onLimitChange={listState.actions.setLimit}
          onSort={(field) => listState.actions.setSort(field)}
          selectable={true}
          selectedIds={selectedIds.selectedIds as Set<string | number>}
          onSelect={(id) => selectedIds.toggleSelection(id)}
          onSelectAll={(ids) => selectedIds.selectAll(ids)}
        />
      </div>
      <ConfirmDialog />
    </div>
  );
}
