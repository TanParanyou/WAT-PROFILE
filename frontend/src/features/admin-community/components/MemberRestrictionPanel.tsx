"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/hooks/useToast";
import { AlertCircle, UserX, UserCheck, ShieldAlert } from "lucide-react";
import { useAdminCommunityMutation } from "../queries";
import { communityAdminService } from "@/services/communityAdminService";

export function MemberRestrictionPanel() {
  const t = useTranslations("Admin.community");
  const { toast } = useToast();
  const [memberID, setMemberID] = useState("");
  const [reason, setReason] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const mutation = useAdminCommunityMutation(
    ({ action }: { action: "restrict" | "unrestrict" | "ban" }) =>
      communityAdminService.restrictMember(memberID.trim(), action, reason.trim()),
  );

  const submit = async (action: "restrict" | "unrestrict" | "ban") => {
    if (!memberID.trim() || reason.trim().length < 2) {
      toast.error(t("reason"));
      return;
    }
    setActiveAction(action);
    try {
      await mutation.mutateAsync({ action });
      toast.success(t("decisionSaved"));
      setMemberID("");
      setReason("");
    } catch {
      toast.error(t("actionError"));
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("members")}
        breadcrumbs={[
          { label: t("title"), href: "/admin/community" },
          { label: t("members") },
        ]}
      />

      <div className="max-w-2xl border border-admin-border bg-admin-surface p-6 space-y-5">
        {/* Guideline Banner */}
        <div className="flex items-start gap-3 border border-admin-warning/50 bg-admin-warning/10 p-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-admin-warning" />
          <p className="text-xs leading-relaxed text-admin-foreground">
            {t("memberGuideline")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-admin-foreground">
            {t("memberId")} <span className="text-admin-danger">*</span>
            <input
              type="text"
              value={memberID}
              onChange={(event) => setMemberID(event.target.value)}
              placeholder={t("memberIdPlaceholder")}
              className="mt-1.5 min-h-11 w-full border border-admin-border bg-admin-canvas px-3 font-mono text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-admin-foreground">
            {t("reason")} <span className="text-admin-danger">*</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={t("reasonPlaceholder")}
              className="mt-1.5 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
            />
          </label>
        </div>

        <div className="border-t border-admin-border pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <PermissionGuard resource="community" action="restrict_members">
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => void submit("restrict")}
                className="flex min-h-11 items-center gap-2 border border-admin-warning/60 bg-admin-warning/10 px-4 py-2 text-sm font-semibold text-admin-warning hover:bg-admin-warning/20 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
              >
                {mutation.isPending && activeAction === "restrict" ? (
                  <Loading size="sm" />
                ) : (
                  <>
                    <ShieldAlert size={16} />
                    <span>{t("restrict")}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => void submit("unrestrict")}
                className="flex min-h-11 items-center gap-2 border border-admin-border px-4 py-2 text-sm font-semibold text-admin-foreground hover:bg-admin-surface-muted disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
              >
                {mutation.isPending && activeAction === "unrestrict" ? (
                  <Loading size="sm" />
                ) : (
                  <>
                    <UserCheck size={16} />
                    <span>{t("unrestrict")}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => void submit("ban")}
                className="flex min-h-11 items-center gap-2 bg-admin-danger px-5 py-2 text-sm font-semibold text-admin-on-action hover:brightness-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
              >
                {mutation.isPending && activeAction === "ban" ? (
                  <Loading size="sm" />
                ) : (
                  <>
                    <UserX size={16} />
                    <span>{t("ban")}</span>
                  </>
                )}
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>
    </div>
  );
}
