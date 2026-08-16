"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { useAdminCommunityMutation } from "../queries";
import type { AdminCommunityQueueItem } from "../types";

const actionsByTarget: Record<AdminCommunityQueueItem["target_type"], string[]> = {
  question: ["approve", "reject", "hide", "restore", "lock", "unlock", "archive", "unarchive"],
  answer: ["approve", "reject", "hide", "restore", "official"],
  comment: ["approve", "reject", "hide", "restore"],
};

export function ModerationReviewPanel({ item, onDone }: { item: AdminCommunityQueueItem; onDone: () => void }) {
  const t = useTranslations("Admin.community");
  const mutation = useAdminCommunityMutation(({ action, reason }: { action: string; reason: string }) => import("@/services/communityAdminService").then(({ communityAdminService }) => communityAdminService.moderate(item.target_type, item.target_id, action, reason)));
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const submit = async (action: string) => {
    if (reason.trim().length < 2) {
      setMessage(t("reason"));
      return;
    }
    setMessage("");
    try {
      await mutation.mutateAsync({ action, reason: reason.trim() });
      onDone();
    } catch {
      setMessage(t("loadError"));
    }
  };
  return (
    <article className="border border-admin-border bg-admin-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-admin-muted">{item.target_type} · {item.target_id}</p><h3 className="mt-2 font-semibold text-admin-foreground">{item.title || t("items")}</h3></div><span className="text-xs text-admin-muted">{new Date(item.created_at).toLocaleString()}</span>
      </div>
      {item.body ? <RichTextContent value={item.body} locale="en" defaultLocale="en" className="mt-4 max-h-48 overflow-y-auto text-sm leading-7 text-admin-body" /> : null}
      <label className="mt-4 block text-sm font-medium text-admin-foreground">{t("reason")}<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} maxLength={2000} placeholder={t("reasonPlaceholder")} className="mt-2 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-admin-focus" /></label>
      {message ? <p className="mt-2 text-sm text-admin-danger" role="alert">{message}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2"><PermissionGuard resource="community" action="moderate">{actionsByTarget[item.target_type].map((action) => <button key={action} type="button" disabled={mutation.isPending} onClick={() => void submit(action)} className="min-h-11 border border-admin-border px-3 text-sm font-semibold text-admin-foreground hover:bg-admin-surface-muted disabled:opacity-50">{t(action as "approve")}</button>)}</PermissionGuard></div>
    </article>
  );
}
