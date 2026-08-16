"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Select";
import { registrationAdminService, eventAdminService } from "@/services/adminService";
import { fetchAdminEventRegistrations, setAdminEventRegistrationStatus } from "@/features/admin/event-registrations/api";
import { toAdminRegistrationTableRow, type AdminRegistrationTableRow } from "@/features/admin/event-registrations/mappers";
import { useToast } from "@/hooks/useToast";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { useConfirm } from "@/hooks/useConfirm";
import { Icons } from "@/components/ui/Icons";
import { useAdminListState } from "@/features/admin-list/useAdminListState";
import { useAdminListQuery } from "@/features/admin-list/useAdminListQuery";
import type { AdminFilterRecord, AdminFilterDefinition, AdminPageSize } from "@/features/admin-list/types";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminDateRangeFilter } from "@/components/admin/list/AdminDateRangeFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { AdminListExportButton } from "@/components/admin/list/AdminListExportButton";
import { exportToCsv } from "@/services/adminListExportService";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";

interface RegistrationFilters extends AdminFilterRecord {
  status: string[];
  event: string[];
  from?: string;
  to?: string;
}

export default function RegistrationsPage() {
  const t = useTranslations("Admin");
  const localeValue = useLocale();
  const locale = localeValue === "en" || localeValue === "de" ? localeValue : "th";
  const localeTag = locale === "th" ? "th-TH" : locale === "de" ? "de-DE" : "en-US";

  const statusOptions = [
    { value: "pending", label: t("registrations.pending") },
    { value: "confirmed", label: t("registrations.approved") },
    { value: "attended", label: t("registrations.attended") },
    { value: "cancelled", label: t("registrations.cancelled") },
  ];

  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const selectedIds = useRowSelection();

  const listState = useAdminListState<RegistrationFilters>({
    schema: {
      defaultSort: "created_at",
      defaultOrder: "desc",
      multi: ["status", "event"],
      single: ["from", "to"],
      allowedSorts: ["id", "name", "email", "event_title", "status", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<AdminRegistrationTableRow, RegistrationFilters>({
    queryKey: ["admin", "registrations"],
    params: listState.params,
    fetcher: async (params) => {
      const statuses = params.filters.status.filter((value): value is "pending" | "confirmed" | "cancelled" | "attended" => ["pending", "confirmed", "cancelled", "attended"].includes(value));
      const result = await fetchAdminEventRegistrations({
        page: params.page,
        limit: params.limit,
        search: params.search,
        sort: params.sort,
        order: params.order,
        from: params.filters.from,
        to: params.filters.to,
        status: statuses,
        event_id: (params.filters.event ?? []).map((value) => Number(value)).filter((value) => Number.isInteger(value)),
      });
      return { data: result.items.map((item) => toAdminRegistrationTableRow(item, locale)), pagination: { ...result.pagination, limit: result.pagination.limit as AdminPageSize } };
    },
    setPage: listState.actions.setPage,
  });

  const { data: eventsData } = useQuery({
    queryKey: ["admin", "events", "options"],
    queryFn: async () => {
      const res = await eventAdminService.getPaginated({
        page: 1,
        limit: 100,
        search: "",
        order: "asc",
        filters: {},
      });
      return res.data || [];
    },
  });

  const filterDefinitions: AdminFilterDefinition<RegistrationFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: t("registrations.filterStatus"),
      options: [
        { value: "pending", label: t("registrations.pending") },
        { value: "confirmed", label: t("registrations.approved") },
        { value: "attended", label: t("registrations.attended") },
        { value: "cancelled", label: t("registrations.cancelled") },
      ],
    },
    {
      key: "event",
      kind: "multi",
      label: t("registrations.filterEvent"),
      options: (eventsData || []).map((e) => ({ value: String(e.id), label: e.title?.[locale] || String(e.id) })),
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({ key: "status", value: s, label: t("registrations.activeStatus", { status: t(`registrations.${s === "confirmed" ? "approved" : s}`) }) });
  }
  for (const eId of listState.params.filters.event || []) {
    const eTitle = eventsData?.find((e) => String(e.id) === eId)?.title?.[locale] || eId;
    activeChips.push({ key: "event", value: eId, label: t("registrations.activeEvent", { event: eTitle }) });
  }
  if (listState.params.filters.from) {
    activeChips.push({ key: "from", value: listState.params.filters.from, label: t("registrations.activeFrom", { date: listState.params.filters.from }) });
  }
  if (listState.params.filters.to) {
    activeChips.push({ key: "to", value: listState.params.filters.to, label: t("registrations.activeTo", { date: listState.params.filters.to }) });
  }

  const handleDelete = async (id: number) => {
    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await registrationAdminService.delete(id);
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
          await registrationAdminService.bulkDelete(selectedIds.selectedArray);
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
        { header: t("registrations.csvId"), accessor: (item) => String(item.id || "") },
        { header: t("columns.name"), accessor: (item) => String(item.name || "") },
        { header: t("columns.email"), accessor: (item) => String(item.email || "") },
        { header: t("columns.phone"), accessor: (item) => String(item.phone || "") },
        { header: t("columns.event"), accessor: (item) => String(item.event_title || "") },
        { header: t("columns.status"), accessor: (item) => t(`registrations.${item.status === "confirmed" ? "approved" : item.status}`) },
        {
          header: t("columns.date"),
          accessor: (item) =>
            item.created_at ? new Date(String(item.created_at)).toLocaleDateString(localeTag) : "",
        },
      ],
      "registrations_export"
    );
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await setAdminEventRegistrationStatus(id, newStatus as "pending" | "confirmed" | "cancelled" | "attended");
      toast.success(t("common.success"));
      listQuery.refetch();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<AdminRegistrationTableRow>[] = [
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
    {
      header: t("columns.phone"),
      accessorKey: "phone",
      cell: (v) => String(v || "-"),
    },
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
      cell: (v) => <StatusBadge label={t(`registrations.${String(v) === "confirmed" ? "approved" : String(v || "pending")}`)} />,
    },
    {
      header: t("columns.date"),
      accessorKey: "created_at",
      sortable: true,
      cell: (v) =>
        v
          ? new Date(String(v)).toLocaleDateString(localeTag, {
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
        <div className="flex gap-1.5">
          <Link href={`/admin/registrations/${String(row.id)}`} className="inline-flex min-h-11 items-center border border-admin-border px-3 text-xs font-semibold text-admin-foreground hover:bg-admin-surface">{t("registrations.view")}</Link>
          <PermissionGuard resource="events" action="delete">
            <button
              type="button"
              onClick={() => handleDelete(Number(row.id))}
              className="p-1.5 rounded hover:bg-admin-danger-surface text-admin-muted hover:text-admin-danger transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
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
        title={t("registrations.title")}
        breadcrumbs={[{ label: t("registrations.title") }]}
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
                label={t("registrations.filterStatus")}
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.status || []}
                onChange={(val) => listState.actions.setFilter("status", val)}
              />
              <AdminMultiSelectFilter
                label={t("registrations.filterEvent")}
                options={filterDefinitions[1].options || []}
                values={listState.params.filters.event || []}
                onChange={(val) => listState.actions.setFilter("event", val)}
              />
            </>
          }
          activeFilters={
            <div className="flex items-center justify-between">
              <AdminActiveFilterChips
                filters={activeChips}
                onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof RegistrationFilters, val)}
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
            label={t("registrations.filterDateRange")}
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
        <PermissionGuard resource="events" action="delete">
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
