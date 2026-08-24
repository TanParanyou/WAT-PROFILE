"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Loading } from "@/components/ui/Loading";
import {
  useAdminCommunityQueue,
  useAdminCommunityCategories,
} from "@/features/admin-community/queries";
import { CommunityAdminTabs } from "@/features/admin-community/components/CommunityAdminTabs";
import {
  ShieldAlert,
  FolderTree,
  UserX,
  Layers,
  ArrowRight,
  Clock,
  AlertCircle,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function AdminCommunityPage() {
  const t = useTranslations("Admin.community");
  const queueQuery = useAdminCommunityQueue();
  const categoriesQuery = useAdminCommunityCategories();

  const queue = queueQuery.data;
  const categories = categoriesQuery.data ?? [];

  const pendingItemsCount = queue?.items?.length ?? 0;
  const pendingRevisionsCount = queue?.revisions?.length ?? 0;
  const openReportsCount = queue?.reports?.length ?? 0;
  const totalPendingModeration = pendingItemsCount + pendingRevisionsCount;
  const activeCategoriesCount = categories.filter((c) => c.is_active).length;

  return (
    <PermissionGuard
      resource="community"
      action="read"
      fallback={
        <p className="border border-admin-danger p-5 text-sm text-admin-danger">
          {t("loadError")}
        </p>
      }
    >
      <div className="space-y-6">
        <AdminPageHeader
          title={t("title")}
          breadcrumbs={[{ label: t("title") }]}
        />
        <p className="-mt-4 max-w-3xl text-sm text-admin-muted">
          {t("description")}
        </p>

        {/* Sub-Navigation Tabs */}
        <CommunityAdminTabs />

        {/* Metric Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Pending Moderation Queue Card */}
          <Link
            href="/admin/community/moderation"
            className="group border border-admin-border bg-admin-surface p-5 transition-colors hover:border-admin-focus hover:bg-admin-surface-muted"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-admin-muted">
                {t("statPendingQueue")}
              </span>
              <div className="p-2 text-admin-warning">
                <Clock size={20} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              {queueQuery.isLoading ? (
                <Loading size="sm" />
              ) : (
                <span className="text-3xl font-bold text-admin-foreground">
                  {totalPendingModeration}
                </span>
              )}
              <span className="text-xs text-admin-muted">
                ({pendingItemsCount} {t("items")}, {pendingRevisionsCount}{" "}
                {t("revisions")})
              </span>
            </div>
            <p className="mt-2 text-xs text-admin-muted">
              {t("statPendingDescription")}
            </p>
          </Link>

          {/* Active Reports Card */}
          <Link
            href="/admin/community/moderation"
            className="group border border-admin-border bg-admin-surface p-5 transition-colors hover:border-admin-focus hover:bg-admin-surface-muted"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-admin-muted">
                {t("statActiveReports")}
              </span>
              <div className="p-2 text-admin-danger">
                <AlertCircle size={20} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              {queueQuery.isLoading ? (
                <Loading size="sm" />
              ) : (
                <span
                  className={`text-3xl font-bold ${
                    openReportsCount > 0
                      ? "text-admin-danger"
                      : "text-admin-foreground"
                  }`}
                >
                  {openReportsCount}
                </span>
              )}
              <span className="text-xs text-admin-muted">{t("reports")}</span>
            </div>
            <p className="mt-2 text-xs text-admin-muted">
              {t("statReportsDescription")}
            </p>
          </Link>

          {/* Categories Count Card */}
          <Link
            href="/admin/community/categories"
            className="group border border-admin-border bg-admin-surface p-5 sm:col-span-2 lg:col-span-1 transition-colors hover:border-admin-focus hover:bg-admin-surface-muted"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-admin-muted">
                {t("statTotalCategories")}
              </span>
              <div className="p-2 text-admin-info">
                <Layers size={20} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              {categoriesQuery.isLoading ? (
                <Loading size="sm" />
              ) : (
                <span className="text-3xl font-bold text-admin-foreground">
                  {categories.length}
                </span>
              )}
              <span className="text-xs text-admin-muted">
                ({activeCategoriesCount} {t("categoryActive")})
              </span>
            </div>
            <p className="mt-2 text-xs text-admin-muted">
              {t("statCategoriesDescription")}
            </p>
          </Link>
        </div>

        {/* Feature Navigation Hub */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Moderation Queue */}
          <Link
            href="/admin/community/moderation"
            className="group flex flex-col justify-between border border-admin-border bg-admin-surface p-5 transition-colors hover:border-admin-control-border hover:bg-admin-surface-muted"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 text-admin-action bg-admin-surface-muted border border-admin-border">
                  <ShieldAlert size={22} />
                </div>
                {totalPendingModeration + openReportsCount > 0 ? (
                  <span className="bg-admin-warning px-2.5 py-0.5 text-xs font-bold text-admin-on-action">
                    {totalPendingModeration + openReportsCount}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 text-base font-semibold text-admin-foreground">
                {t("queue")}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-admin-muted">
                {t("moderationCardDesc")}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-admin-action">
              <span>{t("goToModeration")}</span>
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>

          {/* Categories */}
          <Link
            href="/admin/community/categories"
            className="group flex flex-col justify-between border border-admin-border bg-admin-surface p-5 transition-colors hover:border-admin-control-border hover:bg-admin-surface-muted"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 text-admin-info bg-admin-surface-muted border border-admin-border">
                  <FolderTree size={22} />
                </div>
                <span className="bg-admin-surface-muted border border-admin-border px-2.5 py-0.5 text-xs font-semibold text-admin-foreground">
                  {categories.length}
                </span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-admin-foreground">
                {t("categories")}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-admin-muted">
                {t("categoriesCardDesc")}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-admin-action">
              <span>{t("manageCategories")}</span>
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>

          {/* Members */}
          <Link
            href="/admin/community/members"
            className="group flex flex-col justify-between border border-admin-border bg-admin-surface p-5 transition-colors hover:border-admin-control-border hover:bg-admin-surface-muted"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 text-admin-danger bg-admin-surface-muted border border-admin-border">
                  <UserX size={22} />
                </div>
              </div>
              <h2 className="mt-4 text-base font-semibold text-admin-foreground">
                {t("members")}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-admin-muted">
                {t("membersCardDesc")}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-admin-action">
              <span>{t("manageMembers")}</span>
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>
        </div>
      </div>
    </PermissionGuard>
  );
}
