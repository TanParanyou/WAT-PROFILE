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
import { normalizeAccountEmail, validatePassword } from "../validation";
import type { AccountApiError } from "../types";

const inputClass =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none focus-visible:outline-3 focus-visible:outline-site-focus";
const actionClass =
  "inline-flex min-h-11 items-center gap-2 px-5 py-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60";
const invalidInputClass = "border-red-700 focus-visible:outline-red-700";

type CredentialField = "currentPassword" | "newPassword" | "newEmail";
type CredentialFieldErrors = Partial<Record<CredentialField, string>>;
type CredentialSection = "password" | "email" | "provider" | null;

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
  const [noticeSection, setNoticeSection] = useState<CredentialSection>(null);
  const [fieldErrors, setFieldErrors] = useState<CredentialFieldErrors>({});
  const googleOnly = !account?.providers.includes("password");

  const focusField = (field: CredentialField) => {
    const fieldIds: Record<CredentialField, string> = {
      currentPassword: "credential-current",
      newPassword: "credential-new",
      newEmail: "credential-email",
    };
    requestAnimationFrame(() => document.getElementById(fieldIds[field])?.focus());
  };

  const clearFieldError = (field: CredentialField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const applyApiError = (requestError: AccountApiError, section: Exclude<CredentialSection, null>) => {
    const mapped: CredentialFieldErrors = {};
    for (const fieldError of requestError.fieldErrors) {
      if (fieldError.field === "current_password") mapped.currentPassword = fieldError.message;
      if (fieldError.field === "password" || fieldError.field === "new_password") {
        mapped.newPassword = fieldError.message;
      }
      if (fieldError.field === "email" || fieldError.field === "new_email") {
        mapped.newEmail = fieldError.field === "new_email" ? t("validation.emailDifferent") : fieldError.message;
      }
    }
    const firstField = (Object.keys(mapped) as CredentialField[])[0];
    setFieldErrors(mapped);
    if (firstField) {
      setError(null);
      setNoticeSection(null);
      focusField(firstField);
    } else {
      setError(getError(requestError));
      setNoticeSection(section);
    }
  };

  const validatePasswordForm = (): CredentialFieldErrors => {
    const next: CredentialFieldErrors = {};
    if (!googleOnly && !currentPassword) next.currentPassword = t("validation.passwordRequired");
    const passwordError = validatePassword(newPassword);
    if (passwordError) next.newPassword = t(`validation.${passwordError}`);
    return next;
  };

  const validateEmailForm = (): CredentialFieldErrors => {
    const next: CredentialFieldErrors = {};
    if (!googleOnly && !currentPassword) next.currentPassword = t("validation.passwordRequired");
    const normalized = normalizeAccountEmail(newEmail);
    if (!normalized) next.newEmail = t("validation.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) next.newEmail = t("validation.emailInvalid");
    return next;
  };

  const reauthenticateWithGoogle = async () => {
    setError(null);
    setNoticeSection("provider");
    try {
      const url = await startGoogle(locale, "/account?tab=security");
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
    setNoticeSection(null);
    const localErrors = validatePasswordForm();
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      focusField((Object.keys(localErrors) as CredentialField[])[0]);
      setBusy(false);
      return;
    }
    setFieldErrors({});
    try {
      await changePasswordAccount(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setMessage(t("account.passwordChanged"));
      setNoticeSection("password");
    } catch (requestError) {
      applyApiError(toAccountApiError(requestError), "password");
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    setNoticeSection(null);
    const localErrors = validateEmailForm();
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      focusField((Object.keys(localErrors) as CredentialField[])[0]);
      setBusy(false);
      return;
    }
    setFieldErrors({});
    try {
      await requestEmailChange(newEmail, currentPassword, locale);
      setMessage(t("account.emailConfirmationSent"));
      setNoticeSection("email");
    } catch (requestError) {
      applyApiError(toAccountApiError(requestError), "email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-8 border-t border-site-border pt-6" aria-labelledby="account-credentials-title">
      <h2 id="account-credentials-title" className="font-heading text-xl font-bold text-site-foreground">
        {t("account.credentialsTitle")}
      </h2>

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
          {noticeSection === "provider" && error && (
            <p role="alert" aria-live="polite" className="flex items-center gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-5 w-5" aria-hidden />
              {error}
            </p>
          )}
        </div>
      )}

      <form className="space-y-4" onSubmit={submitPassword} noValidate>
        <h3 className="font-semibold">{t("account.passwordTitle")}</h3>
        {noticeSection === "password" && error && (
          <p role="alert" aria-live="polite" className="flex items-center gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5" aria-hidden />
            {error}
          </p>
        )}
        {noticeSection === "password" && message && (
          <p role="status" aria-live="polite" className="flex items-center gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle className="h-5 w-5" aria-hidden />
            {message}
          </p>
        )}
        <div>
          <label className="block text-sm font-semibold" htmlFor="credential-current">{t("account.currentPasswordLabel")}</label>
          <PasswordInput
            id="credential-current"
            className={`${inputClass} ${fieldErrors.currentPassword ? invalidInputClass : ""}`}
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
              clearFieldError("currentPassword");
            }}
            autoComplete="current-password"
            aria-invalid={fieldErrors.currentPassword ? true : undefined}
            aria-describedby={fieldErrors.currentPassword ? "credential-current-error" : undefined}
          />
          {fieldErrors.currentPassword && <p id="credential-current-error" role="alert" className="mt-1 text-sm text-red-700">{fieldErrors.currentPassword}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="credential-new">{t("account.newPasswordLabel")}</label>
          <PasswordInput
            id="credential-new"
            className={`${inputClass} ${fieldErrors.newPassword ? invalidInputClass : ""}`}
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              clearFieldError("newPassword");
            }}
            autoComplete="new-password"
            aria-invalid={fieldErrors.newPassword ? true : undefined}
            aria-describedby={fieldErrors.newPassword ? "credential-new-error" : undefined}
          />
          {fieldErrors.newPassword && <p id="credential-new-error" role="alert" className="mt-1 text-sm text-red-700">{fieldErrors.newPassword}</p>}
        </div>
        <button type="submit" disabled={busy} className={`${actionClass} bg-site-action text-site-on-action`}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t("account.changePassword")}
        </button>
      </form>

      <form className="space-y-4" onSubmit={submitEmail} noValidate>
        <h3 className="font-semibold">{t("account.emailChangeTitle")}</h3>
        {noticeSection === "email" && error && (
          <p role="alert" aria-live="polite" className="flex items-center gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5" aria-hidden />
            {error}
          </p>
        )}
        {noticeSection === "email" && message && (
          <p role="status" aria-live="polite" className="flex items-center gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle className="h-5 w-5" aria-hidden />
            {message}
          </p>
        )}
        <div>
          <label className="block text-sm font-semibold" htmlFor="credential-email">{t("account.newEmailLabel")}</label>
          <input
            id="credential-email"
            type="email"
            className={`${inputClass} ${fieldErrors.newEmail ? invalidInputClass : ""}`}
            value={newEmail}
            onChange={(event) => {
              setNewEmail(event.target.value);
              clearFieldError("newEmail");
            }}
            autoComplete="email"
            aria-invalid={fieldErrors.newEmail ? true : undefined}
            aria-describedby={fieldErrors.newEmail ? "credential-email-error" : undefined}
          />
          {fieldErrors.newEmail && <p id="credential-email-error" role="alert" className="mt-1 text-sm text-red-700">{fieldErrors.newEmail}</p>}
        </div>
        <button type="submit" disabled={busy} className={`${actionClass} border border-site-border`}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t("account.requestEmailChange")}
        </button>
      </form>
    </section>
  );
}
