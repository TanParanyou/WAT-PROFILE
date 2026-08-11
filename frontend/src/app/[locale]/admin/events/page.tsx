"use client";

import React, { useMemo, useState } from "react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { format, startOfMonth } from "date-fns";
import { de, enUS, th } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
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
import type { AdminFilterRecord, AdminFilterDefinition, AdminListParams, AdminListResult } from "@/features/admin-list/types";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminDateRangeFilter } from "@/components/admin/list/AdminDateRangeFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { AdminListExportButton } from "@/components/admin/list/AdminListExportButton";
import { exportToCsv } from "@/services/adminListExportService";
import { usePermission } from "@/hooks/usePermission";
import { CalendarViewToggle } from "@/features/calendar/CalendarViewToggle";
import { buildCalendarDays, getMonthGridRange } from "@/features/calendar/calendar-domain";
import type { CalendarLabels, CalendarView } from "@/features/calendar/calendar-copy";
import { AdminEventsCalendar, toAdminCalendarEvent } from "./_components/AdminEventsCalendar";

interface EventFilters extends AdminFilterRecord {
  status: string[];
  type: string[];
  from?: string;
  to?: string;
}

export default function EventsListPage() {
  const locale = useLocale();
  const t = useTranslations("Admin");
  const { formatDateRange } = useDateFormat();
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const selectedIds = useRowSelection();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>("list");
  const [month, setMonth] = useState(() => startOfMonth(toZonedTime(new Date(), "Europe/Berlin")));
  const [selectedDate, setSelectedDate] = useState(() => format(toZonedTime(new Date(), "Europe/Berlin"), "yyyy-MM-dd"));
  const { can } = usePermission();
  const canUpdate = can("events", "update");

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

  const weekStartsOn: 0 | 1 = locale === "th" ? 0 : 1;
  const visibleRange = useMemo(
    () => getMonthGridRange(month, weekStartsOn),
    [month, weekStartsOn],
  );
  const calendarFrom = listState.params.filters.from && listState.params.filters.from > visibleRange.startDate
    ? listState.params.filters.from
    : visibleRange.startDate;
  const calendarTo = listState.params.filters.to && listState.params.filters.to < visibleRange.endDate
    ? listState.params.filters.to
    : visibleRange.endDate;
  const calendarRangeIsValid = calendarFrom <= calendarTo;
  const calendarParams = useMemo<AdminListParams<EventFilters>>(
    () => ({
      ...listState.params,
      page: 1,
      limit: 100,
      filters: { ...listState.params.filters, from: calendarFrom, to: calendarTo },
    }),
    [calendarFrom, calendarTo, listState.params],
  );
  const calendarQuery = useAdminListQuery<Event, EventFilters>({
    queryKey: ["admin", "events", "calendar"],
    params: calendarParams,
    fetcher: (params) => {
      if (!calendarRangeIsValid) {
        return Promise.resolve<AdminListResult<Event>>({
          data: [],
          pagination: { page: 1, limit: 100, total: 0, totalPages: 0 },
        });
      }
      return eventAdminService.getPaginated(params);
    },
    setPage: () => undefined,
  });

  const calendarEvents = useMemo(
    () => calendarQuery.rows.map((event) => toAdminCalendarEvent(event, canUpdate, locale)),
    [calendarQuery.rows, canUpdate, locale],
  );
  const calendarDays = useMemo(
    () => buildCalendarDays(calendarEvents, visibleRange),
    [calendarEvents, visibleRange],
  );
  const dateFnsLocale = locale === "th" ? th : locale === "de" ? de : enUS;
  const calendarLabels: CalendarLabels = {
    previousMonth: t("events.previousMonth"),
    nextMonth: t("events.nextMonth"),
    today: t("events.today"),
    moreEvents: (count) => t("events.moreEvents", { count }),
    eventsCount: (count) => t("events.eventsCount", { count }),
    noEventsOnDate: t("events.noEventsOnDate"),
    calendarInstructions: t("events.calendarInstructions"),
    dayNames: [
      t("events.dayNames.sunday"),
      t("events.dayNames.monday"),
      t("events.dayNames.tuesday"),
      t("events.dayNames.wednesday"),
      t("events.dayNames.thursday"),
      t("events.dayNames.friday"),
      t("events.dayNames.saturday"),
    ],
  };
  const handleMonthChange = (nextMonth: Date) => {
    const normalizedMonth = startOfMonth(nextMonth);
    setMonth(normalizedMonth);
    setSelectedDate(format(normalizedMonth, "yyyy-MM-dd"));
  };
  const monthLabel = format(month, "LLLL yyyy", { locale: dateFnsLocale });

  const filterDefinitions: AdminFilterDefinition<EventFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: "สถานะ",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
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
          <div className="flex flex-wrap items-center gap-3">
            <CalendarViewToggle
              ariaLabel={t("events.viewLabel")}
              labels={{ calendar: t("events.calendarView"), list: t("events.listView") }}
              onChange={setView}
              value={view}
              variant="admin"
            />
            <PermissionButton
              resource="events"
              action="create"
              icon={<Icons.Plus size={14} />}
            >
              <Link href="/admin/events/create">{t("events.create")}</Link>
            </PermissionButton>
          </div>
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

      {view === "list" ? (
        <>
          <BulkActionToolbar
            selectedCount={selectedIds.selectedCount}
            onClear={selectedIds.clearSelection}
          >
            <PermissionGuard resource="events" action="delete">
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 rounded-none bg-admin-danger px-3 py-1.5 text-sm font-medium text-admin-on-action transition-colors hover:brightness-90 focus-visible:outline-2 focus-visible:outline-admin-focus"
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
        </>
      ) : calendarQuery.isLoading ? (
        <div className="h-[34rem] animate-pulse bg-admin-surface-muted" role="status">{t("common.loading")}</div>
      ) : calendarQuery.isError ? (
        <div className="border border-admin-danger bg-admin-danger-surface p-6 text-admin-danger" role="alert">{t("common.error")}</div>
      ) : calendarEvents.length === 0 ? (
        <div className="border border-admin-border bg-admin-surface p-6 text-admin-muted">{t("common.noData")}</div>
      ) : (
        <AdminEventsCalendar
          canUpdate={canUpdate}
          days={calendarDays}
          events={calendarQuery.rows}
          isLoading={calendarQuery.isFetching}
          labels={calendarLabels}
          locale={locale}
          month={month}
          monthLabel={monthLabel}
          onMonthChange={handleMonthChange}
          onSelectedDateChange={setSelectedDate}
          selectedDate={selectedDate}
          weekStartsOn={weekStartsOn}
        />
      )}
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
