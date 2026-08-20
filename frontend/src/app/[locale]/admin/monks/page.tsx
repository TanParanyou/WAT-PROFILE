"use client";

import React, { useState } from "react";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminTableAction, AdminTableActionGroup } from "@/components/admin/AdminTableAction";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/hooks/useConfirm";
import { monkAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Monk } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { Icons } from "@/components/ui/Icons";
import { Drawer } from "@/components/ui/Drawer";
import { IframePreview } from "@/components/ui/IframePreview";
import { useAppOptions } from "@/hooks/useAppOptions";
import { useAdminListState } from "@/features/admin-list/useAdminListState";
import { useAdminListQuery } from "@/features/admin-list/useAdminListQuery";
import type { AdminFilterRecord, AdminFilterDefinition } from "@/features/admin-list/types";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { AdminListExportButton } from "@/components/admin/list/AdminListExportButton";
import { exportToCsv } from "@/services/adminListExportService";

interface MonkFilters extends AdminFilterRecord {
  status: string[];
}

export default function MonksListPage() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const { getMonkPositionLabel } = useAppOptions();
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const selectedIds = useRowSelection();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const listState = useAdminListState<MonkFilters>({
    schema: {
      defaultSort: "pansa",
      defaultOrder: "desc",
      multi: ["status"],
      allowedSorts: ["id", "name", "position", "pansa", "ordination_date", "display_order", "status", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<Monk, MonkFilters>({
    queryKey: ["admin", "monks"],
    params: listState.params,
    fetcher: (params) => monkAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const filterDefinitions: AdminFilterDefinition<MonkFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: "สถานะ",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "retired", label: "Retired" },
      ],
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({ key: "status", value: s, label: `สถานะ: ${s}` });
  }

  const handleDelete = async (id: number) => {
    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await monkAdminService.delete(id);
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
          await monkAdminService.bulkDelete(selectedIds.selectedArray);
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
        { header: "Name (TH)", accessor: (item) => item.name?.th || "" },
        { header: "Name (EN)", accessor: (item) => item.name?.en || "" },
        { header: "Position", accessor: (item) => item.position || "" },
        { header: "Status", accessor: (item) => (item.is_active ? "Active" : "Inactive") },
      ],
      "monks_export"
    );
  };

  const columns: Column<Monk>[] = [
    {
      header: t("columns.image"),
      accessorKey: "image_url",
      cell: (v) =>
        v ? (
          <img
            src={v as string}
            alt=""
            className="h-10 w-10 rounded-full object-cover border border-admin-border"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-admin-surface-muted border border-dashed border-admin-border" />
        ),
    },
    {
      header: t("columns.nameTh"),
      accessorKey: "name",
      cell: (v) => (v as Monk["name"])?.th || "-",
      sortable: true,
    },
    {
      header: t("columns.position"),
      accessorKey: "position",
      cell: (v) => getMonkPositionLabel(v as string),
      sortable: true,
    },
    {
      header: t("columns.status"),
      accessorKey: "is_active",
      cell: (v) => <StatusBadge label={v ? "Active" : "Inactive"} />,
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => (
        <AdminTableActionGroup>
          <AdminTableAction
            label={t("website.viewPublic") || "ดูหน้าเว็บสาธารณะ"}
            icon={<Icons.View size={16} />}
            onClick={() => setPreviewUrl(`/${locale}/monks/${row.slug || row.id}`)}
          />
          <AdminTableAction
            resource="monks"
            action="update"
            label={t("common.edit") || "แก้ไข"}
            icon={<Icons.Edit size={16} />}
            href={`/admin/monks/${row.id}`}
          />
          <AdminTableAction
            resource="monks"
            action="delete"
            variant="danger"
            label={t("common.delete") || "ลบ"}
            icon={<Icons.Delete size={16} />}
            onClick={() => handleDelete(row.id)}
          />
        </AdminTableActionGroup>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("monks.title")}
        breadcrumbs={[{ label: t("monks.title") }]}
        actions={
          <PermissionButton
            resource="monks"
            action="create"
            icon={<Icons.Plus size={14} />}
          >
            <Link href="/admin/monks/create">{t("monks.create")}</Link>
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
                onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof MonkFilters, val)}
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
        <PermissionGuard resource="monks" action="delete">
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
          sorting={{ key: listState.params.sort || "pansa", order: listState.params.order }}
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

      {/* Public View Slide-over Drawer */}
      <Drawer
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="ตัวอย่างบนเว็บไซต์ (Live Preview)"
      >
        {previewUrl && <IframePreview url={previewUrl} />}
      </Drawer>
    </div>
  );
}
