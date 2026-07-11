"use client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { FormModal, useModal, useConfirm } from "@/components/ui/Modal";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { donationCategoryAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import type { DonationCategory } from "@/types/entities";
import type { MultiLangText } from "@/types/api";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  donationCategorySchema,
  type DonationCategoryFormData,
} from "@/schemas/donation.schema";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";

const emptyLang: MultiLangText = { th: "", en: "", de: "" };

export default function DonationCategoriesPage() {
  const t = useTranslations("Admin");
  const [categories, setCategories] = useState<DonationCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen, open, close } = useModal();
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const selectedIds = useRowSelection();

  const [editingId, setEditingId] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DonationCategoryFormData>({
    resolver: zodResolver(donationCategorySchema),
    defaultValues: {
      name: { ...emptyLang },
      description: { ...emptyLang },
      display_order: 0,
      is_active: true,
    },
  });

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const result = await donationCategoryAdminService.getAll();
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
    setEditingId(null);
    reset({
      name: { ...emptyLang },
      description: { ...emptyLang },
      display_order: 0,
      is_active: true,
    });
    open();
  };

  const handleOpenEdit = (cat: DonationCategory) => {
    setEditingId(cat.id);
    reset({
      name: cat.name || { ...emptyLang },
      description: cat.description || { ...emptyLang },
      display_order: cat.display_order,
      is_active: cat.is_active,
    });
    open();
  };

  const onSubmit = async (data: DonationCategoryFormData) => {
    setIsSaving(true);
    try {
      if (editingId) {
        await donationCategoryAdminService.update(
          editingId,
          data as unknown as Record<string, unknown>,
        );
        toast.success(t("common.success"));
      } else {
        await donationCategoryAdminService.create(
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

  const handleDelete = async (id: number) => {
    if (
      await confirm({
        title: "ลบหมวดหมู่",
        message: "ยืนยันการลบ?",
        variant: "danger",
      })
    ) {
      try {
        await donationCategoryAdminService.delete(id);
        toast.success(t("common.success"));
        selectedIds.clearSelection();
        loadCategories();
      } catch (err: unknown) {
        handleApiError(err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.selectedCount === 0) return;
    if (
      await confirm({
        title: "ลบหมวดหมู่",
        message: "ยืนยันการลบที่เลือก?",
        variant: "danger",
      })
    ) {
      try {
        await donationCategoryAdminService.bulkDelete(
          selectedIds.selectedArray,
        );
        toast.success(t("common.success"));
        selectedIds.clearSelection();
        loadCategories();
      } catch (err: unknown) {
        handleApiError(err);
      }
    }
  };

  const handleExportCsv = () => {
    const exportData = categories.map((cat) => ({
      id: cat.id,
      "name.th": cat.name?.th || "",
      "name.en": cat.name?.en || "",
      "description.th": cat.description?.th || "",
      "description.en": cat.description?.en || "",
      display_order: cat.display_order || 0,
      is_active: cat.is_active ? "Active" : "Inactive",
    }));

    exportToCsv("donation_categories_export", exportData, [
      { label: "ID", key: "id" },
      { label: "Name (TH)", key: "name.th" },
      { label: "Name (EN)", key: "name.en" },
      { label: "Description (TH)", key: "description.th" },
      { label: "Description (EN)", key: "description.en" },
      { label: "Display Order", key: "display_order" },
      { label: "Status", key: "is_active" },
    ]);
  };

  const columns: Column<DonationCategory>[] = [
    {
      header: "ชื่อ (TH)",
      accessorKey: "name",
      cell: (v) => (v as DonationCategory["name"])?.th || "-",
      sortable: true,
    },
    {
      header: "ชื่อ (EN)",
      accessorKey: "name",
      cell: (v) => (v as DonationCategory["name"])?.en || "-",
    },
    {
      header: "คำอธิบาย",
      accessorKey: "description",
      cell: (v) => (v as DonationCategory["description"])?.th || "-",
    },
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
          <PermissionGuard resource="donations" action="update">
            <Button
              onClick={() => handleOpenEdit(row)}
              variant="ghost"
              size="icon"
            >
              <Pencil size={16} />
            </Button>
          </PermissionGuard>
          <PermissionGuard resource="donations" action="delete">
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
        title="หมวดหมู่การบริจาค"
        breadcrumbs={[
          { label: "รายการบริจาค", href: "/admin/donations" },
          { label: "หมวดหมู่" },
        ]}
        actions={
          <PermissionButton
            resource="donations"
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
        <PermissionGuard resource="donations" action="delete">
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
        title={editingId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
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
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <MultiLangInput
                label="คำอธิบาย"
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
            label="ลำดับ"
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
    </div>
  );
}
