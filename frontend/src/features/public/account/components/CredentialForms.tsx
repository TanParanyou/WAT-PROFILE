"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import {
  changePasswordAccount,
  requestEmailChange,
  startGoogle,
  toAccountApiError,
} from "../api";
import { useAccountSession } from "../AccountSessionProvider";
import { useAccountErrorMessage } from "../hooks";
import { useGoogleRedirect } from "../hooks/useGoogleRedirect";
import { PasswordInput } from "./PasswordInput";

const inputClass =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none focus-visible:outline-3 focus-visible:outline-site-focus";
const actionClass =
  "inline-flex min-h-11 items-center gap-2 px-5 py-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60";

export function CredentialForms() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const getError = useAccountErrorMessage();
  const { account } = useAccountSession();
  const { redirecting, markRedirecting } = useGoogleRedirect();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState(account?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const googleOnly = !account?.providers.includes("password");

  const reauthenticateWithGoogle = async () => {
    setError(null);
    try {
      const url = await startGoogle(locale, "/account");
      markRedirecting();
      window.location.assign(url);
    } catch (requestError) {
      setError(getError(toAccountApiError(requestError)));
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await changePasswordAccount(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setMessage(t("account.passwordChanged"));
    } catch (requestError) {
      setError(getError(toAccountApiError(requestError)));
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await requestEmailChange(newEmail, currentPassword, locale);
      setMessage(t("account.emailConfirmationSent"));
    } catch (requestError) {
      setError(getError(toAccountApiError(requestError)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-8 border-t border-site-border pt-6" aria-labelledby="account-credentials-title">
      <h2 id="account-credentials-title" className="font-heading text-xl font-bold text-site-foreground">
        {t("account.credentialsTitle")}
      </h2>

      {error && (
        <p role="alert" className="flex items-center gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" aria-hidden />
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="flex items-center gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle className="h-5 w-5" aria-hidden />
          {message}
        </p>
      )}

      {googleOnly && (
        <div className="space-y-3 border border-site-border bg-site-surface p-4">
          <h3 className="font-semibold">{t("account.googleCredentialReauthTitle")}</h3>
          <p className="text-sm text-site-muted">{t("account.googleCredentialReauthBody")}</p>
          <button
            type="button"
            disabled={redirecting}
            onClick={() => void reauthenticateWithGoogle()}
            className={`${actionClass} bg-site-action text-site-on-action`}
          >
            {redirecting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {redirecting ? t("google.redirecting") : t("account.googleCredentialReauthAction")}
          </button>
        </div>
      )}

      <form className="space-y-4" onSubmit={submitPassword} noValidate>
        <h3 className="font-semibold">{t("account.passwordTitle")}</h3>
        <div>
          <label htmlFor="credential-current">{t("account.currentPasswordLabel")}</label>
          <PasswordInput
            id="credential-current"
            className={inputClass}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div>
          <label htmlFor="credential-new">{t("account.newPasswordLabel")}</label>
          <PasswordInput
            id="credential-new"
            className={inputClass}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" disabled={busy} className={`${actionClass} bg-site-action text-site-on-action`}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t("account.changePassword")}
        </button>
      </form>

      <form className="space-y-4" onSubmit={submitEmail} noValidate>
        <h3 className="font-semibold">{t("account.emailChangeTitle")}</h3>
        <div>
          <label htmlFor="credential-email">{t("account.newEmailLabel")}</label>
          <input
            id="credential-email"
            type="email"
            className={inputClass}
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            autoComplete="email"
          />
        </div>
        <button type="submit" disabled={busy} className={`${actionClass} border border-site-border`}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t("account.requestEmailChange")}
        </button>
      </form>
    </section>
  );
}
