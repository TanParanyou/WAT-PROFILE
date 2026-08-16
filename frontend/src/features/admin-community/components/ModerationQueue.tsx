"use client";

import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { useAdminCommunityQueue } from "../queries";
import { ModerationReviewPanel } from "./ModerationReviewPanel";
import { RevisionDiff } from "./RevisionDiff";
import type { AdminCommunityReport } from "../types";
import { useState } from "react";

export function ModerationQueue() {
  const t = useTranslations("Admin.community");
  const query = useAdminCommunityQueue();
  const [reportMessage, setReportMessage] = useState("");
  if (query.isLoading) return <p className="p-6 text-sm text-admin-muted">{t("loading")}</p>;
  if (query.isError || !query.data) return <p className="border border-admin-danger p-5 text-sm text-admin-danger">{t("loadError")}</p>;
  const queue = query.data;
  return <div><AdminPageHeader title={t("queue")} breadcrumbs={[{ label: t("title") }, { label: t("queue") }]} /><p className="-mt-3 mb-6 max-w-3xl text-sm text-admin-muted">{t("description")}</p><section><h2 className="mb-3 text-lg font-semibold text-admin-foreground">{t("items")}</h2>{queue.items.length === 0 ? <p className="border border-admin-border p-5 text-sm text-admin-muted">{t("noItems")}</p> : <div className="space-y-4">{queue.items.map((item) => <ModerationReviewPanel key={`${item.target_type}-${item.target_id}`} item={item} onDone={() => void query.refetch()} />)}</div>}</section><section className="mt-10"><h2 className="mb-3 text-lg font-semibold text-admin-foreground">{t("revisions")}</h2>{queue.revisions.length === 0 ? <p className="border border-admin-border p-5 text-sm text-admin-muted">{t("noRevisions")}</p> : <div className="space-y-4">{queue.revisions.map((revision) => <RevisionDiff key={revision.id} revision={revision} onDone={() => void query.refetch()} />)}</div>}</section><section className="mt-10"><h2 className="mb-3 text-lg font-semibold text-admin-foreground">{t("reports")}</h2>{queue.reports.length === 0 ? <p className="border border-admin-border p-5 text-sm text-admin-muted">{t("noReports")}</p> : <div className="space-y-3">{queue.reports.map((report) => <ReportRow key={report.id} report={report} onDone={() => void query.refetch()} onMessage={setReportMessage} />)}</div>}{reportMessage ? <p className="mt-3 text-sm text-admin-danger" role="alert">{reportMessage}</p> : null}</section></div>;
}

function ReportRow({ report, onDone, onMessage }: { report: AdminCommunityReport; onDone: () => void; onMessage: (value: string) => void }) {
  const t = useTranslations("Admin.community");
  const mutation = import("@/services/communityAdminService");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const decide = async (decision: "resolve" | "dismiss") => {
    if (reason.trim().length < 2) { onMessage(t("reason")); return; }
    setPending(true); onMessage("");
    try { const { communityAdminService } = await mutation; await communityAdminService.decideReport(report.id, decision, reason.trim()); onDone(); } catch { onMessage(t("loadError")); } finally { setPending(false); }
  };
  return <article className="border border-admin-border bg-admin-surface p-4"><p className="text-xs text-admin-muted">{report.target_type} · {report.target_id} · {report.reason}</p>{report.details ? <p className="mt-2 text-sm text-admin-body">{report.details}</p> : null}<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} placeholder={t("reasonPlaceholder")} className="mt-3 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm" /><div className="mt-3 flex gap-2"><PermissionGuard resource="community" action="moderate"><button type="button" disabled={pending} onClick={() => void decide("resolve")} className="min-h-11 bg-admin-action px-4 text-sm font-semibold text-admin-on-action">{t("reportResolve")}</button><button type="button" disabled={pending} onClick={() => void decide("dismiss")} className="min-h-11 border border-admin-border px-4 text-sm font-semibold">{t("reportDismiss")}</button></PermissionGuard></div></article>;
}
