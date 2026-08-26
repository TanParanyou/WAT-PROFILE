"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Search, Filter } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { PermissionButton } from "@/components/admin/PermissionButton";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminChatbotService } from "@/services/adminChatbotService";
import { KnowledgeBaseDrawer } from "@/components/admin/chatbot/KnowledgeBaseDrawer";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import type { ChatbotKnowledgeBaseItem } from "@/types/chatbot";

export default function AdminChatbotKnowledgeBasePage() {
  const t = useTranslations("Admin.chatbot");
  const tSidebar = useTranslations("Admin.sidebar");
  const locale = useLocale();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [activeOnly, setActiveOnly] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<ChatbotKnowledgeBaseItem | null>(null);

  const queryKey = [
    "admin",
    "chatbot",
    "knowledge-base",
    { page, limit, search, category, activeOnly },
  ];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      adminChatbotService.getKnowledgeBaseList({
        page,
        limit,
        search: search.trim() || undefined,
        category: category !== "all" ? category : undefined,
        active_only: activeOnly || undefined,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminChatbotService.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chatbot"] });
      toast.success(t("saveSuccess"));
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to toggle status";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminChatbotService.deleteKnowledgeBase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chatbot"] });
      toast.success(t("deleteSuccess"));
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to delete item";
      toast.error(msg);
    },
  });

  const handleAddNew = () => {
    setSelectedItem(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (item: ChatbotKnowledgeBaseItem) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (item: ChatbotKnowledgeBaseItem) => {
    const isConfirmed = await confirm({
      title: t("deleteConfirmTitle"),
      message: t("deleteConfirmDesc"),
      variant: "danger",
    });

    if (isConfirmed) {
      deleteMutation.mutate(item.id);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "practice":
        return t("categoryPractice");
      case "visiting":
        return t("categoryVisiting");
      case "ordination":
        return t("categoryOrdination");
      default:
        return t("categoryGeneral");
    }
  };

  const columns: Column<ChatbotKnowledgeBaseItem>[] = [
    {
      id: "id",
      header: "#",
      accessorKey: "id",
      className: "w-14 text-center",
      cell: (val) => <span className="text-xs text-neutral-500">{String(val)}</span>,
    },
    {
      id: "category",
      header: t("category"),
      accessorKey: "category",
      className: "w-32",
      cell: (val) => (
        <span className="inline-block border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
          {getCategoryLabel(String(val))}
        </span>
      ),
    },
    {
      id: "question",
      header: t("question"),
      cell: (_, row) => {
        const primaryText =
          row.question?.[locale as "th" | "en" | "de"] ||
          row.question?.th ||
          row.question?.en ||
          row.question?.de ||
          "-";
        return (
          <div className="max-w-xs sm:max-w-sm">
            <p className="line-clamp-2 text-xs font-medium text-neutral-900 dark:text-neutral-100">
              {primaryText}
            </p>
          </div>
        );
      },
    },
    {
      id: "answer",
      header: t("answer"),
      cell: (_, row) => {
        const primaryAnswer =
          row.answer?.[locale as "th" | "en" | "de"] ||
          row.answer?.th ||
          row.answer?.en ||
          row.answer?.de ||
          "-";
        return (
          <div className="max-w-sm sm:max-w-md">
            <p className="line-clamp-2 text-xs text-neutral-600 dark:text-neutral-300">
              {primaryAnswer}
            </p>
          </div>
        );
      },
    },
    {
      id: "keywords",
      header: t("keywords"),
      className: "hidden md:table-cell w-44",
      cell: (_, row) => (
        <div className="flex flex-wrap gap-1">
          {row.keywords && row.keywords.length > 0 ? (
            row.keywords.slice(0, 3).map((kw, i) => (
              <span
                key={i}
                className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 px-1.5 py-0.5 text-[10px]"
              >
                {kw}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-neutral-400">-</span>
          )}
          {row.keywords && row.keywords.length > 3 && (
            <span className="text-[10px] text-neutral-400">
              +{row.keywords.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "priority",
      header: t("priority"),
      accessorKey: "priority",
      className: "w-20 text-center",
      cell: (val) => (
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {Number(val) || 0}
        </span>
      ),
    },
    {
      id: "status",
      header: t("status"),
      className: "w-24 text-center",
      cell: (_, row) => (
        <button
          type="button"
          onClick={() => toggleMutation.mutate(row.id)}
          disabled={toggleMutation.isPending}
          className="transition-opacity hover:opacity-80"
        >
          <StatusBadge
            label={row.is_active ? t("active") : t("inactive")}
            variant={row.is_active ? "success" : "default"}
          />
        </button>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "w-20 text-right",
      cell: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleEdit(row)}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            title={t("editTitle")}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            title={t("delete")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard resource="chatbot" action="read">
      <div className="space-y-6">
        <AdminPageHeader
          title={t("title")}
          breadcrumbs={[
            { label: tSidebar("websiteGroup") },
            { label: t("title") },
          ]}
          actions={
            <PermissionButton
              resource="chatbot"
              action="create"
              onClick={handleAddNew}
              className="flex items-center gap-2 border border-amber-600 bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
            >
              <Plus className="h-4 w-4" />
              <span>{t("addNew")}</span>
            </PermissionButton>
          }
        />

        {/* Toolbar & Filters */}
        <div className="flex flex-col gap-3 rounded-none border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t("searchPlaceholder")}
                className="w-full border border-neutral-300 bg-white py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-neutral-400" />
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="border border-neutral-300 bg-white px-2.5 py-2 text-xs text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="all">{t("categoryAll")}</option>
                <option value="general">{t("categoryGeneral")}</option>
                <option value="practice">{t("categoryPractice")}</option>
                <option value="visiting">{t("categoryVisiting")}</option>
                <option value="ordination">{t("categoryOrdination")}</option>
              </select>
            </div>
          </div>

          {/* Active only toggle */}
          <div className="flex items-center gap-2">
            <input
              id="active_only_filter"
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => {
                setActiveOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
            />
            <label
              htmlFor="active_only_filter"
              className="text-xs text-neutral-700 dark:text-neutral-300"
            >
              {t("active")}
            </label>
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <DataTable
            columns={columns}
            data={data?.data || []}
            pagination={data?.pagination}
            isLoading={isLoading}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(Number(l));
              setPage(1);
            }}
          />
        </div>

        {/* Drawer Modal */}
        <KnowledgeBaseDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          item={selectedItem}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin", "chatbot"] });
          }}
        />

        {/* Safety Confirm Dialog */}
        <ConfirmDialog />
      </div>
    </PermissionGuard>
  );
}
