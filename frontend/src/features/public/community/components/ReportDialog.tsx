"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Flag } from "lucide-react";
import { SiteModal } from "@/components/public/modal/SiteModal";
import { toCommunityApiError } from "../api";
import { useCreateCommunityReport } from "../queries";
import type { CommunityReportReason } from "../types";

const reasons: CommunityReportReason[] = ["spam", "harassment", "misinformation", "privacy", "inappropriate", "other"];
const reasonLabels: Record<CommunityReportReason, "reportReasonSpam" | "reportReasonHarassment" | "reportReasonMisinformation" | "reportReasonPrivacy" | "reportReasonInappropriate" | "reportReasonOther"> = {
  spam: "reportReasonSpam",
  harassment: "reportReasonHarassment",
  misinformation: "reportReasonMisinformation",
  privacy: "reportReasonPrivacy",
  inappropriate: "reportReasonInappropriate",
  other: "reportReasonOther",
};

export function ReportDialog({
  target,
  enabled,
}: {
  target: { question_id?: string; answer_id?: string; comment_id?: string };
  enabled: boolean;
}) {
  const t = useTranslations("Community");
  const mutation = useCreateCommunityReport();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<CommunityReportReason>("other");
  const [details, setDetails] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!enabled) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    try {
      await mutation.mutateAsync({ ...target, reason, details: details.trim() || undefined });
      setSuccessMessage(t("reportSubmitted"));
      setDetails("");
      setOpen(false);
    } catch (error: unknown) {
      setErrorMessage(toCommunityApiError(error).message);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => {
          setErrorMessage("");
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-site-muted underline decoration-transparent underline-offset-4 transition-colors hover:text-site-foreground hover:decoration-site-border focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
      >
        <Flag size={13} aria-hidden="true" />
        <span>{t("report")}</span>
      </button>

      {successMessage ? (
        <p className="mt-1 text-xs text-site-muted" role="status">
          {successMessage}
        </p>
      ) : null}

      <SiteModal
        open={open}
        onClose={() => setOpen(false)}
        title={t("reportTitle")}
        tone="neutral"
        size="md"
        busy={mutation.isPending}
      >
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div>
            <label htmlFor="community-report-reason" className="block text-sm font-semibold text-site-foreground">
              {t("reportReason")}
            </label>
            <div className="relative mt-2">
              <select
                id="community-report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value as CommunityReportReason)}
                className="min-h-11 w-full appearance-none border border-site-border bg-site-canvas px-3.5 pr-9 text-sm text-site-foreground outline-none transition-colors focus-visible:border-site-focus focus-visible:ring-2 focus-visible:ring-site-focus/30"
                required
              >
                {reasons.map((value) => (
                  <option key={value} value={value}>
                    {t(reasonLabels[value])}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-site-muted">
                <svg className="size-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="community-report-details" className="block text-sm font-semibold text-site-foreground">
                {t("reportDetails")}
              </label>
              <span className="text-xs text-site-muted">{details.length}/2000</span>
            </div>
            <textarea
              id="community-report-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={2000}
              rows={4}
              className="mt-2 w-full border border-site-border bg-site-canvas p-3 text-sm font-normal text-site-foreground outline-none transition-colors focus-visible:border-site-focus focus-visible:ring-2 focus-visible:ring-site-focus/30"
            />
          </div>

          {errorMessage ? (
            <div className="border border-site-danger/50 bg-site-danger/5 px-3 py-2 text-xs text-site-danger" role="alert">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-site-border pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 border border-site-border bg-site-canvas px-4 text-sm font-semibold text-site-foreground hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
            >
              {t("reportCancel")}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="min-h-11 border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-50"
            >
              {mutation.isPending ? t("saving") : t("reportSubmit")}
            </button>
          </div>
        </form>
      </SiteModal>
    </div>
  );
}
