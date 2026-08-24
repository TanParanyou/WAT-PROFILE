"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/hooks/useToast";
import { useAdminCommunityQueue } from "../queries";
import { ModerationReviewPanel } from "./ModerationReviewPanel";
import { RevisionDiff } from "./RevisionDiff";
import { SafetyReasonModal } from "./SafetyReasonModal";
import { CommunityAdminTabs } from "./CommunityAdminTabs";
import { communityAdminService } from "@/services/communityAdminService";
import {
  AlertCircle,
  FileEdit,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react";
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
        title={t("title")}
        breadcrumbs={[
          { label: t("title"), href: "/admin/community" },
          { label: t("queue") },
        ]}
      />

      {/* Sub-Navigation Tabs */}
      <CommunityAdminTabs />

      {/* Internal Moderation Filter Bar */}
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
          <MessageSquare size={16} />
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
          <FileEdit size={16} />
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
          <AlertCircle size={16} />
          <span>{t("tabReports")}</span>
          <span className="bg-admin-surface-muted border border-admin-border px-1.5 py-0.5 text-xs">
            {reportsCount}
          </span>
        </button>
      </div>

      {/* Empty State */}
      {totalCount === 0 && (
        <div className="border border-admin-border bg-admin-surface p-12 text-center text-sm text-admin-muted">
          <CheckCircle2 size={32} className="mx-auto mb-3 text-admin-success" />
          <p className="font-semibold text-admin-foreground">{t("empty")}</p>
        </div>
      )}

      {/* Items Section */}
      {showItems && itemsCount > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-admin-foreground flex items-center gap-2">
              <MessageSquare size={18} className="text-admin-warning" />
              <span>
                {t("items")} ({itemsCount})
              </span>
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
      )}

      {/* Revisions Section */}
      {showRevisions && revisionsCount > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-admin-foreground flex items-center gap-2">
              <FileEdit size={18} className="text-admin-info" />
              <span>
                {t("revisions")} ({revisionsCount})
              </span>
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
      )}

      {/* Reports Section */}
      {showReports && reportsCount > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-admin-foreground flex items-center gap-2">
              <AlertCircle size={18} className="text-admin-danger" />
              <span>
                {t("reports")} ({reportsCount})
              </span>
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
      )}
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
  const [modalAction, setModalAction] = useState<"resolve" | "dismiss" | null>(
    null,
  );
  const [pending, setPending] = useState(false);

  const handleConfirmDecision = async (reasonText: string) => {
    if (!modalAction) return;
    setPending(true);
    try {
      await communityAdminService.decideReport(
        report.id,
        modalAction,
        reasonText.trim(),
      );
      toast.success(t("actionSuccess"));
      setModalAction(null);
      onDone();
    } catch {
      toast.error(t("actionError"));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="border border-admin-border bg-admin-surface p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border pb-3">
          <div className="flex items-center gap-2">
            <span className="border border-admin-danger/40 bg-admin-danger/10 px-2.5 py-0.5 text-xs font-semibold text-admin-danger">
              {report.reason}
            </span>
            <span className="border border-admin-border bg-admin-surface-muted px-2 py-0.5 text-xs font-medium text-admin-muted">
              {report.target_type}
            </span>
          </div>
          <span className="text-xs text-admin-muted">
            {new Date(report.created_at).toLocaleString("th-TH")}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-admin-muted">
              {t("reportedContent")}:
            </span>
            <span className="font-mono text-xs text-admin-foreground">
              {report.target_id}
            </span>
          </div>

          {report.details && (
            <div className="border border-admin-border bg-admin-canvas p-3 text-xs leading-relaxed text-admin-foreground">
              <p className="font-semibold text-admin-muted mb-1">
                {t("reportDetails")}:
              </p>
              <p>{report.details}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => setModalAction("dismiss")}
            className="flex min-h-10 items-center gap-1.5 border border-admin-border bg-admin-surface px-4 py-1.5 text-xs font-semibold text-admin-foreground hover:bg-admin-surface-muted disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            <XCircle size={14} />
            <span>{t("reportDismiss")}</span>
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={() => setModalAction("resolve")}
            className="flex min-h-10 items-center gap-1.5 border border-admin-success bg-admin-success/10 px-4 py-1.5 text-xs font-semibold text-admin-success hover:bg-admin-success/20 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            <CheckCircle2 size={14} />
            <span>{t("reportResolve")}</span>
          </button>
        </div>
      </div>

      {/* Dedicated Safety Reason Modal */}
      {modalAction && (
        <SafetyReasonModal
          isOpen={true}
          onClose={() => setModalAction(null)}
          title={
            modalAction === "resolve"
              ? t("resolveReportConfirm")
              : t("dismissReportConfirm")
          }
          description={
            modalAction === "resolve"
              ? t("reportResolve")
              : t("reportDismiss")
          }
          confirmText={t("confirm")}
          variant={modalAction === "resolve" ? "default" : "danger"}
          isLoading={pending}
          onConfirm={handleConfirmDecision}
        />
      )}
    </>
  );
}
