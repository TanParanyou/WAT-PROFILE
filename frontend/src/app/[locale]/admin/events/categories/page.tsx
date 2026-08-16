"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { FormModal, useModal } from "@/components/ui/Modal";
import { useConfirm } from "@/hooks/useConfirm";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { eventCategoryAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import type { EventCategory } from "@/types/entities";
import type { MultiLangText } from "@/types/api";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  eventCategorySchema,
  type EventCategoryFormData,
} from "@/schemas/event.schema";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { useAdminListState } from "@/features/admin-list/useAdminListState";
import { useAdminListQuery } from "@/features/admin-list/useAdminListQuery";
import type { AdminFilterRecord, AdminFilterDefinition } from "@/features/admin-list/types";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { AdminListExportButton } from "@/components/admin/list/AdminListExportButton";
import { exportToCsv } from "@/services/adminListExportService";
import { Icons } from "@/components/ui/Icons";
import { emptyLang } from "@/constants";

interface EventCategoryFilters extends AdminFilterRecord {
  status: string[];
}

export default function EventCategoriesPage() {
  const t = useTranslations("Admin");
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen, open, close } = useModal();
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const selectedIds = useRowSelection();

  const [editingId, setEditingId] = useState<number | null>(null);

  const listState = useAdminListState<EventCategoryFilters>({
    schema: {
      defaultSort: "display_order",
      defaultOrder: "asc",
      multi: ["status"],
      allowedSorts: ["id", "name", "display_order", "is_active", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<EventCategory, EventCategoryFilters>({
    queryKey: ["admin", "event_categories"],
    params: listState.params,
    fetcher: (params) => eventCategoryAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const filterDefinitions: AdminFilterDefinition<EventCategoryFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: t("events.status.label"),
      options: [
        { value: "active", label: t("events.status.active") },
        { value: "inactive", label: t("events.status.inactive") },
      ],
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({
      key: "status",
      value: s,
      label: `${t("events.status.label")}: ${s === "active" ? t("events.status.active") : t("events.status.inactive")}`,
    });
  }

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EventCategoryFormData>({
    resolver: zodResolver(eventCategorySchema),
    defaultValues: {
      name: { ...emptyLang },
      description: { ...emptyLang },
      display_order: 0,
      is_active: true,
    },
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    reset({
      name: { ...emptyLang },
      description: { ...emptyLang },
      display_order: 0,
      is_active: true,
    });
    open();
  };

  const handleOpenEdit = (cat: EventCategory) => {
    setEditingId(cat.id);
    reset({
      name: cat.name || { ...emptyLang },
      description: cat.description || { ...emptyLang },
      display_order: cat.display_order,
      is_active: cat.is_active,
    });
    open();
  };

  const onSubmit = async (data: EventCategoryFormData) => {
    setIsSaving(true);
    try {
      if (editingId) {
        await eventCategoryAdminService.update(
          editingId,
          data as unknown as Record<string, unknown>,
        );
        toast.success(t("common.success"));
      } else {
        await eventCategoryAdminService.create(
          data as unknown as Record<string, unknown>,
        );
        toast.success(t("common.success"));
      }
      close();
      listQuery.refetch();
    } catch (err: unknown) {
      handleApiError(err, setError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await eventCategoryAdminService.delete(id);
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
          await eventCategoryAdminService.bulkDelete(
            selectedIds.selectedArray,
          );
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
        { header: "Name (TH)", accessor: (item) => item.name?.th || "" },
        { header: "Name (EN)", accessor: (item) => item.name?.en || "" },
        { header: "Name (DE)", accessor: (item) => item.name?.de || "" },
        { header: "Description (TH)", accessor: (item) => item.description?.th || "" },
        { header: "Description (EN)", accessor: (item) => item.description?.en || "" },
        { header: "Description (DE)", accessor: (item) => item.description?.de || "" },
        { header: "Display Order", accessor: (item) => item.display_order || 0 },
        { header: "Status", accessor: (item) => (item.is_active ? "Active" : "Inactive") },
      ],
      "event_categories_export"
    );
  };

  const columns: Column<EventCategory>[] = [
    {
      header: `${t("events.categoryName")} (TH)`,
      accessorKey: "name",
      cell: (v) => (v as EventCategory["name"])?.th || "-",
      sortable: true,
    },
    {
      header: `${t("events.categoryName")} (EN)`,
      accessorKey: "name",
      cell: (v) => (v as EventCategory["name"])?.en || "-",
    },
    {
      header: `${t("events.categoryName")} (DE)`,
      accessorKey: "name",
      cell: (v) => (v as EventCategory["name"])?.de || "-",
    },
    {
      header: t("events.categoryDescription"),
      accessorKey: "description",
      cell: (v) => (v as EventCategory["description"])?.th || (v as EventCategory["description"])?.en || "-",
    },
    { header: t("common.order"), accessorKey: "display_order", sortable: true },
    {
      header: t("events.status.label"),
      accessorKey: "is_active",
      cell: (v) => <StatusBadge label={v ? t("events.status.active") : t("events.status.inactive")} />,
    },
    {
      header: t("common.actions"),
      cell: (_, row) => (
        <div className="flex gap-1.5">
          <PermissionGuard resource="events" action="update">
            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded hover:bg-admin-surface-muted text-admin-muted hover:text-admin-foreground transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <Icons.Edit size={16} />
            </button>
          </PermissionGuard>
          <PermissionGuard resource="events" action="delete">
            <button
              type="button"
              onClick={() => handleDelete(row.id)}
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
    <div className="space-y-6">
      <AdminPageHeader
        title={t("events.categoryList")}
        breadcrumbs={[
          { label: t("events.title"), href: "/admin/events" },
          { label: t("events.categoryList") },
        ]}
        actions={
          <PermissionButton
            resource="events"
            action="create"
            icon={<Icons.Plus size={14} />}
            onClick={handleOpenCreate}
          >
            {t("events.addCategory")}
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
          <AdminMultiSelectFilter
            label={t("events.status.label")}
            options={filterDefinitions[0].options || []}
            values={listState.params.filters.status || []}
            onChange={(val) => listState.actions.setFilter("status", val)}
          />
        }
        activeFilters={
          <div className="flex items-center justify-between">
            <AdminActiveFilterChips
              filters={activeChips}
              onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof EventCategoryFilters, val)}
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
        sorting={{ key: listState.params.sort || "display_order", order: listState.params.order }}
        isLoading={listQuery.isLoading}
        onPageChange={listState.actions.setPage}
        onLimitChange={listState.actions.setLimit}
        onSort={(field) => listState.actions.setSort(field)}
        selectable={true}
        selectedIds={selectedIds.selectedIds as Set<string | number>}
        onSelect={(id) => selectedIds.toggleSelection(id)}
        onSelectAll={(ids) => selectedIds.selectAll(ids)}
      />

      <FormModal
        isOpen={isOpen}
        onClose={close}
        onSubmit={handleSubmit(onSubmit)}
        title={editingId ? t("events.editCategory") : t("events.addCategory")}
        isLoading={isSaving}
      >
        <div className="space-y-4">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <MultiLangInput
                label={`${t("events.categoryName")} *`}
                value={field.value as MultiLangText}
                onChange={field.onChange}
                error={
                  errors.name?.th?.message ||
                  errors.name?.en?.message ||
                  errors.name?.de?.message ||
                  (errors.name as unknown as { message: string })?.message
                }
              />
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <MultiLangInput
                label={t("events.categoryDescription")}
                type="textarea"
                value={(field.value || { ...emptyLang }) as MultiLangText}
                onChange={field.onChange}
                error={
                  errors.description?.th?.message ||
                  errors.description?.en?.message ||
                  errors.description?.de?.message ||
                  (errors.description as unknown as { message: string })
                    ?.message
                }
              />
            )}
          />
          <Input
            id="display_order"
            label={t("common.order")}
            type="number"
            {...register("display_order", { valueAsNumber: true })}
            error={errors.display_order?.message}
          />
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Switch
                label={t("events.status.active")}
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>
      </FormModal>

      <ConfirmDialog />
    </div>
  );
}
