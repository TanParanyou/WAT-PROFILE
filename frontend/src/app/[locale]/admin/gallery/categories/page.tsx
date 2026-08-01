"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/Button";
import { galleryCategoryAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import type { MultiLangText } from "@/types/api";
import type { GalleryCategory } from "@/types/entities";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  galleryCategorySchema,
  type GalleryCategoryFormData,
} from "@/schemas/gallery.schema";
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

const emptyLang: MultiLangText = { th: "", en: "", de: "" };

interface GalleryCategoryFilters extends AdminFilterRecord {
  status: string[];
}

export default function GalleryCategoriesPage() {
  const t = useTranslations("Admin");
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen, open, close } = useModal();
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const selectedIds = useRowSelection();

  const [editingCategory, setEditingCategory] =
    useState<GalleryCategory | null>(null);

  const listState = useAdminListState<GalleryCategoryFilters>({
    schema: {
      defaultSort: "id",
      defaultOrder: "asc",
      multi: ["status"],
      allowedSorts: ["id", "name", "slug", "display_order", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<GalleryCategory, GalleryCategoryFilters>({
    queryKey: ["admin", "gallery-categories"],
    params: listState.params,
    fetcher: (params) => galleryCategoryAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const filterDefinitions: AdminFilterDefinition<GalleryCategoryFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: "สถานะ",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
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
          await galleryCategoryAdminService.delete(id);
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
          await galleryCategoryAdminService.bulkDelete(
            selectedIds.selectedArray,
          );
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
        { header: "Slug", accessor: (item) => item.slug || "" },
        { header: "Display Order", accessor: (item) => item.display_order || 0 },
        { header: "Status", accessor: (item) => (item.is_active ? "Active" : "Inactive") },
      ],
      "gallery_categories_export"
    );
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<GalleryCategoryFormData>({
    resolver: zodResolver(galleryCategorySchema),
    defaultValues: {
      name: { ...emptyLang },
      slug: "",
      display_order: 0,
      is_active: true,
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    reset({
      name: { ...emptyLang },
      slug: "",
      display_order: 0,
      is_active: true,
    });
    open();
  };

  const handleOpenEdit = (category: GalleryCategory) => {
    setEditingCategory(category);
    reset({
      name: category.name || { ...emptyLang },
      slug: category.slug,
      display_order: category.display_order,
      is_active: category.is_active,
    });
    open();
  };

  const onSubmit = async (data: GalleryCategoryFormData) => {
    setIsSaving(true);
    try {
      if (editingCategory) {
        await galleryCategoryAdminService.update(
          editingCategory.id,
          data as unknown as Record<string, unknown>,
        );
        toast.success(t("common.success"));
      } else {
        await galleryCategoryAdminService.create(
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

  const columns: Column<GalleryCategory>[] = [
    {
      header: "ชื่อ (TH)",
      accessorKey: "name",
      cell: (v) => (v as GalleryCategory["name"])?.th || "-",
      sortable: true,
    },
    {
      header: "ชื่อ (EN)",
      accessorKey: "name",
      cell: (v) => (v as GalleryCategory["name"])?.en || "-",
    },
    { header: "Slug", accessorKey: "slug", sortable: true },
    { header: "ลำดับ", accessorKey: "display_order", sortable: true },
    {
      header: "สถานะ",
      accessorKey: "is_active",
      cell: (v) => <StatusBadge label={v ? "Active" : "Inactive"} />,
    },
    {
      header: "จัดการ",
      cell: (_, row) => (
        <div className="flex gap-2">
          <PermissionGuard resource="gallery" action="update">
            <Button
              onClick={() => handleOpenEdit(row)}
              variant="ghost"
              size="icon"
            >
              <Pencil size={16} />
            </Button>
          </PermissionGuard>
          <PermissionGuard resource="gallery" action="delete">
            <Button
              onClick={() => handleDelete(row.id)}
              variant="danger"
              size="icon"
            >
              <Trash2 size={16} />
            </Button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="จัดการหมวดหมู่คลังภาพ"
        breadcrumbs={[
          { label: "คลังภาพ", href: "/admin/gallery" },
          { label: "หมวดหมู่" },
        ]}
        actions={
          <PermissionButton
            resource="gallery"
            action="create"
            icon={<Plus size={16} />}
            onClick={handleOpenCreate}
          >
            เพิ่มหมวดหมู่
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
                onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof GalleryCategoryFilters, val)}
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
        <PermissionGuard resource="gallery" action="delete">
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-admin-danger hover:brightness-90 text-admin-on-action rounded-none transition-colors text-sm font-medium focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            <Trash2 size={16} />
            {t("common.delete")}
          </button>
        </PermissionGuard>
      </BulkActionToolbar>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={listQuery.rows}
          pagination={listQuery.pagination}
          sorting={{ key: listState.params.sort || "id", order: listState.params.order }}
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
        onSubmit={handleSubmit(onSubmit)}
        title={editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
        isLoading={isSaving}
      >
        <div className="space-y-4">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <MultiLangInput
                label="ชื่อหมวดหมู่ *"
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
          <Input
            id="slug"
            label="Slug *"
            {...register("slug")}
            error={errors.slug?.message}
          />
          <Input
            id="display_order"
            label="ลำดับการแสดง"
            type="number"
            {...register("display_order", { valueAsNumber: true })}
            error={errors.display_order?.message}
          />
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Switch
                label="เปิดใช้งาน"
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
