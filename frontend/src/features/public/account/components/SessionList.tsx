"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, CheckCircle, Loader2, LogOut, RefreshCw } from "lucide-react";
import { Link } from "@/navigation";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { toAccountApiError } from "@/features/public/account/api";
import { useAccountErrorMessage } from "@/features/public/account/hooks";
import {
  useAccountSessions,
  useRevokeAccountSession,
} from "@/features/public/account/queries";
import type { AccountSession } from "@/features/public/account/types";
import { SessionCard } from "./SessionCard";

const primaryActionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 bg-site-action px-5 py-2.5 text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60";
const secondaryActionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-canvas px-5 py-2.5 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60";

export function SessionList() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const getErrorMessage = useAccountErrorMessage();
  const {
    status,
    account,
    accountLoading,
    accountError,
    retryAccount,
    logoutAll,
  } = useAccountSession();
  const sessionsQuery = useAccountSessions(status === "authenticated" && Boolean(account));
  const revoke = useRevokeAccountSession();
  const [formError, setFormError] = useState<string | null>(null);
  const [revoked, setRevoked] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const handleRevoke = async (id: string) => {
    setFormError(null);
    setRevoked(false);
    setRevokingId(id);
    try {
      await revoke.mutateAsync(id);
      setRevoked(true);
    } catch (err) {
      const apiError = toAccountApiError(err);
      setFormError(getErrorMessage(apiError));
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    setFormError(null);
    setLoggingOutAll(true);
    try {
      await logoutAll();
    } catch (err) {
      const apiError = toAccountApiError(err);
      setFormError(getErrorMessage(apiError));
    } finally {
      setLoggingOutAll(false);
    }
  };

  const pageHeader = (
    <header className="space-y-2">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-accent">
          {t("sessions.pageEyebrow")}
        </p>
        <div>
          <h2 className="font-heading text-2xl font-bold text-site-foreground sm:text-3xl">
            {t("sessions.title")}
          </h2>
          <p className="mt-2 text-sm text-site-muted">{t("sessions.subtitle")}</p>
        </div>
      </div>
    </header>
  );

  if (status === "loading" || (status === "authenticated" && accountLoading)) {
    return (
      <div className="space-y-8">
        {pageHeader}
        <div role="status" aria-live="polite" className="flex items-center gap-3 border border-site-border bg-site-surface p-5 text-sm text-site-muted">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>{t("account.loading")}</span>
        </div>
      </div>
    );
  }

  if (status === "anonymous") {
    return (
      <div className="space-y-8">
        {pageHeader}
        <section aria-labelledby="sessions-access-title" className="space-y-4 border border-site-border bg-site-surface p-5 sm:p-6">
          <div>
            <h3 id="sessions-access-title" className="font-heading text-xl font-bold text-site-foreground">
              {t("sessions.signInTitle")}
            </h3>
            <p className="mt-2 text-sm text-site-muted">{t("sessions.signInBody")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/account/login" className={primaryActionClass}>
              {t("sessions.signInAction")}
            </Link>
            <Link href="/account/register" className={secondaryActionClass}>
              {t("sessions.registerAction")}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-8">
        {pageHeader}
        <div className="space-y-4">
          <div role={accountError ? "alert" : "status"} className="flex items-start gap-3 border border-site-border bg-site-surface p-4 text-sm text-site-foreground">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-site-accent" aria-hidden="true" />
            <span>{t("account.loadError")}</span>
          </div>
          <button type="button" onClick={() => void retryAccount()} className={primaryActionClass}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("sessions.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (sessionsQuery.isPending) {
    return (
      <div className="space-y-8">
        {pageHeader}
        <div role="status" aria-live="polite" className="flex items-center gap-3 border border-site-border bg-site-surface p-5 text-sm text-site-muted">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>{t("account.loading")}</span>
        </div>
      </div>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <div className="space-y-8">
        {pageHeader}
        <div className="space-y-4">
          <div role="alert" className="flex items-start gap-3 border border-site-border bg-site-surface p-4 text-sm text-site-foreground">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-site-accent" aria-hidden="true" />
            <span>{t("sessions.loadError")}</span>
          </div>
          <button type="button" onClick={() => void sessionsQuery.refetch()} className={primaryActionClass}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("sessions.refresh")}
          </button>
        </div>
      </div>
    );
  }

  const sessions = sortSessions(sessionsQuery.data ?? []);
  const currentSession = sessions.find((session) => session.current);
  const otherSessions = sessions.filter((session) => !session.current);

  return (
    <div className="space-y-8">
      {pageHeader}

      {formError && (
        <div role="alert" className="flex items-start gap-3 border border-site-border bg-site-surface p-4 text-sm text-site-foreground">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-site-accent" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      {revoked && (
        <div role="status" aria-live="polite" className="flex items-start gap-3 border border-site-border bg-site-surface p-4 text-sm text-site-foreground">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-site-accent" aria-hidden="true" />
          <span>{t("sessions.revoked")}</span>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="border border-site-border bg-site-surface p-5 text-sm text-site-muted sm:p-6">
          {t("sessions.empty")}
        </div>
      ) : (
        <div className="space-y-6">
          {currentSession && (
            <section aria-labelledby="current-session-heading" className="space-y-3">
              <div>
                <h3 id="current-session-heading" className="text-sm font-semibold text-site-foreground">
                  {t("sessions.currentDevice")}
                </h3>
                <p className="mt-1 text-sm text-site-muted">{t("sessions.singleSession")}</p>
              </div>
              <SessionCard
                session={currentSession}
                locale={locale}
                isRevoking={false}
                onRevoke={handleRevoke}
              />
            </section>
          )}

          {otherSessions.length > 0 && (
            <section aria-labelledby="other-sessions-heading" className="space-y-3">
              <h3 id="other-sessions-heading" className="text-sm font-semibold text-site-foreground">
                {t("sessions.device")}
              </h3>
              <div className="space-y-4">
                {otherSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    locale={locale}
                    isRevoking={revokingId === session.id}
                    onRevoke={handleRevoke}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {sessions.length > 1 && (
        <section className="space-y-4 border-t border-site-border pt-6" aria-labelledby="logout-all-heading">
          <div>
            <h3 id="logout-all-heading" className="font-semibold text-site-foreground">
              {t("sessions.logoutAll")}
            </h3>
            <p className="mt-1 text-sm text-site-muted">{t("sessions.logoutAllDescription")}</p>
          </div>

          {!confirmLogoutAll ? (
            <button type="button" onClick={() => setConfirmLogoutAll(true)} className={secondaryActionClass}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t("sessions.logoutAll")}
            </button>
          ) : (
            <div className="space-y-3 border border-site-border bg-site-surface p-4 sm:p-5">
              <p className="text-sm text-site-foreground">{t("sessions.logoutAllConfirm")}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleLogoutAll()}
                  disabled={loggingOutAll}
                  className={primaryActionClass}
                >
                  {loggingOutAll && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {t("sessions.logoutAll")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmLogoutAll(false)}
                  disabled={loggingOutAll}
                  className={secondaryActionClass}
                >
                  {t("sessions.cancel")}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function sortSessions(sessions: readonly AccountSession[]): AccountSession[] {
  return [...sessions].sort((left, right) => Number(right.current) - Number(left.current));
}
