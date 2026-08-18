"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SortableList } from "@/components/admin/SortableList";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/hooks/useToast";
import {
  GripVertical,
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  useAdminCommunityCategories,
  useDeleteAdminCategory,
  useReorderAdminCategories,
  useSaveAdminCategory,
} from "../queries";
import { SafetyReasonModal } from "./SafetyReasonModal";
import type { AdminCategoryInput, AdminCommunityCategory } from "../types";

const emptyInput: AdminCategoryInput = {
  slug: "",
  name: { th: "", en: "", de: "" },
  description: { th: "", en: "", de: "" },
  sort_order: 10,
  is_active: true,
};

export function CategoryManager() {
  const t = useTranslations("Admin.community");
  const locale = useLocale() as "th" | "en" | "de";
  const { toast } = useToast();

  const query = useAdminCommunityCategories();
  const saveMutation = useSaveAdminCategory();
  const deleteMutation = useDeleteAdminCategory();
  const reorderMutation = useReorderAdminCategories();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCommunityCategory | null>(null);
  const [formData, setFormData] = useState<AdminCategoryInput>(emptyInput);

  const [deletingCategory, setDeletingCategory] = useState<AdminCommunityCategory | null>(null);

  const categories = query.data ?? [];

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData(emptyInput);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: AdminCommunityCategory) => {
    setEditingCategory(category);
    setFormData({
      slug: category.slug,
      name: {
        th: category.name.th || "",
        en: category.name.en || "",
        de: category.name.de || "",
      },
      description: {
        th: category.description?.th || "",
        en: category.description?.en || "",
        de: category.description?.de || "",
      },
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug.trim() || !formData.name.th.trim() || !formData.name.en.trim()) {
      toast.error(t("loadError"));
      return;
    }

    try {
      await saveMutation.mutateAsync({
        input: formData,
        id: editingCategory?.id,
      });
      toast.success(editingCategory ? t("decisionSaved") : t("actionSuccess"));
      setIsModalOpen(false);
      setFormData(emptyInput);
      setEditingCategory(null);
    } catch {
      toast.error(t("actionError"));
    }
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!deletingCategory) return;
    try {
      await deleteMutation.mutateAsync({
        id: deletingCategory.id,
        reason,
      });
      toast.success(t("actionSuccess"));
      setDeletingCategory(null);
    } catch {
      toast.error(t("actionError"));
    }
  };

  const handleReorder = async (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= categories.length || to >= categories.length) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    try {
      await reorderMutation.mutateAsync(reordered.map((c) => c.id));
      toast.success(t("reorderSuccess"));
    } catch {
      toast.error(t("reorderError"));
    }
  };

  const handleStepMove = (index: number, delta: -1 | 1) => {
    handleReorder(index, index + delta);
  };

  return (
    <div>
      <AdminPageHeader
        title={t("categories")}
        breadcrumbs={[
          { label: t("title"), href: "/admin/community" },
          { label: t("categories") },
        ]}
        actions={
          <PermissionGuard resource="community" action="manage_categories">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex min-h-11 items-center gap-2 bg-admin-action px-4 py-2 text-sm font-semibold text-admin-on-action hover:brightness-95 focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <Plus size={16} />
              <span>{t("categoryCreate")}</span>
            </button>
          </PermissionGuard>
        }
      />

      <div className="mt-4">
        {query.isLoading ? (
          <div className="flex h-48 items-center justify-center border border-admin-border bg-admin-surface">
            <Loading size="md" />
          </div>
        ) : query.isError ? (
          <p className="border border-admin-danger p-5 text-sm text-admin-danger">
            {t("loadError")}
          </p>
        ) : categories.length === 0 ? (
          <div className="border border-admin-border bg-admin-surface p-12 text-center text-sm text-admin-muted">
            {t("empty")}
          </div>
        ) : (
          <SortableList
            items={categories}
            onReorder={handleReorder}
            className="space-y-2"
            renderItem={(category, index, dragProps, isDragging) => {
              const displayName =
                category.name[locale] || category.name.th || category.name.en || category.slug;
              const displayDesc =
                category.description?.[locale] || category.description?.th || category.description?.en;

              return (
                <article
                  key={category.id}
                  {...dragProps}
                  className={`flex flex-wrap items-center justify-between gap-4 border bg-admin-surface p-4 transition-all ${
                    isDragging
                      ? "border-admin-focus bg-admin-selected/50 opacity-60 scale-[0.99]"
                      : "border-admin-border hover:border-admin-control-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="cursor-grab active:cursor-grabbing p-1.5 text-admin-muted hover:text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"
                      title={t("dragHandle")}
                      aria-label={t("dragHandle")}
                    >
                      <GripVertical size={18} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-admin-foreground">
                          {displayName}
                        </h3>
                        <StatusBadge
                          label={category.is_active ? t("categoryActive") : t("inactive")}
                          variant={category.is_active ? "success" : "default"}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-admin-muted">
                        Slug: <span className="font-mono">{category.slug}</span>
                        {displayDesc ? ` · ${displayDesc}` : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0 || reorderMutation.isPending}
                      onClick={() => handleStepMove(index, -1)}
                      className="p-2 text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-admin-focus"
                      title={t("moveUp")}
                      aria-label={t("moveUp")}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={index === categories.length - 1 || reorderMutation.isPending}
                      onClick={() => handleStepMove(index, 1)}
                      className="p-2 text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-admin-focus"
                      title={t("moveDown")}
                      aria-label={t("moveDown")}
                    >
                      <ChevronDown size={16} />
                    </button>

                    <div className="mx-2 h-4 w-px bg-admin-border" />

                    <PermissionGuard resource="community" action="manage_categories">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(category)}
                        className="flex min-h-9 items-center gap-1.5 border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-foreground hover:bg-admin-surface-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
                      >
                        <Edit2 size={13} />
                        <span>{t("categoryEdit")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCategory(category)}
                        className="flex min-h-9 items-center gap-1.5 border border-admin-danger/50 px-3 py-1.5 text-xs font-semibold text-admin-danger hover:bg-admin-danger/10 focus-visible:outline-2 focus-visible:outline-admin-focus"
                      >
                        <Trash2 size={13} />
                        <span>{t("categoryDelete")}</span>
                      </button>
                    </PermissionGuard>
                  </div>
                </article>
              );
            }}
          />
        )}
      </div>

      {/* Category Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !saveMutation.isPending && setIsModalOpen(false)}
        size="lg"
        title={editingCategory ? t("categoryEdit") : t("categoryCreate")}
        showCloseButton={!saveMutation.isPending}
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => setIsModalOpen(false)}
              className="min-h-11 border border-admin-control-border bg-admin-surface px-4 py-2 text-sm font-medium text-admin-body hover:bg-admin-surface-muted disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={handleSubmitForm}
              className="flex min-h-11 items-center justify-center gap-2 bg-admin-action px-6 py-2 text-sm font-semibold text-admin-on-action hover:brightness-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              {saveMutation.isPending ? <Loading size="sm" /> : t("categorySave")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-admin-foreground">
              {t("categorySlug")} <span className="text-admin-danger">*</span>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. general-dharma"
                className="mt-1 min-h-11 w-full border border-admin-border bg-admin-canvas px-3 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
              />
            </label>
          </div>

          <div className="border-t border-admin-border pt-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-admin-muted">
              {t("title")}
            </h4>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block text-sm">
                {t("categoryTh")} <span className="text-admin-danger">*</span>
                <input
                  type="text"
                  required
                  value={formData.name.th}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: { ...formData.name, th: e.target.value },
                    })
                  }
                  className="mt-1 min-h-11 w-full border border-admin-border bg-admin-canvas px-3 text-sm text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"
                />
              </label>
              <label className="block text-sm">
                {t("categoryEn")} <span className="text-admin-danger">*</span>
                <input
                  type="text"
                  required
                  value={formData.name.en}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: { ...formData.name, en: e.target.value },
                    })
                  }
                  className="mt-1 min-h-11 w-full border border-admin-border bg-admin-canvas px-3 text-sm text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"
                />
              </label>
              <label className="block text-sm">
                {t("categoryDe")}
                <input
                  type="text"
                  value={formData.name.de}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: { ...formData.name, de: e.target.value },
                    })
                  }
                  className="mt-1 min-h-11 w-full border border-admin-border bg-admin-canvas px-3 text-sm text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"
                />
              </label>
            </div>
          </div>

          <div className="border-t border-admin-border pt-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-admin-muted">
              {t("categoryDescription")}
            </h4>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block text-sm">
                {t("categoryDescTh")}
                <textarea
                  rows={2}
                  value={formData.description?.th ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: {
                        th: e.target.value,
                        en: formData.description?.en ?? "",
                        de: formData.description?.de ?? "",
                      },
                    })
                  }
                  className="mt-1 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"
                />
              </label>
              <label className="block text-sm">
                {t("categoryDescEn")}
                <textarea
                  rows={2}
                  value={formData.description?.en ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: {
                        th: formData.description?.th ?? "",
                        en: e.target.value,
                        de: formData.description?.de ?? "",
                      },
                    })
                  }
                  className="mt-1 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"
                />
              </label>
              <label className="block text-sm">
                {t("categoryDescDe")}
                <textarea
                  rows={2}
                  value={formData.description?.de ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: {
                        th: formData.description?.th ?? "",
                        en: e.target.value,
                        de: formData.description?.de ?? "",
                      },
                    })
                  }
                  className="mt-1 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"
                />
              </label>
            </div>
          </div>

          <div className="border-t border-admin-border pt-4">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-admin-foreground">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="size-4 border-admin-border text-admin-action focus:ring-admin-focus"
              />
              <span className="font-medium">{t("categoryActive")}</span>
            </label>
          </div>
        </form>
      </Modal>

      {/* Safety Delete Confirmation Modal */}
      <SafetyReasonModal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
        title={t("categoryDeleteConfirm")}
        description={t("categoryDeleteDesc")}
        isLoading={deleteMutation.isPending}
        variant="danger"
        confirmText={t("categoryDelete")}
      />
    </div>
  );
}
