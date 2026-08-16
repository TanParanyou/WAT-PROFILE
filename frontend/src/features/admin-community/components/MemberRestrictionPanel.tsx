"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { useAdminCommunityMutation } from "../queries";
import { communityAdminService } from "@/services/communityAdminService";

export function MemberRestrictionPanel() {
  const t = useTranslations("Admin.community");
  const [memberID, setMemberID] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const mutation = useAdminCommunityMutation(({ action }: { action: "restrict" | "unrestrict" | "ban" }) => communityAdminService.restrictMember(memberID, action, reason));
  const submit = (action: "restrict" | "unrestrict" | "ban") => { if (!memberID || reason.trim().length < 2) { setMessage(t("reason")); return; } setMessage(""); void mutation.mutateAsync({ action }).then(() => setMessage(t("decisionSaved"))).catch(() => setMessage(t("loadError"))); };
  return <div><AdminPageHeader title={t("members")} breadcrumbs={[{ label: t("title") }, { label: t("members") }]} /><div className="max-w-xl border border-admin-border bg-admin-surface p-5"><label className="block text-sm">Member user ID<input value={memberID} onChange={(event) => setMemberID(event.target.value)} className="mt-1 min-h-11 w-full border border-admin-border bg-admin-canvas px-3" /></label><label className="mt-4 block text-sm">{t("reason")}<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder={t("reasonPlaceholder")} className="mt-1 w-full border border-admin-border bg-admin-canvas px-3 py-2" /></label><div className="mt-4 flex flex-wrap gap-2"><PermissionGuard resource="community" action="restrict_members"><button type="button" onClick={() => submit("restrict")} className="min-h-11 border border-admin-border px-4 text-sm">{t("restrict")}</button><button type="button" onClick={() => submit("unrestrict")} className="min-h-11 border border-admin-border px-4 text-sm">{t("unrestrict")}</button><button type="button" onClick={() => submit("ban")} className="min-h-11 bg-admin-danger px-4 text-sm font-semibold text-admin-on-action">{t("ban")}</button></PermissionGuard></div>{message ? <p className="mt-3 text-sm text-admin-muted" role="status">{message}</p> : null}</div></div>;
}
