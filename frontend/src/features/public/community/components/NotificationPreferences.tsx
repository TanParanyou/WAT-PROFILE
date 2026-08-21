"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { CommunityNotificationPreferenceKey } from "../types";
import { useCommunityNotificationPreferencesQuery, useUpdateCommunityNotificationPreferences } from "../queries";
import { Check, Mail } from "lucide-react";

const options: Array<{
  key: CommunityNotificationPreferenceKey;
  label:
    | "preferenceAnswer"
    | "preferenceComment"
    | "preferenceAccepted"
    | "preferenceHelpful"
    | "preferenceOfficial"
    | "preferenceApproval"
    | "preferenceRevision"
    | "preferenceModeration";
}> = [
  { key: "answer_created", label: "preferenceAnswer" },
  { key: "comment_created", label: "preferenceComment" },
  { key: "accepted_answer", label: "preferenceAccepted" },
  { key: "helpful_vote", label: "preferenceHelpful" },
  { key: "official_answer", label: "preferenceOfficial" },
  { key: "first_contribution", label: "preferenceApproval" },
  { key: "revision_decision", label: "preferenceRevision" },
  { key: "moderation_decision", label: "preferenceModeration" },
];

export function NotificationPreferences() {
  const t = useTranslations("Community");
  const query = useCommunityNotificationPreferencesQuery(true);
  const mutation = useUpdateCommunityNotificationPreferences();
  const [draft, setDraft] = useState<Record<CommunityNotificationPreferenceKey, boolean> | null>(null);
  const values = draft ?? query.data?.email_preferences ?? null;

  if (query.isLoading || !values) return <p className="text-sm text-site-muted">{t("loadingNotifications")}</p>;
  if (query.isError) return <p role="alert" className="text-sm text-site-danger">{t("notificationsLoadError")}</p>;

  return (
    <section aria-labelledby="community-notification-preferences" className="mt-12 border-t border-site-border pt-8 pb-16">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-site-muted">
        <Mail size={14} />
        <span>Email Notifications</span>
      </div>
      <h2 id="community-notification-preferences" className="mt-1 font-heading text-2xl font-medium text-site-foreground">
        {t("notificationPreferencesTitle")}
      </h2>
      <p className="mt-2 text-sm text-site-muted">{t("notificationPreferencesSubtitle")}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const checked = values[option.key] ?? false;
          return (
            <label
              key={option.key}
              className={`flex min-h-12 cursor-pointer items-center gap-3 border px-4 py-2 text-sm transition-colors ${
                checked
                  ? "border-site-border bg-site-surface/50 text-site-foreground"
                  : "border-site-border/60 bg-site-canvas text-site-body hover:bg-site-surface/30"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  setDraft((current) => ({ ...(current ?? values), [option.key]: event.target.checked }))
                }
                className="size-4 accent-site-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-site-focus"
              />
              <span className="font-medium">{t(option.label)}</span>
            </label>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => void mutation.mutateAsync({ email_preferences: values })}
          className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-action px-6 text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-60"
        >
          {mutation.isPending ? t("saving") : t("savePreferences")}
        </button>
        {mutation.isSuccess ? (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm text-site-accent font-medium">
            <Check size={16} />
            <span>{t("preferencesSaved")}</span>
          </span>
        ) : null}
      </div>
    </section>
  );
}
