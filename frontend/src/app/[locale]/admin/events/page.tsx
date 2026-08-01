"use client";

import React, { useState } from "react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/hooks/useConfirm";
import { eventAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Event } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { Drawer } from "@/components/ui/Drawer";
import { IframePreview } from "@/components/ui/IframePreview";
import { Icons } from "@/components/ui/Icons";
import { useDateFormat } from "@/hooks/useDateFormat";
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

interface EventFilters extends AdminFilterRecord {
  status: string[];
  type: string[];
  from?: string;
  to?: string;
}

export default function EventsListPage() {
  const t = useTranslations("Admin");
  const { formatDateRange } = useDateFormat();
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const selectedIds = useRowSelection();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const listState = useAdminListState<EventFilters>({
    schema: {
      defaultSort: "start_date",
      defaultOrder: "desc",
      multi: ["status", "type"],
      single: ["from", "to"],
      allowedSorts: ["id", "title", "event_type", "start_date", "end_date", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<Event, EventFilters>({
    queryKey: ["admin", "events"],
    params: listState.params,
    fetcher: (params) => eventAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const filterDefinitions: AdminFilterDefinition<EventFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: "สถานะ",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
        { value: "archived", label: "Archived" },
      ],
    },
    {
      key: "type",
      kind: "multi",
      label: "ประเภทกิจกรรม",
      options: [
        { value: "ceremony", label: "Ceremony" },
        { value: "merit", label: "Merit" },
        { value: "meditation", label: "Meditation" },
        { value: "general", label: "General" },
      ],
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({ key: "status", value: s, label: `สถานะ: ${s}` });
  }
  for (const tp of listState.params.filters.type || []) {
    activeChips.push({ key: "type", value: tp, label: `ประเภท: ${tp}` });
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
          await eventAdminService.delete(id);
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
          await eventAdminService.bulkDelete(selectedIds.selectedArray);
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
        { header: "Title (TH)", accessor: (item) => item.title?.th || "" },
        { header: "Title (EN)", accessor: (item) => item.title?.en || "" },
        { header: "Type", accessor: (item) => item.event_type || "" },
        { header: "Date", accessor: (item) => formatDateRange(item.start_date, item.end_date) },
        { header: "Status", accessor: (item) => (item.is_active ? "Active" : "Inactive") },
      ],
      "events_export"
    );
  };

  const columns: Column<Event>[] = [
    {
      header: "ชื่อ (TH)",
      accessorKey: "title",
      cell: (v) => (v as Event["title"])?.th || "-",
      sortable: true,
    },
    { header: "ประเภท", accessorKey: "event_type", sortable: true },
    {
      header: "วันที่",
      accessorKey: "start_date",
      cell: (_, row) => formatDateRange(row.start_date, row.end_date),
      sortable: true,
    },
    {
      header: "สถานะ",
      accessorKey: "is_active",
      cell: (v) => <StatusBadge label={v ? "Active" : "Inactive"} />,
    },
    {
      header: "จัดการ",
      cell: (_, row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPreviewUrl(`/events/${row.slug || row.id}`)}
            className="p-1.5 rounded hover:bg-admin-surface-muted text-admin-muted hover:text-admin-foreground transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
            title={t("website.viewPublic")}
          >
            <Icons.View size={16} />
          </button>
          <PermissionGuard resource="events" action="update">
            <Link
              href={`/admin/events/${row.id}`}
              className="p-1.5 rounded hover:bg-admin-surface-muted text-admin-muted hover:text-admin-foreground transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <Icons.Edit size={16} />
            </Link>
          </PermissionGuard>
          <PermissionGuard resource="events" action="delete">
            <button
              type="button"
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded hover:bg-admin-danger-surface text-admin-muted hover:text-admin-danger transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
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
    <div className="space-y-6">
      <AdminPageHeader
        title={t("events.title")}
        breadcrumbs={[{ label: t("events.title") }]}
        actions={
          <PermissionButton
            resource="events"
            action="create"
            icon={<Icons.Plus size={14} />}
          >
            <Link href="/admin/events/create">{t("events.create")}</Link>
          </PermissionButton>
        }
      />

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
              label="ประเภทกิจกรรม"
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
              onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof EventFilters, val)}
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
          label="ช่วงวันที่กิจกรรม"
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
            {t("common.delete")}
          </button>
        </PermissionGuard>
      </BulkActionToolbar>

      <DataTable
        columns={columns}
        data={listQuery.rows}
        pagination={listQuery.pagination}
        sorting={{ key: listState.params.sort || "start_date", order: listState.params.order }}
        isLoading={listQuery.isLoading}
        onPageChange={listState.actions.setPage}
        onLimitChange={listState.actions.setLimit}
        onSort={(field) => listState.actions.setSort(field)}
        selectable={true}
        selectedIds={selectedIds.selectedIds as Set<string | number>}
        onSelect={(id) => selectedIds.toggleSelection(id)}
        onSelectAll={(ids) => selectedIds.selectAll(ids)}
      />
      <ConfirmDialog />

      {/* Drawer Preview */}
      <Drawer
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title={t("website.viewPublic")}
        size="xl"
      >
        {previewUrl && (
          <IframePreview url={previewUrl} title="Event Public Preview" />
        )}
      </Drawer>
    </div>
  );
}
