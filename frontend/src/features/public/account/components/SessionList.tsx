"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { Loader2, AlertCircle, CheckCircle, LogOut, Smartphone, Laptop } from "lucide-react";
import {
  useAccountSessions,
  useRevokeAccountSession,
  useLogoutAllAccounts,
  toAccountQueryError,
} from "@/features/public/account/queries";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { toAccountApiError } from "@/features/public/account/api";

const actionButton =
  "inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-canvas px-4 py-[10px] text-sm font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60";

export function SessionList() {
  const t = useTranslations("Account");
  const { account } = useAccountSession();
  const sessionsQuery = useAccountSessions(Boolean(account));
  const revoke = useRevokeAccountSession();
  const logoutAll = useLogoutAllAccounts();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [revokedId, setRevokedId] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    setFormError(null);
    try {
      await revoke.mutateAsync(id);
      setRevokedId(id);
    } catch (err) {
      setFormError(toAccountApiError(err).message);
    }
  };

  const handleLogoutAll = async () => {
    setFormError(null);
    try {
      await logoutAll.mutateAsync();
    } catch (err) {
      setFormError(toAccountApiError(err).message);
    }
  };

  if (sessionsQuery.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-site-muted">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span>{t("verifyEmail.verifying")}</span>
      </div>
    );
  }

  if (sessionsQuery.isError) {
    const err = toAccountQueryError(sessionsQuery.error);
    return (
      <div
        role="alert"
        className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <span>{err.kind === "not-found" ? t("errors.AUTH_UNKNOWN") : t("google.unexpected")}</span>
      </div>
    );
  }

  const sessions = sessionsQuery.data ?? [];

  return (
    <div className="space-y-6">
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      )}
      {revokedId && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{t("sessions.revoked")}</span>
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="text-sm text-site-muted">{t("sessions.empty")}</p>
      ) : (
        <ul className="divide-y divide-site-border border-y border-site-border">
          {sessions.map((session) => (
            <li key={session.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                {session.user_agent_summary.includes("Mobile") ? (
                  <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-site-muted" aria-hidden />
                ) : (
                  <Laptop className="mt-0.5 h-5 w-5 shrink-0 text-site-muted" aria-hidden />
                )}
                <div className="text-sm">
                  <p className="font-semibold text-site-foreground">
                    {session.user_agent_summary || "—"}
                    {session.current && (
                      <span className="ml-2 rounded-sm bg-site-action px-2 py-0.5 text-xs font-semibold text-site-on-action">
                        {t("sessions.current")}
                      </span>
                    )}
                  </p>
                  <p className="text-site-muted">
                    {session.ip_prefix} · {new Date(session.last_used_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {!session.current && (
                <button
                  type="button"
                  onClick={() => handleRevoke(session.id)}
                  disabled={revoke.isPending}
                  className={actionButton}
                >
                  {t("sessions.revoke")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3">
        {!confirmLogoutAll ? (
          <button type="button" onClick={() => setConfirmLogoutAll(true)} className={actionButton}>
            <LogOut className="h-5 w-5" aria-hidden />
            {t("sessions.logoutAll")}
          </button>
        ) : (
          <div className="space-y-3 rounded-sm border border-site-border bg-site-surface p-4">
            <p className="text-sm text-site-muted">{t("sessions.logoutAllConfirm")}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleLogoutAll}
                disabled={logoutAll.isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-red-700 px-6 py-[13px] font-semibold text-white transition-colors hover:bg-red-800 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
              >
                {logoutAll.isPending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
                {t("sessions.logoutAll")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmLogoutAll(false)}
                className={actionButton}
              >
                {t("sessions.current")}
              </button>
            </div>
          </div>
        )}
        <Link
          href="/account"
          className="inline-flex min-h-11 items-center justify-center gap-2 font-medium text-text-900 underline decoration-primary/40 underline-offset-4"
        >
          {t("account.sessionsLink")}
        </Link>
      </div>
    </div>
  );
}
