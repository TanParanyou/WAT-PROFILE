"use client";

import React from "react";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminTableAction, AdminTableActionGroup } from "@/components/admin/AdminTableAction";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/hooks/useConfirm";
import { chantingAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Chanting } from "@/types/chanting";
import { useRowSelection } from "@/hooks/useRowSelection";
import { Icons } from "@/components/ui/Icons";
import { Drawer } from "@/components/ui/Drawer";
import { IframePreview } from "@/components/ui/IframePreview";
import { useAdminListState } from "@/features/admin-list/useAdminListState";
import { useAdminListQuery } from "@/features/admin-list/useAdminListQuery";
import type { AdminFilterRecord, AdminFilterDefinition } from "@/features/admin-list/types";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { AdminListExportButton } from "@/components/admin/list/AdminListExportButton";
import { exportToCsv } from "@/services/adminListExportService";
import { useDisclosure } from "@/hooks/useDisclosure";
import { formatDate } from "@/utils/formatters";
import { Music, Clock } from "lucide-react";

interface ChantingFilters extends AdminFilterRecord {
  category: string[];
  status: string[];
}

export default function AdminChantingListPage() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const selectedIds = useRowSelection();
  const previewDrawer = useDisclosure<string>();

  const listState = useAdminListState<ChantingFilters>({
    schema: {
      defaultSort: "display_order",
      defaultOrder: "asc",
      multi: ["category", "status"],
      allowedSorts: ["id", "display_order", "title", "category", "duration", "status", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<Chanting, ChantingFilters>({
    queryKey: ["admin", "chanting"],
    params: listState.params,
    fetcher: (params) => chantingAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const categoryOptions = [
    { value: "morning_chant", label: t("chanting.categories.morning_chant") },
    { value: "evening_chant", label: t("chanting.categories.evening_chant") },
    { value: "paritta", label: t("chanting.categories.paritta") },
    { value: "blessing", label: t("chanting.categories.blessing") },
    { value: "funeral", label: t("chanting.categories.funeral") },
    { value: "general", label: t("chanting.categories.general") },
  ];

  const categoryLabelMap = Object.fromEntries(
    categoryOptions.map((opt) => [opt.value, opt.label]),
  );

  const statusLabelMap: Record<string, string> = {
    active: t("common.active"),
    inactive: t("common.inactive"),
  };

  const filterDefinitions: AdminFilterDefinition<ChantingFilters>[] = [
    {
      key: "category",
      kind: "multi",
      label: t("chanting.filterCategory"),
      options: categoryOptions,
    },
    {
      key: "status",
      kind: "multi",
      label: t("chanting.filterStatus"),
      options: [
        { value: "active", label: t("common.active") },
        { value: "inactive", label: t("common.inactive") },
      ],
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const c of listState.params.filters.category || []) {
    activeChips.push({
      key: "category",
      value: c,
      label: `${t("chanting.category")}: ${categoryLabelMap[c] || c}`,
    });
  }
  for (const s of listState.params.filters.status || []) {
    activeChips.push({
      key: "status",
      value: s,
      label: t("common.filter.statusWithVal", { value: statusLabelMap[s] || s }),
    });
  }

  const handleDelete = async (id: number) => {
    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await chantingAdminService.delete(id);
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
        { header: t("columns.id"), accessor: (item) => item.id },
        { header: t("columns.title"), accessor: (item) => item.title?.th || item.title?.en || "" },
        { header: t("columns.category"), accessor: (item) => categoryLabelMap[item.category] || item.category },
        { header: t("chanting.paliThai"), accessor: (item) => item.pali_thai || "" },
        { header: t("chanting.paliRoman"), accessor: (item) => item.pali_roman || "" },
        { header: t("chanting.hasAudio"), accessor: (item) => (item.audio_url ? "Yes" : "No") },
        {
          header: t("columns.date"),
          accessor: (item) => (item.created_at ? formatDate(item.created_at, locale) : ""),
        },
      ],
      "chantings_export",
    );
  };

  const columns: Column<Chanting>[] = [
    {
      header: t("columns.order"),
      accessorKey: "display_order",
      sortable: true,
      cell: (v) => <span className="font-mono font-medium">{String(v ?? 0)}</span>,
    },
    {
      header: t("columns.title"),
      accessorKey: "title",
      sortable: true,
      cell: (v) => {
        const titleObj = v as Chanting["title"];
        const primary = titleObj?.[locale as "th" | "en" | "de"] || titleObj?.th || titleObj?.en || "-";
        const secondary = locale === "th" ? titleObj?.en : titleObj?.th;
        return (
          <div>
            <div className="font-semibold text-admin-foreground">{primary}</div>
            {secondary && secondary !== primary && (
              <div className="text-xs text-admin-muted">{secondary}</div>
            )}
          </div>
        );
      },
    },
    {
      header: t("columns.category"),
      accessorKey: "category",
      sortable: true,
      cell: (v) => (
        <span className="inline-flex border border-admin-border bg-admin-surface px-2 py-0.5 text-xs font-mono font-medium">
          {categoryLabelMap[String(v)] || String(v)}
        </span>
      ),
    },
    {
      header: t("chanting.media"),
      accessorKey: "audio_url",
      cell: (v, row) => (
        <div className="flex items-center gap-2 text-xs">
          {v ? (
            <span className="inline-flex items-center gap-1 text-admin-success font-medium">
              <Music size={13} aria-hidden />
              <span>Audio</span>
            </span>
          ) : (
            <span className="text-admin-muted">-</span>
          )}
          {row.duration_seconds > 0 && (
            <span className="inline-flex items-center gap-1 text-admin-muted font-mono">
              <Clock size={11} aria-hidden />
              <span>{Math.round(row.duration_seconds / 60)}m</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: t("columns.status"),
      accessorKey: "is_active",
      sortable: true,
      cell: (v) => <StatusBadge label={v ? t("common.active") : t("common.inactive")} />,
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => (
        <AdminTableActionGroup>
          <AdminTableAction
            label={t("website.viewPublic") || "ดูหน้าเว็บสาธารณะ"}
            icon={<Icons.View size={16} />}
            onClick={() => previewDrawer.open(`/${locale}/chanting/${row.slug}`)}
          />
          <AdminTableAction
            resource="chanting"
            action="update"
            label={t("common.edit") || "แก้ไข"}
            icon={<Icons.Edit size={16} />}
            href={`/admin/chanting/${row.id}`}
          />
          <AdminTableAction
            resource="chanting"
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
    <div className="space-y-6">
      <AdminPageHeader
        title={t("chanting.title")}
        breadcrumbs={[{ label: t("chanting.title") }]}
        actions={
          <PermissionGuard resource="chanting" action="create">
            <Link href="/admin/chanting/create">
              <PermissionButton
                resource="chanting"
                action="create"
                icon={<Icons.Plus size={16} />}
              >
                {t("chanting.create")}
              </PermissionButton>
            </Link>
          </PermissionGuard>
        }
      />

      <div className="space-y-4">
        <AdminListToolbar
          activeFilterCount={activeChips.length}
          search={
            <AdminSearchInput
              value={listState.draftSearch}
              isDebouncing={listState.isDebouncing}
              onChange={(val) => listState.actions.setSearch(val)}
              onSubmit={(val) => listState.actions.setSearch(val, true)}
              onClear={() => listState.actions.setSearch("", true)}
              placeholder={t("chanting.searchPlaceholder")}
            />
          }
          primaryFilters={
            <>
              <AdminMultiSelectFilter
                label={t("chanting.filterCategory")}
                options={categoryOptions}
                values={listState.params.filters.category || []}
                onChange={(val) => listState.actions.setFilter("category", val)}
              />
              <AdminMultiSelectFilter
                label={t("chanting.filterStatus")}
                options={filterDefinitions[1].options || []}
                values={listState.params.filters.status || []}
                onChange={(val) => listState.actions.setFilter("status", val)}
              />
            </>
          }
          activeFilters={
            <div className="flex items-center justify-between">
              <AdminActiveFilterChips
                filters={activeChips}
                onRemove={(key, val) =>
                  listState.actions.removeFilterValue(key as keyof ChantingFilters, val)
                }
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

        <DataTable
          columns={columns}
          data={listQuery.rows}
          pagination={listQuery.pagination}
          sorting={{
            key: listState.params.sort || "display_order",
            order: listState.params.order,
          }}
          isLoading={listQuery.isLoading}
          onPageChange={listState.actions.setPage}
          onLimitChange={listState.actions.setLimit}
          onSort={(field) => listState.actions.setSort(field)}
        />
      </div>

      <ConfirmDialog />

      {/* Live Preview Drawer */}
      <Drawer
        isOpen={previewDrawer.isOpen}
        onClose={previewDrawer.close}
        title={t("website.previewModalTitle") || "ตัวอย่างบนเว็บไซต์ (Live Preview)"}
      >
        {previewDrawer.data && <IframePreview url={previewDrawer.data} />}
      </Drawer>
    </div>
  );
}
