"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/hooks/useToast";
import { useAdminCommunityMutation } from "@/features/admin-community/queries";
import { communityAdminService } from "@/services/communityAdminService";

const actions = [
  "approve",
  "reject",
  "hide",
  "restore",
  "lock",
  "unlock",
  "archive",
  "unarchive",
] as const;

export default function AdminCommunityQuestionPage() {
  const t = useTranslations("Admin.community");
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const [reason, setReason] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const mutation = useAdminCommunityMutation(
    ({ action }: { action: string }) =>
      communityAdminService.moderate("question", params.id, action, reason.trim()),
  );

  const act = async (action: string) => {
    if (reason.trim().length < 2) {
      toast.error(t("reason"));
      return;
    }
    setActiveAction(action);
    try {
      await mutation.mutateAsync({ action });
      toast.success(t("decisionSaved"));
    } catch {
      toast.error(t("actionError"));
    } finally {
      setActiveAction(null);
    }
  };

  const getButtonClass = (action: string) => {
    if (action === "approve" || action === "restore") {
      return "bg-admin-action text-admin-on-action hover:brightness-95";
    }
    if (action === "reject" || action === "hide") {
      return "border border-admin-danger/50 text-admin-danger hover:bg-admin-danger/10";
    }
    return "border border-admin-border text-admin-foreground hover:bg-admin-surface-muted";
  };

  return (
    <PermissionGuard
      resource="community"
      action="moderate"
      fallback={
        <p className="border border-admin-danger p-5 text-sm text-admin-danger">
          {t("loadError")}
        </p>
      }
    >
      <div className="space-y-6">
        <AdminPageHeader
          title={t("moderation")}
          breadcrumbs={[
            { label: t("title"), href: "/admin/community" },
            { label: t("queue"), href: "/admin/community/moderation" },
            { label: t("moderation") },
          ]}
        />

        <div className="max-w-2xl border border-admin-border bg-admin-surface p-6 space-y-4">
          <div className="border-b border-admin-border pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-admin-muted">
              {t("questionId")}
            </span>
            <p className="font-mono text-sm text-admin-foreground">
              {params.id}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-foreground">
              {t("reason")} <span className="text-admin-danger">*</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={t("reasonPlaceholder")}
                className="mt-1.5 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
              />
            </label>
          </div>

          <div className="border-t border-admin-border pt-4">
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => void act(action)}
                  className={`flex min-h-11 items-center justify-center px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus ${getButtonClass(
                    action,
                  )}`}
                >
                  {mutation.isPending && activeAction === action ? (
                    <Loading size="sm" />
                  ) : (
                    t(action as "approve")
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
