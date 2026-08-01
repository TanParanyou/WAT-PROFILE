"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Select";
import { registrationAdminService, eventAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { useConfirm } from "@/hooks/useConfirm";
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
import { useQuery } from "@tanstack/react-query";

interface RegistrationFilters extends AdminFilterRecord {
  status: string[];
  event: string[];
  from?: string;
  to?: string;
}

export default function RegistrationsPage() {
  const t = useTranslations("Admin");

  const statusOptions = [
    { value: "pending", label: t("registrations.pending") },
    { value: "confirmed", label: t("registrations.approved") },
    { value: "attended", label: "Attended" },
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

  const listQuery = useAdminListQuery<Record<string, unknown>, RegistrationFilters>({
    queryKey: ["admin", "registrations"],
    params: listState.params,
    fetcher: (params) => registrationAdminService.getPaginated(params),
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
      label: "สถานะ",
      options: [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "attended", label: "Attended" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    {
      key: "event",
      kind: "multi",
      label: "กิจกรรม",
      options: (eventsData || []).map((e) => ({ value: String(e.id), label: e.title?.th || String(e.id) })),
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({ key: "status", value: s, label: `สถานะ: ${s}` });
  }
  for (const eId of listState.params.filters.event || []) {
    const eTitle = eventsData?.find((e) => String(e.id) === eId)?.title?.th || eId;
    activeChips.push({ key: "event", value: eId, label: `กิจกรรม: ${eTitle}` });
  }
  if (listState.params.filters.from) {
    activeChips.push({ key: "from", value: listState.params.filters.from, label: `ตั้งแต่วันที่: ${listState.params.filters.from}` });
  }
  if (listState.params.filters.to) {
    activeChips.push({ key: "to", value: listState.params.filters.to, label: `ถึงวันที่: ${listState.params.filters.to}` });
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
        { header: "ID", accessor: (item) => String(item.id || "") },
        { header: "Name", accessor: (item) => String(item.name || "") },
        { header: "Email", accessor: (item) => String(item.email || "") },
        { header: "Phone", accessor: (item) => String(item.phone || "") },
        { header: "Event", accessor: (item) => String(item.event_title || "") },
        { header: "Status", accessor: (item) => String(item.status || "") },
        {
          header: "Date",
          accessor: (item) =>
            item.created_at ? new Date(String(item.created_at)).toLocaleDateString("th-TH") : "",
        },
      ],
      "registrations_export"
    );
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await registrationAdminService.updateStatus(id, newStatus);
      toast.success(t("common.success"));
      listQuery.refetch();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
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
      cell: (v) => <StatusBadge label={String(v || "pending")} />,
    },
    {
      header: t("columns.date"),
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
          <PermissionGuard resource="events" action="delete">
            <button
              type="button"
              onClick={() => handleDelete(Number(row.id))}
              className="p-1.5 rounded hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors"
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
                label="สถานะ"
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.status || []}
                onChange={(val) => listState.actions.setFilter("status", val)}
              />
              <AdminMultiSelectFilter
                label="กิจกรรม"
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
            label="ช่วงวันที่ลงทะเบียน"
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
