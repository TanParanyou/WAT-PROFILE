"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SortableList } from "@/components/admin/SortableList";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { Checkbox } from "@/components/ui/Checkbox";
import { useToast } from "@/hooks/useToast";
import {
  GripVertical,
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  FolderTree,
} from "lucide-react";
import {
  useAdminCommunityCategories,
  useDeleteAdminCategory,
  useReorderAdminCategories,
  useSaveAdminCategory,
} from "../queries";
import { SafetyReasonModal } from "./SafetyReasonModal";
import { CommunityAdminTabs } from "./CommunityAdminTabs";
import type { AdminCategoryInput, AdminCommunityCategory } from "../types";
import type { CommunityLocale } from "@/features/public/community/types";

const emptyInput: AdminCategoryInput = {
  slug: "",
  name: { th: "", en: "", de: "" },
  description: { th: "", en: "", de: "" },
  sort_order: 10,
  is_active: true,
};

export function CategoryManager() {
  const t = useTranslations("Admin.community");
  const locale = useLocale() as CommunityLocale;
  const { toast } = useToast();

  const query = useAdminCommunityCategories();
  const saveMutation = useSaveAdminCategory();
  const deleteMutation = useDeleteAdminCategory();
  const reorderMutation = useReorderAdminCategories();

  const [itemsOverride, setItemsOverride] = useState<
    AdminCommunityCategory[] | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<CommunityLocale>("th");
  const [editingCategory, setEditingCategory] =
    useState<AdminCommunityCategory | null>(null);
  const [formData, setFormData] = useState<AdminCategoryInput>(emptyInput);

  const [deletingCategory, setDeletingCategory] =
    useState<AdminCommunityCategory | null>(null);

  const categories = itemsOverride ?? query.data ?? [];

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData(emptyInput);
    setActiveLangTab("th");
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
    setActiveLangTab("th");
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.slug.trim() ||
      !formData.name.th.trim() ||
      !formData.name.en.trim()
    ) {
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
      setItemsOverride(null);
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
      setItemsOverride(null);
    } catch {
      toast.error(t("actionError"));
    }
  };

  // Local optimistic reorder during drag hover
  const handleLocalReorder = (from: number, to: number) => {
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= categories.length ||
      to >= categories.length
    )
      return;
    setItemsOverride(() => {
      const next = [...categories];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  // Persist to backend on drag end / drop
  const handleCommitReorder = async () => {
    if (categories.length === 0) return;
    try {
      await reorderMutation.mutateAsync(categories.map((c) => c.id));
      toast.success(t("reorderSuccess"));
      setItemsOverride(null);
    } catch {
      toast.error(t("reorderError"));
      setItemsOverride(null);
    }
  };

  // Step move via buttons (up/down)
  const handleStepMove = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= categories.length) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);

    setItemsOverride(reordered);
    try {
      await reorderMutation.mutateAsync(reordered.map((c) => c.id));
      toast.success(t("reorderSuccess"));
      setItemsOverride(null);
    } catch {
      toast.error(t("reorderError"));
      setItemsOverride(null);
    }
  };

  if (query.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center border border-admin-border bg-admin-surface">
        <Loading size="lg" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="border border-admin-danger bg-admin-surface p-6 text-sm text-admin-danger">
        {t("loadError")}
      </div>
    );
  }

  const langTabs: Array<{ key: CommunityLocale; label: string }> = [
    { key: "th", label: t("langTabTh") },
    { key: "en", label: t("langTabEn") },
    { key: "de", label: t("langTabDe") },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("title")}
        breadcrumbs={[
          { label: t("title"), href: "/admin/community" },
          { label: t("tabCategories") },
        ]}
        actions={
          <PermissionGuard resource="community" action="manage_categories">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex min-h-11 items-center gap-2 border border-admin-action bg-admin-action px-4 py-2 text-sm font-semibold text-admin-on-action hover:bg-admin-action-hover focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <Plus size={16} />
              <span>{t("categoryCreate")}</span>
            </button>
          </PermissionGuard>
        }
      />

      {/* Sub-Navigation Tabs */}
      <CommunityAdminTabs />

      {/* Categories List Table / Sortable */}
      <div className="border border-admin-border bg-admin-surface">
        <div className="flex items-center justify-between border-b border-admin-border p-4">
          <div className="flex items-center gap-2">
            <FolderTree size={18} className="text-admin-info" />
            <h2 className="text-sm font-semibold text-admin-foreground">
              {t("categories")} ({categories.length})
            </h2>
          </div>
          <span className="text-xs text-admin-muted">{t("dragHandle")}</span>
        </div>

        {categories.length === 0 ? (
          <div className="p-12 text-center text-sm text-admin-muted">
            {t("empty")}
          </div>
        ) : (
          <SortableList
            items={categories}
            onReorder={handleLocalReorder}
            onCommit={handleCommitReorder}
            renderItem={(category, index, dragProps, isDragging, isOver) => {
              const localizedName =
                category.name[locale] || category.name.th || category.name.en;
              const localizedDesc =
                category.description?.[locale] ||
                category.description?.th ||
                category.description?.en;

              return (
                <div
                  key={category.id}
                  {...dragProps}
                  className={`flex items-center justify-between gap-4 p-4 transition-colors ${
                    isDragging
                      ? "opacity-50 bg-admin-selected"
                      : isOver
                        ? "border-b-2 border-admin-focus bg-admin-surface-muted"
                        : "hover:bg-admin-surface-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={t("dragHandle")}
                      className="cursor-grab text-admin-muted hover:text-admin-foreground active:cursor-grabbing p-1"
                    >
                      <GripVertical size={16} />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-admin-foreground">
                          {localizedName}
                        </span>
                        <span className="font-mono text-xs text-admin-muted border border-admin-border px-1.5 py-0.5">
                          {category.slug}
                        </span>
                        <StatusBadge
                          label={
                            category.is_active
                              ? t("categoryActive")
                              : t("inactive")
                          }
                          variant={category.is_active ? "success" : "default"}
                        />
                      </div>
                      {localizedDesc && (
                        <p className="mt-1 text-xs text-admin-muted max-w-xl line-clamp-1">
                          {localizedDesc}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Move Step Buttons */}
                    <div className="flex items-center gap-0.5 border border-admin-border mr-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => void handleStepMove(index, -1)}
                        title={t("moveUp")}
                        className="p-1.5 text-admin-muted hover:text-admin-foreground disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={index === categories.length - 1}
                        onClick={() => void handleStepMove(index, 1)}
                        title={t("moveDown")}
                        className="p-1.5 text-admin-muted hover:text-admin-foreground disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <PermissionGuard
                      resource="community"
                      action="manage_categories"
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(category)}
                        title={t("categoryEdit")}
                        className="p-2 text-admin-foreground hover:bg-admin-surface-muted border border-admin-border"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCategory(category)}
                        title={t("categoryDelete")}
                        className="p-2 text-admin-danger hover:bg-admin-danger/10 border border-admin-border"
                      >
                        <Trash2 size={14} />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

      {/* Category Create / Edit Modal with Language Tabs */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? t("categoryEdit") : t("categoryCreate")}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="border border-admin-border bg-admin-surface px-4 py-2 text-sm font-semibold text-admin-foreground hover:bg-admin-surface-muted"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              form="category-form"
              disabled={saveMutation.isPending}
              className="flex min-h-10 items-center gap-2 border border-admin-action bg-admin-action px-5 py-2 text-sm font-semibold text-admin-on-action hover:bg-admin-action-hover disabled:opacity-50"
            >
              {saveMutation.isPending && <Loading size="sm" />}
              <span>{t("categorySave")}</span>
            </button>
          </div>
        }
      >
        <form
          id="category-form"
          onSubmit={handleSubmitForm}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-admin-foreground">
              {t("categorySlug")} <span className="text-admin-danger">*</span>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder={t("slugPlaceholder")}
                className="mt-1 min-h-11 w-full border border-admin-border bg-admin-canvas px-3 font-mono text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
              />
            </label>
          </div>

          {/* Language Selector Tabs */}
          <div className="border-t border-admin-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-admin-muted">
                {t("categoryNames")}
              </span>
              <div className="flex border border-admin-border bg-admin-canvas">
                {langTabs.map((lt) => (
                  <button
                    key={lt.key}
                    type="button"
                    onClick={() => setActiveLangTab(lt.key)}
                    className={`px-3 py-1 text-xs font-semibold transition-colors ${
                      activeLangTab === lt.key
                        ? "bg-admin-focus text-admin-selected-foreground"
                        : "text-admin-muted hover:text-admin-foreground"
                    }`}
                  >
                    {lt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Localized Name & Description according to active tab */}
            <div className="space-y-3 border border-admin-border bg-admin-surface p-4">
              <div>
                <label className="block text-sm font-medium text-admin-foreground">
                  <span>
                    {activeLangTab === "th"
                      ? t("categoryTh")
                      : activeLangTab === "en"
                        ? t("categoryEn")
                        : t("categoryDe")}
                  </span>
                  {(activeLangTab === "th" || activeLangTab === "en") && (
                    <span className="text-admin-danger"> *</span>
                  )}
                  <input
                    type="text"
                    required={activeLangTab === "th" || activeLangTab === "en"}
                    value={formData.name[activeLangTab] || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: {
                          ...formData.name,
                          [activeLangTab]: e.target.value,
                        },
                      })
                    }
                    className="mt-1 min-h-11 w-full border border-admin-border bg-admin-canvas px-3 text-sm text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-foreground">
                  <span>
                    {activeLangTab === "th"
                      ? t("categoryDescTh")
                      : activeLangTab === "en"
                        ? t("categoryDescEn")
                        : t("categoryDescDe")}
                  </span>
                  <textarea
                    rows={3}
                    value={formData.description?.[activeLangTab] ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: {
                          th: formData.description?.th ?? "",
                          en: formData.description?.en ?? "",
                          de: formData.description?.de ?? "",
                          [activeLangTab]: e.target.value,
                        },
                      })
                    }
                    className="mt-1 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-admin-border pt-4">
            <Checkbox
              id="category_is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              label={t("categoryActive")}
            />
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
