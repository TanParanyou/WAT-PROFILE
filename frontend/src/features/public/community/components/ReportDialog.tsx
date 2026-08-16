"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
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
  const [message, setMessage] = useState("");

  if (!enabled) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    try {
      await mutation.mutateAsync({ ...target, reason, details: details.trim() || undefined });
      setMessage(t("reportSubmitted"));
      setDetails("");
      setOpen(false);
    } catch (error: unknown) {
      setMessage(toCommunityApiError(error).message);
    }
  };

  return (
    <div className="mt-4">
      <button type="button" onClick={() => setOpen((value) => !value)} className="text-sm font-semibold text-site-muted underline underline-offset-4 hover:text-site-foreground">
        {t("report")}
      </button>
      {message ? <p className="mt-2 text-sm text-site-muted" role="status">{message}</p> : null}
      {open ? (
        <form onSubmit={submit} className="mt-3 max-w-xl border border-site-border bg-site-surface p-4">
          <h3 className="font-heading text-xl font-medium text-site-foreground">{t("reportTitle")}</h3>
          <label className="mt-4 block text-sm font-semibold text-site-foreground">
            {t("reportReason")}
            <select value={reason} onChange={(event) => setReason(event.target.value as CommunityReportReason)} className="mt-2 min-h-10 w-full border border-site-border bg-site-canvas px-3" required>
              {reasons.map((value) => <option key={value} value={value}>{t(reasonLabels[value])}</option>)}
            </select>
          </label>
          <label className="mt-4 block text-sm font-semibold text-site-foreground">
            {t("reportDetails")}
            <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={2000} rows={4} className="mt-2 w-full border border-site-border bg-site-canvas px-3 py-2 font-normal" />
          </label>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={mutation.isPending} className="min-h-10 bg-site-action px-4 text-sm font-semibold text-site-on-action disabled:opacity-50">{t("reportSubmit")}</button>
            <button type="button" onClick={() => setOpen(false)} className="min-h-10 border border-site-border px-4 text-sm font-semibold">{t("reportCancel")}</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
