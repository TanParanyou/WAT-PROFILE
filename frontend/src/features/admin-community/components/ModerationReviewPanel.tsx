"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/hooks/useToast";
import { useAdminCommunityMutation } from "../queries";
import { communityAdminService } from "@/services/communityAdminService";
import type { AdminCommunityQueueItem } from "../types";

const actionsByTarget: Record<AdminCommunityQueueItem["target_type"], string[]> = {
  question: ["approve", "reject", "hide", "restore", "lock", "unlock", "archive", "unarchive"],
  answer: ["approve", "reject", "hide", "restore", "official"],
  comment: ["approve", "reject", "hide", "restore"],
};

export function ModerationReviewPanel({
  item,
  onDone,
}: {
  item: AdminCommunityQueueItem;
  onDone: () => void;
}) {
  const t = useTranslations("Admin.community");
  const locale = useLocale();
  const { toast } = useToast();
  const mutation = useAdminCommunityMutation(
    ({ action, reason }: { action: string; reason: string }) =>
      communityAdminService.moderate(item.target_type, item.target_id, action, reason),
  );
  const [reason, setReason] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const submit = async (action: string) => {
    if (reason.trim().length < 2) {
      toast.error(t("reason"));
      return;
    }
    setActiveAction(action);
    try {
      await mutation.mutateAsync({ action, reason: reason.trim() });
      toast.success(t("decisionSaved"));
      onDone();
    } catch {
      toast.error(t("actionError"));
    } finally {
      setActiveAction(null);
    }
  };

  const getButtonClass = (action: string) => {
    if (action === "approve" || action === "official" || action === "restore") {
      return "bg-admin-action text-admin-on-action hover:brightness-95";
    }
    if (action === "reject" || action === "hide") {
      return "border border-admin-danger/50 text-admin-danger hover:bg-admin-danger/10";
    }
    return "border border-admin-border text-admin-foreground hover:bg-admin-surface-muted";
  };

  const getTargetTypeLabel = (type: AdminCommunityQueueItem["target_type"]) => {
    switch (type) {
      case "question":
        return t("typeQuestion");
      case "answer":
        return t("typeAnswer");
      case "comment":
        return t("typeComment");
      default:
        return type;
    }
  };

  return (
    <article className="border border-admin-border bg-admin-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-admin-border pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-admin-muted">
            {getTargetTypeLabel(item.target_type)} · ID: {item.target_id}
          </span>
          <h3 className="mt-1 text-base font-semibold text-admin-foreground">
            {item.title || t("items")}
          </h3>
        </div>
        <span className="text-xs text-admin-muted">
          {new Date(item.created_at).toLocaleString(locale)}
        </span>
      </div>

      {item.body ? (
        <div className="mt-4 border border-admin-border bg-admin-canvas p-4">
          <RichTextContent
            value={item.body}
            locale={locale}
            defaultLocale="th"
            className="max-h-56 overflow-y-auto text-sm leading-relaxed text-admin-foreground"
          />
        </div>
      ) : null}

      <div className="mt-4">
        <label className="block text-xs font-semibold text-admin-muted">
          {t("reason")} <span className="text-admin-danger">*</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            maxLength={2000}
            placeholder={t("reasonPlaceholder")}
            className="mt-1 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <PermissionGuard resource="community" action="moderate">
          {actionsByTarget[item.target_type].map((action) => (
            <button
              key={action}
              type="button"
              disabled={mutation.isPending}
              onClick={() => void submit(action)}
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
        </PermissionGuard>
      </div>
    </article>
  );
}
