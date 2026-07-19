"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { DataTable, Column } from "@/components/ui/DataTable";
import { FormModal, useModal } from "@/components/ui/Modal";
import { useConfirm } from "@/hooks/useConfirm";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TimePicker } from "@/components/ui/TimePicker";
import { Switch } from "@/components/ui/Switch";
import { useDataTable } from "@/hooks/useDataTable";
import { scheduleAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Schedule } from "@/types/entities";
import type { MultiLangText } from "@/types/api";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";
import {
  scheduleSchema,
  type ScheduleFormData,
  defaultScheduleValues,
} from "@/schemas/schedule.schema";

import { useAppOptions } from "@/hooks/useAppOptions";
import { Icons } from "@/components/ui/Icons";

const emptyLang: MultiLangText = { th: "", en: "", de: "" };

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

  const { data, pagination, sort, onPageChange, onSort, isLoading, fetchData } =
    useDataTable<Schedule>({
      queryKey: "schedules",
      fetcher: (p) =>
        scheduleAdminService.getAll({ page: p.page, limit: p.limit }),
    });

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
      time_start: schedule.time_start || "",
      time_end: schedule.time_end || "",
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
      fetchData();
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
          fetchData();
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
          fetchData();
        } catch (err) {
          toast.error(t("common.error"));

          throw err;
        }
      },
    });
  };

  const handleExportCsv = () => {
    const exportData = data.map((item) => ({
      id: item.id,
      schedule_type: item.schedule_type || "",
      day_of_week:
        item.day_of_week !== null ? getDayLabel(item.day_of_week) : "",
      time_start: item.time_start || "",
      time_end: item.time_end || "",
      "activity.th": item.activity?.th || "",
      "activity.en": item.activity?.en || "",
      is_active: item.is_active ? "Active" : "Inactive",
    }));

    exportToCsv("schedules_export", exportData, [
      { label: "ID", key: "id" },
      { label: "Type", key: "schedule_type" },
      { label: "Day", key: "day_of_week" },
      { label: "Start Time", key: "time_start" },
      { label: "End Time", key: "time_end" },
      { label: "Activity (TH)", key: "activity.th" },
      { label: "Activity (EN)", key: "activity.en" },
      { label: "Status", key: "is_active" },
    ]);
  };

  const columns: Column<Schedule>[] = [
    {
      header: t("schedules.type"),
      accessorKey: "schedule_type",
      sortable: true,
      cell: (v) => getTypeLabel(v),
    },
    {
      header: t("schedules.day"),
      accessorKey: "day_of_week",
      cell: (v) => getDayLabel(v as number | null),
    },
    {
      header: t("schedules.time"),
      cell: (_, row) =>
        row.time_start && row.time_end
          ? `${row.time_start} - ${row.time_end}`
          : row.time_start || row.time_end || "-",
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
      cell: (v) => <StatusBadge label={v ? "Active" : "Inactive"} />,
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => (
        <div className="flex gap-1.5">
          <PermissionGuard resource="schedules" action="update">
            <button
              type="button"
              onClick={() => handleEdit(row)}
              className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 transition-colors"
            >
              <Icons.Edit size={16} />
            </button>
          </PermissionGuard>
          <PermissionGuard resource="schedules" action="delete">
            <button
              type="button"
              onClick={() => handleDelete(row)}
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
        title={t("schedules.title")}
        breadcrumbs={[{ label: t("schedules.title") }]}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={handleExportCsv}
              variant="outline"
              icon={<Icons.Download size={14} />}
              className="shadow-sm"
            >
              {t("common.exportCsv")}
            </Button>
            <PermissionButton
              resource="schedules"
              action="create"
              icon={<Icons.Plus size={14} />}
              onClick={handleCreate}
            >
              {t("schedules.create")}
            </PermissionButton>
          </div>
        }
      />

      <BulkActionToolbar
        selectedCount={selectedIds.selectedCount}
        onClear={selectedIds.clearSelection}
      >
        <PermissionGuard resource="schedules" action="delete">
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors text-sm font-medium"
          >
            <Icons.Delete size={16} />
            {t("common.bulkDelete")}
          </button>
        </PermissionGuard>
      </BulkActionToolbar>

      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        sorting={sort}
        isLoading={isLoading}
        onPageChange={onPageChange}
        onSort={onSort}
        selectable={true}
        selectedIds={selectedIds.selectedIds as Set<string | number>}
        onSelect={(id) => selectedIds.toggleSelection(id)}
        onSelectAll={(ids) => selectedIds.selectAll(ids)}
      />

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
