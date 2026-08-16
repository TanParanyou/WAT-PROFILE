"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { useAdminCommunityMutation } from "../queries";
import type { AdminCommunityRevision } from "../types";

export function RevisionDiff({ revision, onDone }: { revision: AdminCommunityRevision; onDone: () => void }) {
  const t = useTranslations("Admin.community");
  const mutation = useAdminCommunityMutation(({ approve, reason }: { approve: boolean; reason: string }) => import("@/services/communityAdminService").then(({ communityAdminService }) => communityAdminService.decideRevision(revision.id, approve, reason)));
  const [reason, setReason] = useState("");
  const decide = (approve: boolean) => {
    if (reason.trim().length < 2) return;
    void mutation.mutateAsync({ approve, reason: reason.trim() }).then(onDone).catch(() => undefined);
  };
  return <article className="border border-admin-border bg-admin-surface p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-admin-muted">{revision.target_type} · {revision.target_id}</p>{revision.title_after ? <div className="mt-3 grid gap-3 md:grid-cols-2"><div><p className="text-xs text-admin-muted">{revision.title_before}</p></div><div><p className="font-semibold text-admin-foreground">{revision.title_after}</p></div></div> : null}<div className="mt-4 grid gap-4 md:grid-cols-2"><div><p className="mb-2 text-xs font-semibold text-admin-muted">Before</p><RichTextContent value={revision.body_before} locale="en" defaultLocale="en" className="text-sm leading-7 text-admin-body" /></div><div><p className="mb-2 text-xs font-semibold text-admin-muted">After</p><RichTextContent value={revision.body_after} locale="en" defaultLocale="en" className="text-sm leading-7 text-admin-body" /></div></div><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} placeholder={t("reasonPlaceholder")} className="mt-4 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm" /><div className="mt-3 flex gap-2"><PermissionGuard resource="community" action="moderate"><button type="button" disabled={mutation.isPending} onClick={() => decide(true)} className="min-h-11 bg-admin-action px-4 text-sm font-semibold text-admin-on-action">{t("approveRevision")}</button><button type="button" disabled={mutation.isPending} onClick={() => decide(false)} className="min-h-11 border border-admin-border px-4 text-sm font-semibold">{t("rejectRevision")}</button></PermissionGuard></div></article>;
}
