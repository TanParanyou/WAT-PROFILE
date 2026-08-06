"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2 } from "lucide-react";
import { useGoogleAccountLink } from "@/features/public/account/hooks/useGoogleAccountLink";
import { useAccountErrorMessage } from "@/features/public/account/hooks";
import { PasswordInput } from "./PasswordInput";
import type { Account } from "@/features/public/account/types";

const inputBase =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none transition-colors placeholder:text-site-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";
const labelBase = "block text-sm font-semibold text-text-800";
const primaryActionClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";
const secondaryActionClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 border border-site-border bg-site-canvas px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";
const dangerActionClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 border border-red-700 bg-site-canvas px-6 py-[13px] font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export function AccountProviderMethods({ account }: { account: Account }) {
  const t = useTranslations("Account");
  const getErrorMessage = useAccountErrorMessage();
  const {
    status,
    loading,
    redirecting,
    unlinking,
    error,
    requiresReauth,
    startLink,
    retryLink,
    unlink,
    clearError,
  } = useGoogleAccountLink();

  const [reauthPassword, setReauthPassword] = useState("");
  const [unlinkPassword, setUnlinkPassword] = useState("");
  const [confirmingReauth, setConfirmingReauth] = useState(false);
  const [confirmingUnlink, setConfirmingUnlink] = useState(false);

  const hasPassword = account.providers.includes("password");
  const connected = status?.connected ?? account.providers.includes("google");
  const pending = status?.pending ?? false;
  const cooldownSeconds = status?.retry_after_seconds ?? 0;

  const handleStart = async () => {
    setConfirmingReauth(false);
    setReauthPassword("");
    await startLink();
  };

  const handleReauthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirmingReauth(true);
    try {
      await retryLink(reauthPassword);
    } finally {
      setReauthPassword("");
      setConfirmingReauth(false);
    }
  };

  const handleUnlinkSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirmingUnlink(true);
    try {
      await unlink(unlinkPassword);
      setUnlinkPassword("");
    } finally {
      setConfirmingUnlink(false);
    }
  };

  return (
    <section aria-labelledby="account-providers-title" className="space-y-4">
      <h2
        id="account-providers-title"
        className="font-heading text-xl font-bold text-site-foreground"
      >
        {t("account.providersLabel")}
      </h2>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{getErrorMessage(error)}</span>
        </div>
      )}

      {loading ? (
        <p role="status" aria-live="polite" className="text-sm text-site-muted">
          {t("account.loading")}
        </p>
      ) : requiresReauth ? (
        <form className="space-y-4" onSubmit={handleReauthSubmit} noValidate>
          <div className="space-y-1">
            <h3 className="font-heading text-base font-semibold text-site-foreground">
              {t("account.providerReauthTitle")}
            </h3>
            <p className="text-sm text-site-muted">{t("account.providerReauthBody")}</p>
          </div>
          <div>
            <label className={labelBase} htmlFor="provider-reauth-password">
              {t("account.closePasswordLabel")}
            </label>
            <PasswordInput
              id="provider-reauth-password"
              name="password"
              autoComplete="current-password"
              value={reauthPassword}
              onChange={(event) => setReauthPassword(event.target.value)}
              className={inputBase}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" className={primaryActionClass} disabled={confirmingReauth}>
              {confirmingReauth && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
              {t("account.providerReauthTitle")}
            </button>
            <button type="button" className={secondaryActionClass} onClick={clearError}>
              {t("account.cancel")}
            </button>
          </div>
        </form>
      ) : connected ? (
        <div className="space-y-4">
          <p className="text-sm text-site-muted">{t("account.providersConnected")}</p>
          {hasPassword &&
            (confirmingUnlink ? (
              <form className="space-y-4" onSubmit={handleUnlinkSubmit} noValidate>
                <p className="text-sm text-site-muted">{t("account.providerDisconnectConfirm")}</p>
                <div>
                  <label className={labelBase} htmlFor="provider-unlink-password">
                    {t("account.closePasswordLabel")}
                  </label>
                  <PasswordInput
                    id="provider-unlink-password"
                    name="password"
                    autoComplete="current-password"
                    value={unlinkPassword}
                    onChange={(event) => setUnlinkPassword(event.target.value)}
                    className={inputBase}
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="submit" className={dangerActionClass} disabled={unlinking}>
                    {unlinking && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
                    {t("account.providerDisconnect")}
                  </button>
                  <button
                    type="button"
                    className={secondaryActionClass}
                    onClick={() => setConfirmingUnlink(false)}
                  >
                    {t("account.cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className={dangerActionClass}
                onClick={() => setConfirmingUnlink(true)}
              >
                {t("account.providerDisconnect")}
              </button>
            ))}
        </div>
      ) : pending ? (
        <div className="space-y-4">
          <p className="text-sm text-site-muted">{t("account.providerPending")}</p>
          {cooldownSeconds > 0 && (
            <p className="text-sm text-site-muted">
              {t("account.providerCooldown", { seconds: cooldownSeconds })}
            </p>
          )}
          <button
            type="button"
            className={primaryActionClass}
            onClick={handleStart}
            disabled={cooldownSeconds > 0 || redirecting}
          >
            {redirecting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
            {redirecting ? t("google.redirecting") : t("account.providerConnect")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-site-muted">{t("account.providerIntro")}</p>
          <button
            type="button"
            className={primaryActionClass}
            onClick={handleStart}
            disabled={redirecting}
          >
            {redirecting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
            {redirecting ? t("google.redirecting") : t("account.providerConnect")}
          </button>
        </div>
      )}
    </section>
  );
}
