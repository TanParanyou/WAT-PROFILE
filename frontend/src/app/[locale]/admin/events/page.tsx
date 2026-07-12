"use client";

import React, { useState } from "react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/components/ui/Modal";
import { useDataTable } from "@/hooks/useDataTable";
import { Button } from "@/components/ui/Button";
import { eventAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Event } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";
import { Drawer } from "@/components/ui/Drawer";
import { IframePreview } from "@/components/ui/IframePreview";
import { Icons } from "@/components/ui/Icons";

export default function EventsListPage() {
  const t = useTranslations("Admin");
  const { data, pagination, sort, isLoading, onPageChange, onSort, fetchData } =
    useDataTable<Event>({
      fetcher: (p) =>
        eventAdminService.getAll({ page: p.page, limit: p.limit }),
    });
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const selectedIds = useRowSelection();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
    });
    if (ok) {
      try {
        await eventAdminService.delete(id);
        toast.success(t("common.success"));
        selectedIds.clearSelection();
        fetchData();
      } catch {
        toast.error(t("common.error"));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.selectedCount === 0) return;
    const ok = await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
    });
    if (ok) {
      try {
        await eventAdminService.bulkDelete(selectedIds.selectedArray);
        toast.success(t("common.success"));
        selectedIds.clearSelection();
        fetchData();
      } catch {
        toast.error(t("common.error"));
      }
    }
  };

  const handleExportCsv = () => {
    const exportData = data.map((event) => ({
      id: event.id,
      "title.th": event.title?.th || "",
      "title.en": event.title?.en || "",
      event_type: event.event_type || "",
      event_date: event.event_date
        ? new Date(event.event_date).toLocaleDateString("th-TH")
        : "",
      is_active: event.is_active ? "Active" : "Inactive",
    }));

    exportToCsv("events_export", exportData, [
      { label: "ID", key: "id" },
      { label: "Title (TH)", key: "title.th" },
      { label: "Title (EN)", key: "title.en" },
      { label: "Type", key: "event_type" },
      { label: "Date", key: "event_date" },
      { label: "Status", key: "is_active" },
    ]);
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
      accessorKey: "event_date",
      cell: (v) =>
        v ? new Date(v as string).toLocaleDateString("th-TH") : "-",
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
            onClick={() => setPreviewUrl(`/events/${row.id}`)}
            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 transition-colors"
            title={t("website.viewPublic")}
          >
            <Icons.View size={16} />
          </button>
          <PermissionGuard resource="events" action="update">
            <Link
              href={`/admin/events/${row.id}`}
              className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 transition-colors"
            >
              <Icons.Edit size={16} />
            </Link>
          </PermissionGuard>
          <PermissionGuard resource="events" action="delete">
            <button
              type="button"
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors"
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
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportCsv}
              icon={<Icons.Download size={14} />}
              className="shadow-sm"
            >
              {t("common.exportCsv")}
            </Button>
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
            {t("common.delete")}
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
      <ConfirmDialog />

      {/* Drawer Preview */}
      <Drawer
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title={t("website.viewPublic")}
        size="xl"
      >
        {previewUrl && <IframePreview url={previewUrl} title="Event Public Preview" />}
      </Drawer>
    </div>
  );
}
