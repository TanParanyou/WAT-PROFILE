"use client";

import React, { useState } from "react";
import { MapPin } from "lucide-react";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminTableAction, AdminTableActionGroup } from "@/components/admin/AdminTableAction";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/hooks/useConfirm";
import { eventAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Event } from "@/types/entities";
import type { MultiLangText } from "@/types/api";
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
import { PublicLightboxModal, type LightboxSlide } from "@/components/public/modal";

interface EventFilters extends AdminFilterRecord {
  status: string[];
  type: string[];
  from?: string;
  to?: string;
}

export default function EventsListPage() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const { formatDateRange, formatTimeRange } = useDateFormat();
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
      label: t("events.status.label"),
      options: [
        { value: "active", label: t("events.status.active") },
        { value: "inactive", label: t("events.status.inactive") },
      ],
    },
    {
      key: "type",
      kind: "multi",
      label: t("events.form.type") || t("columns.category"),
      options: [
        { value: "ceremony", label: t("events.types.ceremony") },
        { value: "merit", label: t("events.types.merit") },
        { value: "meditation", label: t("events.types.meditation") },
        { value: "general", label: t("events.types.general") },
      ],
    },
  ];

  const typeLabelMap: Record<string, string> = {
    ceremony: t("events.types.ceremony"),
    merit: t("events.types.merit"),
    meditation: t("events.types.meditation"),
    general: t("events.types.general"),
  };

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({
      key: "status",
      value: s,
      label: `${t("events.status.label")}: ${s === "active" ? t("events.status.active") : t("events.status.inactive")}`,
    });
  }
  for (const tp of listState.params.filters.type || []) {
    activeChips.push({
      key: "type",
      value: tp,
      label: `${t("events.form.type")}: ${typeLabelMap[tp] || tp}`,
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

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxSlides, setLightboxSlides] = useState<LightboxSlide[]>([]);

  const handleOpenLightbox = (eventItem: Event) => {
    const slides: LightboxSlide[] = [];
    const title = (eventItem.title?.[locale as "th" | "en" | "de"] || eventItem.title?.th || eventItem.title?.en || "-") as string;
    const desc = (eventItem.description?.[locale as "th" | "en" | "de"] || eventItem.description?.th || "") as string;
    const location = (eventItem.location?.[locale as "th" | "en" | "de"] || eventItem.location?.th || "") as string;

    const timeStr = formatTimeRange(eventItem.start_time, eventItem.end_time);
    const categoryTranslated = eventItem.category?.name
      ? ((eventItem.category.name as MultiLangText)?.[locale as "th" | "en" | "de"] || (eventItem.category.name as MultiLangText)?.th || (eventItem.category.name as MultiLangText)?.en || (eventItem.category.name as MultiLangText)?.de)
      : (eventItem.event_type ? (t.has(`events.types.${eventItem.event_type}`) ? t(`events.types.${eventItem.event_type}`) : eventItem.event_type) : undefined);

    const eventMeta = {
      date: formatDateRange(eventItem.start_date, eventItem.end_date),
      time: timeStr || undefined,
      location: location || undefined,
      category: categoryTranslated,
    };

    if (eventItem.image_url) {
      slides.push({
        src: eventItem.image_url,
        alt: title,
        title: title,
        description: desc || undefined,
        meta: eventMeta,
      });
    }

    if (Array.isArray(eventItem.gallery_urls)) {
      eventItem.gallery_urls.forEach((url, i) => {
        slides.push({
          src: url,
          alt: `${title} ${i + 1}`,
          title: `${title} (${i + 1}/${eventItem.gallery_urls?.length})`,
          description: desc || undefined,
          meta: eventMeta,
        });
      });
    }

    if (slides.length > 0) {
      setLightboxSlides(slides);
      setLightboxIndex(0);
    }
  };

  const columns: Column<Event>[] = [
    {
      header: t("columns.image") || "รูป",
      accessorKey: "image_url",
      cell: (v, row) => {
        const imgUrl = (v as string) || row.gallery_urls?.[0];
        const title = row.title?.[locale as "th" | "en" | "de"] || row.title?.th || "Event";
        return imgUrl ? (
          <button
            type="button"
            onClick={() => handleOpenLightbox(row)}
            className="relative h-12 w-16 overflow-hidden border border-admin-border bg-admin-surface-muted group block text-left"
            title={t("events.listBadges.viewImage") || t("events.form.previewLightbox") || "ดูรูปภาพ"}
          >
            <img
              src={imgUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Icons.View size={14} className="text-white" />
            </div>
          </button>
        ) : (
          <div className="h-12 w-16 border border-dashed border-admin-border bg-admin-surface-muted flex items-center justify-center text-admin-muted text-[10px]">
            {t("events.listBadges.noImage") || "No img"}
          </div>
        );
      },
    },
    {
      header: t("columns.name") || "ชื่อกิจกรรม",
      accessorKey: "title",
      cell: (v, row) => {
        const title = (v as Event["title"])?.[locale as "th" | "en" | "de"] || (v as Event["title"])?.th || "-";
        const location = row.location?.[locale as "th" | "en" | "de"] || row.location?.th;
        return (
          <div className="space-y-1 py-1 max-w-xs sm:max-w-md">
            <Link
              href={`/admin/events/${row.id}`}
              className="font-medium text-admin-foreground hover:text-admin-action hover:underline block leading-snug"
            >
              {title}
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-xs text-admin-muted">
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} className="shrink-0 text-admin-muted" />
                  <span>{location}</span>
                </span>
              )}
              {row.online_join_url && (
                <span className="inline-flex items-center gap-1 text-[10px] text-red-600 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.2 border border-red-200">
                  {t("events.listBadges.live") || "Live"}
                </span>
              )}
              {row.registration_enabled && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.2 border border-emerald-200">
                  {t("events.listBadges.registration") || "ลงทะเบียน"}
                </span>
              )}
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      header: t("columns.category") || "ประเภท",
      accessorKey: "event_type",
      cell: (_, row) => {
        const catName = row.category?.name
          ? ((row.category.name as MultiLangText)?.[locale as "th" | "en" | "de"] || (row.category.name as MultiLangText)?.th || (row.category.name as MultiLangText)?.en || (row.category.name as MultiLangText)?.de)
          : (row.event_type ? (t.has(`events.types.${row.event_type}`) ? t(`events.types.${row.event_type}`) : row.event_type) : "-");
        return (
          <span className="inline-block px-2 py-0.5 text-xs font-medium border border-admin-border bg-admin-surface-muted text-admin-foreground">
            {catName}
          </span>
        );
      },
      sortable: true,
    },
    {
      header: t("columns.date") || "วันที่จัดงาน",
      accessorKey: "start_date",
      cell: (_, row) => {
        const timeStr = formatTimeRange(row.start_time, row.end_time);
        return (
          <div className="text-xs space-y-0.5">
            <div className="font-medium text-admin-foreground">{formatDateRange(row.start_date, row.end_date)}</div>
            {timeStr && (
              <div className="text-admin-muted font-mono">
                {timeStr}
              </div>
            )}
          </div>
        );
      },
      sortable: true,
    },
    {
      header: t("columns.status") || "สถานะ",
      accessorKey: "publish_status",
      cell: (_, row) => {
        const status = row.publish_status || "published";
        const isActive = row.is_active;

        if (!isActive) {
          return <StatusBadge label={t("events.status.inactive")} variant="danger" />;
        }

        if (status === "scheduled") {
          return (
            <div className="space-y-0.5">
              <span className="inline-block px-2 py-0.5 text-[11px] font-medium border border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300">
                {t("events.publishStatus.scheduled")}
              </span>
              {row.scheduled_at && (
                <div className="text-[10px] text-admin-muted">
                  {formatDateRange(row.scheduled_at, row.scheduled_at)}
                </div>
              )}
            </div>
          );
        }

        if (status === "draft") {
          return (
            <span className="inline-block px-2 py-0.5 text-[11px] font-medium border border-admin-border bg-admin-surface-muted text-admin-muted">
              {t("events.publishStatus.draft")}
            </span>
          );
        }

        if (status === "archived") {
          return (
            <span className="inline-block px-2 py-0.5 text-[11px] font-medium border border-admin-border bg-admin-surface-muted text-admin-muted line-through">
              {t("events.publishStatus.archived")}
            </span>
          );
        }

        return <StatusBadge label={t("events.publishStatus.published")} variant="success" />;
      },
    },
    {
      header: t("columns.actions") || "จัดการ",
      cell: (_, row) => (
        <AdminTableActionGroup>
          <AdminTableAction
            label={t("website.viewPublic") || "ดูหน้าเว็บสาธารณะ"}
            icon={<Icons.View size={16} />}
            onClick={() => setPreviewUrl(`/${locale}/events/${row.slug || row.id}`)}
          />
          <AdminTableAction
            resource="events"
            action="update"
            label={t("common.edit") || "แก้ไข"}
            icon={<Icons.Edit size={16} />}
            href={`/admin/events/${row.id}`}
          />
          <AdminTableAction
            resource="events"
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
        title={t("events.title")}
        breadcrumbs={[{ label: t("events.title") }]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/events/categories" className="inline-flex min-h-11 items-center border border-admin-border px-4 text-sm hover:bg-admin-surface-muted focus-visible:outline-2 focus-visible:outline-admin-focus">{t("events.categories")}</Link>
            <Link href="/admin/calendar" className="inline-flex min-h-11 items-center border border-admin-border px-4 text-sm hover:bg-admin-surface-muted focus-visible:outline-2 focus-visible:outline-admin-focus">{t("events.calendarView")}</Link>
            <PermissionButton
              resource="events"
              action="create"
              href="/admin/events/create"
              icon={<Icons.Plus size={14} />}
            >
              {t("events.create")}
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
              label={t("events.status.label")}
              options={filterDefinitions[0].options || []}
              values={listState.params.filters.status || []}
              onChange={(val) => listState.actions.setFilter("status", val)}
            />
            <AdminMultiSelectFilter
              label={t("events.form.type")}
              options={filterDefinitions[1].options || []}
              values={listState.params.filters.type || []}
              onChange={(val) => listState.actions.setFilter("type", val)}
            />
          </>
        }
        activeFilters={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
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
          label={t("common.filter.eventDate")}
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

      {/* Lightbox Modal for Quick Image & Event Info Preview */}
      {lightboxIndex !== null && (
        <PublicLightboxModal
          open={lightboxIndex !== null}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          slides={lightboxSlides}
          closeLabel={t("common.close")}
        />
      )}
    </div>
  );
}
