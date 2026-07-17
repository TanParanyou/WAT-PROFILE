"use client";

import React, { useState, useEffect } from "react";
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
import { exportToCsv } from "@/utils/exportToCsv";

const emptyLang: MultiLangText = { th: "", en: "", de: "" };

export default function GalleryCategoriesPage() {
  const t = useTranslations("Admin");
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen, open, close } = useModal();
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const selectedIds = useRowSelection();

  const [editingCategory, setEditingCategory] =
    useState<GalleryCategory | null>(null);

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
          loadCategories();
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
          loadCategories();
        } catch (err) {
          toast.error(t("common.error"));

          throw err;
        }
      },
    });
  };

  const handleExportCsv = () => {
    const exportData = categories.map((cat) => ({
      id: cat.id,
      "name.th": cat.name?.th || "",
      "name.en": cat.name?.en || "",
      slug: cat.slug || "",
      display_order: cat.display_order || 0,
      is_active: cat.is_active ? "Active" : "Inactive",
    }));

    exportToCsv("gallery_categories_export", exportData, [
      { label: "ID", key: "id" },
      { label: "Name (TH)", key: "name.th" },
      { label: "Name (EN)", key: "name.en" },
      { label: "Slug", key: "slug" },
      { label: "Display Order", key: "display_order" },
      { label: "Status", key: "is_active" },
    ]);
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

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const result = await galleryCategoryAdminService.getAll();
      setCategories(result.data);
    } catch (err: unknown) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      loadCategories();
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

      <div className="flex justify-between items-center mb-4 mt-4">
        <div />
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
        >
          Export CSV
        </button>
      </div>

      <BulkActionToolbar
        selectedCount={selectedIds.selectedCount}
        onClear={selectedIds.clearSelection}
      >
        <PermissionGuard resource="gallery" action="delete">
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            {t("common.delete")}
          </button>
        </PermissionGuard>
      </BulkActionToolbar>

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        hidePagination={true}
        selectable={true}
        selectedIds={selectedIds.selectedIds as Set<string | number>}
        onSelect={(id) => selectedIds.toggleSelection(id)}
        onSelectAll={(ids) => selectedIds.selectAll(ids)}
      />

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
