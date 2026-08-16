"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { useState } from "react";
import { useAdminCommunityMutation } from "@/features/admin-community/queries";
import { communityAdminService } from "@/services/communityAdminService";

export default function AdminCommunityQuestionPage() {
  const t = useTranslations("Admin.community");
  const params = useParams<{ id: string }>();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const mutation = useAdminCommunityMutation(({ action }: { action: string }) => communityAdminService.moderate("question", params.id, action, reason));
  const act = (action: string) => { if (reason.trim().length < 2) { setMessage(t("reason")); return; } void mutation.mutateAsync({ action }).then(() => setMessage(t("decisionSaved"))).catch(() => setMessage(t("loadError"))); };
  return <PermissionGuard resource="community" action="moderate" fallback={<p className="border border-admin-danger p-5 text-sm text-admin-danger">{t("loadError")}</p>}><div><AdminPageHeader title={t("moderation")} breadcrumbs={[{ label: t("title") }, { label: t("moderation") }]} /><p className="text-sm text-admin-muted">{params.id}</p><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder={t("reasonPlaceholder")} className="mt-5 w-full max-w-xl border border-admin-border bg-admin-canvas px-3 py-2" /><div className="mt-4 flex flex-wrap gap-2">{["approve", "reject", "hide", "restore", "lock", "unlock", "archive", "unarchive"].map((action) => <button key={action} type="button" onClick={() => act(action)} className="min-h-11 border border-admin-border px-4 text-sm">{t(action as "approve")}</button>)}</div>{message ? <p className="mt-3 text-sm text-admin-muted" role="status">{message}</p> : null}</div></PermissionGuard>;
}
