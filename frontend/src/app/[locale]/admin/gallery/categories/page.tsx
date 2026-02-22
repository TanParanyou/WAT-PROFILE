"use client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { FormModal, useModal, useConfirm } from "@/components/ui/Modal";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { galleryCategoryAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import { ToastContainer } from "@/components/admin/Toast";
import type { MultiLangText } from "@/types/api";
import type { GalleryCategory } from "@/types/entities";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  galleryCategorySchema,
  type GalleryCategoryFormData,
} from "@/schemas/gallery.schema";

const emptyLang: MultiLangText = { th: "", en: "", de: "" };

export default function GalleryCategoriesPage() {
  const t = useTranslations("Admin");
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen, open, close } = useModal();
  const { ConfirmDialog } = useConfirm();
  const { toasts, toast, removeToast } = useToast();
  const { handleApiError } = useApiError();

  const [editingCategory, setEditingCategory] =
    useState<GalleryCategory | null>(null);

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
      cell: (v) => v?.th || "-",
      sortable: true,
    },
    { header: "ชื่อ (EN)", accessorKey: "name", cell: (v) => v?.en || "-" },
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
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            >
              <Pencil size={16} />
            </button>
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

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        hidePagination={true}
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
              <Checkbox
                label="เปิดใช้งาน"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>
      </FormModal>

      <ConfirmDialog />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
