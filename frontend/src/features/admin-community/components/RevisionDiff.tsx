"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/hooks/useToast";
import { useAdminCommunityMutation } from "../queries";
import { communityAdminService } from "@/services/communityAdminService";
import type { AdminCommunityRevision } from "../types";

export function RevisionDiff({
  revision,
  onDone,
}: {
  revision: AdminCommunityRevision;
  onDone: () => void;
}) {
  const t = useTranslations("Admin.community");
  const locale = useLocale();
  const { toast } = useToast();
  const mutation = useAdminCommunityMutation(
    ({ approve, reason }: { approve: boolean; reason: string }) =>
      communityAdminService.decideRevision(revision.id, approve, reason),
  );
  const [reason, setReason] = useState("");
  const [activeDecision, setActiveDecision] = useState<boolean | null>(null);

  const decide = async (approve: boolean) => {
    if (reason.trim().length < 2) {
      toast.error(t("reason"));
      return;
    }
    setActiveDecision(approve);
    try {
      await mutation.mutateAsync({ approve, reason: reason.trim() });
      toast.success(t("decisionSaved"));
      onDone();
    } catch {
      toast.error(t("actionError"));
    } finally {
      setActiveDecision(null);
    }
  };

  return (
    <article className="border border-admin-border bg-admin-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-admin-border pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-admin-muted">
          {revision.target_type} · ID: {revision.target_id}
        </span>
        <span className="border border-admin-border bg-admin-surface-muted px-2 py-0.5 text-xs text-admin-muted">
          {new Date(revision.created_at).toLocaleString(locale)}
        </span>
      </div>

      {revision.title_after ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="border border-admin-border bg-admin-surface-muted p-3">
            <span className="text-xs font-bold uppercase tracking-wider text-admin-muted">
              {t("before")}
            </span>
            <p className="mt-1 text-sm text-admin-muted">
              {revision.title_before || "—"}
            </p>
          </div>
          <div className="border border-admin-border bg-admin-canvas p-3">
            <span className="text-xs font-bold uppercase tracking-wider text-admin-action">
              {t("after")}
            </span>
            <p className="mt-1 text-sm font-semibold text-admin-foreground">
              {revision.title_after}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="border border-admin-border bg-admin-surface-muted p-4">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-admin-muted">
            {t("before")}
          </span>
          <RichTextContent
            value={revision.body_before}
            locale={locale}
            defaultLocale="th"
            className="max-h-60 overflow-y-auto text-sm leading-relaxed text-admin-muted"
          />
        </div>
        <div className="border border-admin-border bg-admin-canvas p-4">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-admin-action">
            {t("after")}
          </span>
          <RichTextContent
            value={revision.body_after}
            locale={locale}
            defaultLocale="th"
            className="max-h-60 overflow-y-auto text-sm leading-relaxed text-admin-foreground"
          />
        </div>
      </div>

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
            disabled={mutation.isPending}
            onClick={() => void decide(true)}
            className="flex min-h-11 items-center justify-center bg-admin-action px-5 py-2 text-sm font-semibold text-admin-on-action hover:brightness-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            {mutation.isPending && activeDecision === true ? (
              <Loading size="sm" />
            ) : (
              t("approveRevision")
            )}
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => void decide(false)}
            className="flex min-h-11 items-center justify-center border border-admin-danger/50 px-5 py-2 text-sm font-semibold text-admin-danger hover:bg-admin-danger/10 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            {mutation.isPending && activeDecision === false ? (
              <Loading size="sm" />
            ) : (
              t("rejectRevision")
            )}
          </button>
        </PermissionGuard>
      </div>
    </article>
  );
}
