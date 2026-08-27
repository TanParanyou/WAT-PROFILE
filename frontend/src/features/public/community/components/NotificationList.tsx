"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { useCommunityNotificationsQuery, useMarkAllCommunityNotificationsRead, useMarkCommunityNotificationRead } from "../queries";
import { Check, CheckCircle2, MessageSquare, ShieldCheck, ThumbsUp, AlertCircle, FileEdit } from "lucide-react";
import { formatDateTimeWithRelative } from "@/utils/formatters";

export function NotificationList() {
  const t = useTranslations("Community");
  const locale = useLocale();
  const query = useCommunityNotificationsQuery(true);
  const markRead = useMarkCommunityNotificationRead();
  const markAll = useMarkAllCommunityNotificationsRead();

  if (query.isLoading) {
    return (
      <div className="space-y-3 py-4" aria-label={t("loadingNotifications")}>
        <div className="h-16 animate-pulse border border-site-border bg-site-surface" />
        <div className="h-16 animate-pulse border border-site-border bg-site-surface" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <p role="alert" className="text-sm text-site-danger">{t("notificationsLoadError")}</p>;
  }

  return (
    <section aria-labelledby="community-notifications-list">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-site-border pb-4">
        <p id="community-notifications-list" className="text-sm font-medium text-site-foreground">
          {t("unreadNotifications", { count: query.data.unread_count })}
        </p>
        {query.data.unread_count > 0 ? (
          <button
            type="button"
            disabled={markAll.isPending}
            onClick={() => void markAll.mutateAsync()}
            className="inline-flex min-h-10 items-center gap-1.5 border border-site-border bg-site-canvas px-3.5 py-1.5 text-xs font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-60"
          >
            <Check size={14} />
            <span>{t("markAllAsRead")}</span>
          </button>
        ) : null}
      </div>

      {query.data.items.length === 0 ? (
        <p className="mt-6 border border-site-border bg-site-surface/40 p-6 text-center text-sm text-site-muted">
          {t("noNotifications")}
        </p>
      ) : (
        <div className="divide-y divide-site-border border-b border-site-border" role="list">
          {query.data.items.map((notification) => {
            const isUnread = !notification.read_at;
            return (
              <article
                key={notification.id}
                role="listitem"
                className={`flex flex-col gap-3 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                  isUnread ? "bg-site-surface/30 px-3 -mx-3 border-l-2 border-site-accent" : "bg-site-canvas opacity-80"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0 text-site-muted">
                    {getNotificationIcon(notification.event_type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-site-foreground">
                      {notificationTitle(t, notification.event_type)}
                    </p>
                    <time dateTime={notification.created_at} className="mt-1 block text-xs text-site-muted">
                      {formatDateTimeWithRelative(notification.created_at, locale)}
                    </time>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {notification.target_type === "question" && notification.target_id ? (
                    <Link
                      href={`/community/q/${notification.target_id}/view`}
                      className="inline-flex min-h-10 items-center border border-site-border bg-site-canvas px-3.5 py-1.5 text-xs font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
                    >
                      {t("viewNotification")}
                    </Link>
                  ) : null}
                  {isUnread ? (
                    <button
                      type="button"
                      disabled={markRead.isPending}
                      onClick={() => void markRead.mutateAsync(notification.id)}
                      className="inline-flex min-h-10 items-center border border-site-border/60 bg-site-canvas px-3 py-1.5 text-xs text-site-muted transition-colors hover:border-site-border hover:text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-60"
                    >
                      {t("markRead")}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getNotificationIcon(eventType: string) {
  if (eventType === "community.answer.created") return <MessageSquare size={16} className="text-site-foreground" />;
  if (eventType === "community.comment.created") return <MessageSquare size={16} className="text-site-muted" />;
  if (eventType === "community.accepted") return <CheckCircle2 size={16} className="text-site-action" />;
  if (eventType === "community.helpful") return <ThumbsUp size={16} className="text-site-accent" />;
  if (eventType === "community.official") return <ShieldCheck size={16} className="text-site-accent" />;
  if (eventType === "community.approval") return <CheckCircle2 size={16} className="text-site-accent" />;
  if (eventType === "community.revision") return <FileEdit size={16} className="text-site-foreground" />;
  return <AlertCircle size={16} className="text-site-muted" />;
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
