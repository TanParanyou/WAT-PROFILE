"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/hooks/useToast";
import { useAdminCommunityQueue } from "../queries";
import { ModerationReviewPanel } from "./ModerationReviewPanel";
import { RevisionDiff } from "./RevisionDiff";
import { communityAdminService } from "@/services/communityAdminService";
import type { AdminCommunityReport } from "../types";

type ModerationTab = "all" | "items" | "revisions" | "reports";

export function ModerationQueue() {
  const t = useTranslations("Admin.community");
  const query = useAdminCommunityQueue();
  const [activeTab, setActiveTab] = useState<ModerationTab>("all");

  if (query.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center border border-admin-border bg-admin-surface">
        <Loading size="lg" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="border border-admin-danger bg-admin-surface p-6 text-sm text-admin-danger">
        {t("loadError")}
      </div>
    );
  }

  const queue = query.data;
  const itemsCount = queue.items.length;
  const revisionsCount = queue.revisions.length;
  const reportsCount = queue.reports.length;
  const totalCount = itemsCount + revisionsCount + reportsCount;

  const showItems = activeTab === "all" || activeTab === "items";
  const showRevisions = activeTab === "all" || activeTab === "revisions";
  const showReports = activeTab === "all" || activeTab === "reports";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("queue")}
        breadcrumbs={[
          { label: t("title"), href: "/admin/community" },
          { label: t("queue") },
        ]}
      />

      <p className="-mt-4 max-w-3xl text-sm text-admin-muted">
        {t("description")}
      </p>

      {/* Tabs Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-admin-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex min-h-11 items-center gap-2 border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${
            activeTab === "all"
              ? "border-admin-focus bg-admin-selected text-admin-selected-foreground"
              : "border-admin-border bg-admin-surface text-admin-foreground hover:bg-admin-surface-muted"
          }`}
        >
          <span>{t("tabAll")}</span>
          <span className="bg-admin-surface-muted border border-admin-border px-1.5 py-0.5 text-xs">
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("items")}
          className={`flex min-h-11 items-center gap-2 border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${
            activeTab === "items"
              ? "border-admin-focus bg-admin-selected text-admin-selected-foreground"
              : "border-admin-border bg-admin-surface text-admin-foreground hover:bg-admin-surface-muted"
          }`}
        >
          <span>{t("tabItems")}</span>
          <span className="bg-admin-surface-muted border border-admin-border px-1.5 py-0.5 text-xs">
            {itemsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("revisions")}
          className={`flex min-h-11 items-center gap-2 border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${
            activeTab === "revisions"
              ? "border-admin-focus bg-admin-selected text-admin-selected-foreground"
              : "border-admin-border bg-admin-surface text-admin-foreground hover:bg-admin-surface-muted"
          }`}
        >
          <span>{t("tabRevisions")}</span>
          <span className="bg-admin-surface-muted border border-admin-border px-1.5 py-0.5 text-xs">
            {revisionsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`flex min-h-11 items-center gap-2 border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${
            activeTab === "reports"
              ? "border-admin-focus bg-admin-selected text-admin-selected-foreground"
              : "border-admin-border bg-admin-surface text-admin-foreground hover:bg-admin-surface-muted"
          }`}
        >
          <span>{t("tabReports")}</span>
          <span className="bg-admin-surface-muted border border-admin-border px-1.5 py-0.5 text-xs">
            {reportsCount}
          </span>
        </button>
      </div>

      {/* Empty State */}
      {totalCount === 0 ? (
        <div className="border border-admin-border bg-admin-surface p-12 text-center text-sm text-admin-muted">
          {t("empty")}
        </div>
      ) : null}

      {/* Items Section */}
      {showItems && itemsCount > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-admin-foreground">
              {t("items")} ({itemsCount})
            </h2>
          </div>
          <div className="space-y-4">
            {queue.items.map((item) => (
              <ModerationReviewPanel
                key={`${item.target_type}-${item.target_id}`}
                item={item}
                onDone={() => void query.refetch()}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Revisions Section */}
      {showRevisions && revisionsCount > 0 ? (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-admin-foreground">
              {t("revisions")} ({revisionsCount})
            </h2>
          </div>
          <div className="space-y-4">
            {queue.revisions.map((revision) => (
              <RevisionDiff
                key={revision.id}
                revision={revision}
                onDone={() => void query.refetch()}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Reports Section */}
      {showReports && reportsCount > 0 ? (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-admin-foreground">
              {t("reports")} ({reportsCount})
            </h2>
          </div>
          <div className="space-y-3">
            {queue.reports.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                onDone={() => void query.refetch()}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ReportRow({
  report,
  onDone,
}: {
  report: AdminCommunityReport;
  onDone: () => void;
}) {
  const t = useTranslations("Admin.community");
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  const decide = async (decision: "resolve" | "dismiss") => {
    if (reason.trim().length < 2) {
      toast.error(t("reason"));
      return;
    }
    setPending(true);
    try {
      await communityAdminService.decideReport(report.id, decision, reason.trim());
      toast.success(t("actionSuccess"));
      onDone();
    } catch {
      toast.error(t("actionError"));
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="border border-admin-border bg-admin-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-admin-border pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-admin-muted">
          {report.target_type} · ID: {report.target_id}
        </span>
        <span className="border border-admin-danger/40 bg-admin-danger/10 px-2 py-0.5 text-xs font-semibold text-admin-danger">
          {report.reason}
        </span>
      </div>

      {report.details ? (
        <p className="mt-3 text-sm text-admin-foreground leading-relaxed">
          {report.details}
        </p>
      ) : null}

      <div className="mt-4">
        <label className="block text-xs font-semibold text-admin-muted">
          {t("reason")} <span className="text-admin-danger">*</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            placeholder={t("reasonPlaceholder")}
            className="mt-1 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <PermissionGuard resource="community" action="moderate">
          <button
            type="button"
            disabled={pending}
            onClick={() => void decide("resolve")}
            className="flex min-h-11 items-center justify-center bg-admin-action px-4 py-2 text-sm font-semibold text-admin-on-action hover:brightness-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            {pending ? <Loading size="sm" /> : t("reportResolve")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void decide("dismiss")}
            className="flex min-h-11 items-center justify-center border border-admin-border px-4 py-2 text-sm font-semibold text-admin-foreground hover:bg-admin-surface-muted disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            {t("reportDismiss")}
          </button>
        </PermissionGuard>
      </div>
    </article>
  );
}
