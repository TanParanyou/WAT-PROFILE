"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { CommunityNotificationPreferenceKey } from "../types";
import { useCommunityNotificationPreferencesQuery, useUpdateCommunityNotificationPreferences } from "../queries";

const options: Array<{ key: CommunityNotificationPreferenceKey; label: "preferenceAnswer" | "preferenceComment" | "preferenceAccepted" | "preferenceHelpful" | "preferenceOfficial" | "preferenceApproval" | "preferenceRevision" | "preferenceModeration" }> = [
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
    <section aria-labelledby="community-notification-preferences" className="mt-10 border-t border-site-border pt-8">
      <h2 id="community-notification-preferences" className="font-heading text-2xl font-medium">{t("notificationPreferencesTitle")}</h2>
      <p className="mt-2 text-sm text-site-muted">{t("notificationPreferencesSubtitle")}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {options.map((option) => <label key={option.key} className="flex min-h-11 items-center gap-3 border border-site-border px-3 text-sm cursor-pointer"><input type="checkbox" checked={values[option.key]} onChange={(event) => setDraft((current) => ({ ...(current ?? values), [option.key]: event.target.checked }))} className="size-4 accent-site-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-site-focus" /><span>{t(option.label)}</span></label>)}
      </div>
      <div className="mt-5 flex items-center gap-4">
        <button type="button" disabled={mutation.isPending} onClick={() => void mutation.mutateAsync({ email_preferences: values })} className="min-h-11 border border-site-border px-4 text-sm font-semibold disabled:opacity-60">{t("savePreferences")}</button>
        {mutation.isSuccess ? <span role="status" className="text-sm text-site-muted">{t("preferencesSaved")}</span> : null}
      </div>
    </section>
  );
}
