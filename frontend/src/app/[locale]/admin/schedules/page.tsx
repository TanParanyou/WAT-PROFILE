"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminTableAction, AdminTableActionGroup } from "@/components/admin/AdminTableAction";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { DataTable, Column } from "@/components/ui/DataTable";
import { FormModal, useModal } from "@/components/ui/Modal";
import { useConfirm } from "@/hooks/useConfirm";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TimePicker } from "@/components/ui/TimePicker";
import { Switch } from "@/components/ui/Switch";
import { scheduleAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Schedule } from "@/types/entities";
import type { MultiLangText } from "@/types/api";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import {
  scheduleSchema,
  type ScheduleFormData,
  defaultScheduleValues,
} from "@/schemas/schedule.schema";

import { useAppOptions } from "@/hooks/useAppOptions";
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
import { formatTimeRange, formatTimeToHHmm } from "@/utils/formatters";
import { emptyLang } from "@/constants";


interface ScheduleFilters extends AdminFilterRecord {
  status: string[];
  type: string[];
  weekday: string[];
}

export default function SchedulesPage() {
  const t = useTranslations("Admin");
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const { isOpen, open, close } = useModal();
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const selectedIds = useRowSelection();

  const {
    getScheduleTypeOptions,
    getDayOfWeekOptions,
    getScheduleTypeLabel,
    getDayOfWeekLabel,
  } = useAppOptions();

  const scheduleTypeOptions = getScheduleTypeOptions(true);
  const dayOfWeekOptions = getDayOfWeekOptions(true);

  const listState = useAdminListState<ScheduleFilters>({
    schema: {
      defaultSort: "start_time",
      defaultOrder: "asc",
      multi: ["status", "type", "weekday"],
      allowedSorts: ["id", "schedule_type", "day_of_week", "start_time", "activity", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<Schedule, ScheduleFilters>({
    queryKey: ["admin", "schedules"],
    params: listState.params,
    fetcher: (params) => scheduleAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const statusLabelMap: Record<string, string> = {
    active: t("schedules.status.active"),
    inactive: t("schedules.status.inactive"),
  };

  const filterDefinitions: AdminFilterDefinition<ScheduleFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: t("schedules.filterStatus"),
      options: [
        { value: "active", label: t("schedules.status.active") },
        { value: "inactive", label: t("schedules.status.inactive") },
      ],
    },
    {
      key: "type",
      kind: "multi",
      label: t("schedules.filterType"),
      options: scheduleTypeOptions,
    },
    {
      key: "weekday",
      kind: "multi",
      label: t("schedules.filterWeekday"),
      options: dayOfWeekOptions,
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
      label: t("common.filter.typeWithVal", { value: getScheduleTypeLabel(tp) || tp }),
    });
  }
  for (const wd of listState.params.filters.weekday || []) {
    const dayLabel = getDayOfWeekLabel(Number(wd));
    activeChips.push({
      key: "weekday",
      value: wd,
      label: `${t("schedules.filterWeekday")}: ${dayLabel}`,
    });
  }

  const {
    control,
    register,
    handleSubmit: rhfHandleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: defaultScheduleValues,
  });

  const scheduleType = watch("schedule_type");

  const getTypeLabel = (type: string) => getScheduleTypeLabel(type);
  const getDayLabel = (day: number | null) => getDayOfWeekLabel(day);

  const handleCreate = () => {
    setEditingSchedule(null);
    reset(defaultScheduleValues);
    open();
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    reset({
      schedule_type: schedule.schedule_type,
      day_of_week: schedule.day_of_week,
      time_start: formatTimeToHHmm(schedule.time_start),
      time_end: formatTimeToHHmm(schedule.time_end),
      activity: schedule.activity || { ...emptyLang },
      location: schedule.location || { ...emptyLang },
      online_link: schedule.online_link || "",
      is_active: schedule.is_active,
      display_order: schedule.display_order,
    });
    open();
  };

  const onSubmit = async (formData: ScheduleFormData) => {
    setIsSaving(true);
    try {
      const submitData = {
        ...formData,
        time_start: formData.time_start || null,
        time_end: formData.time_end || null,
        day_of_week:
          formData.schedule_type === "weekly" ? formData.day_of_week : null,
      };
      if (editingSchedule) {
        await scheduleAdminService.update(
          editingSchedule.id,
          submitData as unknown as Record<string, unknown>,
        );
        toast.success(t("common.success"));
      } else {
        await scheduleAdminService.create(
          submitData as unknown as Record<string, unknown>,
        );
        toast.success(t("common.success"));
      }
      close();
      listQuery.refetch();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (schedule: Schedule) => {
    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await scheduleAdminService.delete(schedule.id);
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
          await scheduleAdminService.bulkDelete(selectedIds.selectedArray);
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
        { header: t("schedules.csvId"), accessor: (item) => item.id },
        { header: t("schedules.csvType"), accessor: (item) => item.schedule_type || "" },
        {
          header: t("schedules.csvDay"),
          accessor: (item) => (item.day_of_week !== null ? getDayLabel(item.day_of_week) : ""),
        },
        { header: t("schedules.csvStartTime"), accessor: (item) => formatTimeToHHmm(item.time_start) },
        { header: t("schedules.csvEndTime"), accessor: (item) => formatTimeToHHmm(item.time_end) },
        { header: t("schedules.csvActivityTh"), accessor: (item) => item.activity?.th || "" },
        { header: t("schedules.csvActivityEn"), accessor: (item) => item.activity?.en || "" },
        { header: t("schedules.csvStatus"), accessor: (item) => (item.is_active ? t("schedules.status.active") : t("schedules.status.inactive")) },
      ],
      "schedules_export"
    );
  };

  const columns: Column<Schedule>[] = [
    {
      header: t("schedules.type"),
      accessorKey: "schedule_type",
      sortable: true,
      cell: (v) => getTypeLabel(v as string),
    },
    {
      header: t("schedules.day"),
      accessorKey: "day_of_week",
      cell: (v) => getDayLabel(v as number | null),
    },
    {
      header: t("schedules.time"),
      cell: (_, row) => formatTimeRange(row.time_start, row.time_end),
    },
    {
      header: t("schedules.activity"),
      accessorKey: "activity",
      sortable: true,
      cell: (v) => (v as Schedule["activity"])?.th || "-",
    },
    {
      header: t("columns.status"),
      accessorKey: "is_active",
      cell: (v) => <StatusBadge label={v ? t("schedules.status.active") : t("schedules.status.inactive")} />,
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => (
        <AdminTableActionGroup>
          <AdminTableAction
            resource="schedules"
            action="update"
            label={t("common.edit")}
            icon={<Icons.Edit size={16} />}
            onClick={() => handleEdit(row)}
          />
          <AdminTableAction
            resource="schedules"
            action="delete"
            variant="danger"
            label={t("common.delete")}
            icon={<Icons.Delete size={16} />}
            onClick={() => handleDelete(row)}
          />
        </AdminTableActionGroup>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("schedules.title")}
        breadcrumbs={[{ label: t("schedules.title") }]}
        actions={
          <PermissionButton
            resource="schedules"
            action="create"
            icon={<Icons.Plus size={14} />}
            onClick={handleCreate}
          >
            {t("schedules.create")}
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
                label={filterDefinitions[0].label}
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.status || []}
                onChange={(val) => listState.actions.setFilter("status", val)}
              />
              <AdminMultiSelectFilter
                label={filterDefinitions[1].label}
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
                onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof ScheduleFilters, val)}
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
          <AdminMultiSelectFilter
            label={filterDefinitions[2].label}
            options={filterDefinitions[2].options || []}
            values={listState.params.filters.weekday || []}
            onChange={(val) => listState.actions.setFilter("weekday", val)}
          />
        </AdminListToolbar>
      </div>

      <BulkActionToolbar
        selectedCount={selectedIds.selectedCount}
        onClear={selectedIds.clearSelection}
      >
        <PermissionGuard resource="schedules" action="delete">
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
          sorting={{ key: listState.params.sort || "start_time", order: listState.params.order }}
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

      <FormModal
        isOpen={isOpen}
        onClose={close}
        onSubmit={rhfHandleSubmit(onSubmit)}
        title={editingSchedule ? t("schedules.edit") : t("schedules.create")}
        isLoading={isSaving}
      >
        <div className="space-y-4">
          <Controller
            control={control}
            name="schedule_type"
            render={({ field }) => (
              <Select
                id="schedule_type"
                label={t("schedules.type")}
                options={scheduleTypeOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                error={errors.schedule_type?.message}
                required
              />
            )}
          />
          {scheduleType === "weekly" && (
            <Controller
              control={control}
              name="day_of_week"
              render={({ field }) => (
                <Select
                  id="day_of_week"
                  label={t("schedules.day")}
                  options={dayOfWeekOptions}
                  value={field.value !== null ? String(field.value) : ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  error={errors.day_of_week?.message}
                  required
                />
              )}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="time_start"
              render={({ field }) => (
                <TimePicker
                  id="time_start"
                  label={t("schedules.timeStart")}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.time_start?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="time_end"
              render={({ field }) => (
                <TimePicker
                  id="time_end"
                  label={t("schedules.timeEnd")}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.time_end?.message}
                />
              )}
            />
          </div>
          <Controller
            control={control}
            name="activity"
            render={({ field }) => (
              <MultiLangInput
                label={t("schedules.activity")}
                value={field.value as MultiLangText}
                onChange={field.onChange}
                error={
                  errors.activity?.th?.message ||
                  (errors.activity as unknown as { message: string })?.message
                }
                required
              />
            )}
          />
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <MultiLangInput
                label={t("schedules.location")}
                value={(field.value || { ...emptyLang }) as MultiLangText}
                onChange={field.onChange}
                error={
                  errors.location?.th?.message ||
                  (errors.location as unknown as { message: string })?.message
                }
              />
            )}
          />
          <Input
            id="online_link"
            label={t("schedules.onlineLink")}
            {...register("online_link")}
            error={errors.online_link?.message}
          />
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Switch
                label={t("form.active")}
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
