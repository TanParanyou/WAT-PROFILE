"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Laptop, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import type { AccountSession } from "@/features/public/account/types";

export interface SessionCardProps {
  session: AccountSession;
  locale: string;
  isRevoking: boolean;
  onRevoke: (id: string) => void;
}

const controlClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-canvas px-4 py-2.5 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60";

export function SessionCard({ session, locale, isRevoking, onRevoke }: SessionCardProps) {
  const t = useTranslations("Account");
  const [confirming, setConfirming] = useState(false);
  const DeviceIcon = session.user_agent_summary.includes("Mobile") ? Smartphone : Laptop;
  const lastActive = formatTimestamp(session.last_used_at, locale);
  const title = session.user_agent_summary || t("sessions.device");

  const handleRevoke = () => {
    setConfirming(false);
    onRevoke(session.id);
  };

  return (
    <article
      aria-labelledby={`session-${session.id}-title`}
      aria-busy={isRevoking}
      className={`border p-4 transition-colors sm:p-5 ${
        session.current
          ? "border-site-action bg-site-surface"
          : "border-site-border bg-site-canvas"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center border ${
            session.current
              ? "border-site-action bg-site-canvas text-site-action"
              : "border-site-border bg-site-surface text-site-muted"
          }`}
        >
          <DeviceIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
            <h2
              id={`session-${session.id}-title`}
              className="min-w-0 flex-1 break-words font-semibold text-site-foreground"
            >
              {title}
            </h2>
            {session.current && (
              <span className="inline-flex min-h-7 shrink-0 items-center gap-1 border border-site-action px-2 py-1 text-xs font-semibold text-site-action">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {t("sessions.currentDevice")}
              </span>
            )}
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-site-muted">
                {t("sessions.lastActive")}
              </dt>
              <dd className="mt-1 text-site-foreground">{lastActive}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-site-muted">
                {t("sessions.ipAddress")}
              </dt>
              <dd className="mt-1 break-words text-site-foreground">{session.ip_prefix || "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {!session.current && (
        <div className="mt-5 border-t border-site-divider pt-4">
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={isRevoking}
              className={controlClass}
            >
              {t("sessions.revoke")}
            </button>
          ) : (
            <div className="space-y-3" role="group" aria-label={t("sessions.revokeConfirm")}>
              <p className="text-sm text-site-muted">{t("sessions.revokeConfirm")}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  className="inline-flex min-h-11 items-center justify-center gap-2 bg-site-action px-4 py-2.5 text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRevoking && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {t("sessions.revoke")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={isRevoking}
                  className={controlClass}
                >
                  {t("sessions.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function formatTimestamp(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
