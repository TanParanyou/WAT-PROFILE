"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { useCommunityNotificationsQuery, useMarkAllCommunityNotificationsRead, useMarkCommunityNotificationRead } from "../queries";

export function NotificationList() {
  const t = useTranslations("Community");
  const query = useCommunityNotificationsQuery(true);
  const markRead = useMarkCommunityNotificationRead();
  const markAll = useMarkAllCommunityNotificationsRead();

  if (query.isLoading) return <p className="text-sm text-site-muted">{t("loadingNotifications")}</p>;
  if (query.isError || !query.data) return <p role="alert" className="text-sm text-site-danger">{t("notificationsLoadError")}</p>;

  return (
    <section aria-labelledby="community-notifications-list">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p id="community-notifications-list" className="text-sm text-site-muted">{t("unreadNotifications", { count: query.data.unread_count })}</p>
        {query.data.unread_count > 0 ? <button type="button" disabled={markAll.isPending} onClick={() => void markAll.mutateAsync()} className="min-h-11 border border-site-border px-4 text-sm font-semibold disabled:opacity-60">{t("markAllRead")}</button> : null}
      </div>
      {query.data.items.length === 0 ? <p className="mt-6 border border-site-border p-5 text-sm text-site-muted">{t("noNotifications")}</p> : <ul className="mt-5 divide-y divide-site-border border-y border-site-border">{query.data.items.map((notification) => <li key={notification.id} className={`flex flex-wrap items-center justify-between gap-4 py-5 ${notification.read_at ? "" : "bg-site-surface/50"}`}><div className="min-w-0"><p className="font-semibold text-site-foreground">{!notification.read_at ? <span className="mr-2 inline-block size-2 rounded-full bg-site-action align-middle" aria-label={t("unreadLabel")} /> : null}{notificationTitle(t, notification.event_type)}</p><time dateTime={notification.created_at} className="mt-1 block text-xs text-site-muted">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" }).format(new Date(notification.created_at))}</time></div><div className="flex items-center gap-3">{notification.target_type === "question" && notification.target_id ? <Link href={`/community/q/${notification.target_id}/question`} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">{t("viewNotification")}</Link> : null}{!notification.read_at ? <button type="button" disabled={markRead.isPending} onClick={() => void markRead.mutateAsync(notification.id)} className="min-h-11 border border-site-border px-3 text-sm disabled:opacity-60">{t("markRead")}</button> : null}</div></li>)}</ul>}
    </section>
  );
}

function notificationTitle(t: ReturnType<typeof useTranslations<"Community">>, eventType: string) {
  if (eventType === "community.answer.created") return t("notificationAnswer");
  if (eventType === "community.comment.created") return t("notificationComment");
  if (eventType === "community.accepted") return t("notificationAccepted");
  if (eventType === "community.helpful") return t("notificationHelpful");
  if (eventType === "community.official") return t("notificationOfficial");
  if (eventType === "community.approval") return t("notificationApproval");
  if (eventType === "community.revision") return t("notificationRevision");
  return t("notificationModeration");
}
