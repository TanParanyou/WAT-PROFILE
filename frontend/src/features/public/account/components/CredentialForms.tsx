"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  KeyRound,
  Loader2,
} from "lucide-react";
import {
  changePasswordAccount,
  requestEmailChange,
  toAccountApiError,
} from "../api";
import { useAccountSession } from "../AccountSessionProvider";
import { useAccountErrorMessage } from "../hooks";
import { useAccountReauth } from "../hooks/useAccountReauth";
import { AccountReauthError } from "../reauth/reauth-types";
import type { ReauthResult } from "../reauth/reauth-types";
import { accountKeys } from "../queries";
import { PasswordInput } from "./PasswordInput";
import { normalizeAccountEmail, validatePassword } from "../validation";
import type { AccountApiError } from "../types";

const inputClass =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none focus-visible:outline-3 focus-visible:outline-site-focus";
const actionClass =
  "inline-flex min-h-11 items-center gap-2 px-5 py-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60";
const invalidInputClass = "border-red-700 focus-visible:outline-red-700";

type CredentialField = "newPassword" | "newEmail";
type CredentialFieldErrors = Partial<Record<CredentialField, string>>;
type CredentialSection = "password" | "email";

interface CredentialAccordionItemProps {
  id: CredentialSection;
  title: string;
  summary: string;
  badge?: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function CredentialAccordionItem({
  id,
  title,
  summary,
  badge,
  expanded,
  onToggle,
  children,
}: CredentialAccordionItemProps) {
  const headingId = `account-credentials-${id}-toggle`;
  const panelId = `account-credentials-${id}-panel`;

  return (
    <section className="border border-site-border" aria-labelledby={headingId}>
      <h3 id={headingId}>
        <button
          type="button"
          className={`flex min-h-16 w-full items-center justify-between gap-4 text-left focus-visible:outline-3 focus-visible:outline-site-focus ${
            expanded
              ? "border-2 border-site-accent bg-site-surface"
              : "border border-site-border bg-site-canvas"
          }`}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="min-w-0 px-4 py-3">
            <span className="flex flex-wrap items-center gap-2 font-semibold text-site-foreground">
              {title}
              {badge && (
                <span className="border border-site-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-site-accent">
                  {badge}
                </span>
              )}
            </span>
            <span className="mt-1 block text-sm font-normal text-site-muted">
              {summary}
            </span>
          </span>
          <span className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center border border-site-border bg-site-canvas">
            <ChevronDown
              className={`h-5 w-5 text-site-muted transition-transform duration-150 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </span>
        </button>
      </h3>
      <div id={panelId} hidden={!expanded} aria-labelledby={headingId}>
        <div className="border-t-2 border-site-accent p-4 sm:p-6">
          {children}
        </div>
      </div>
    </section>
  );
}

interface PasswordChangeFormProps {
  requireRecentAuth: (options: {
    reason: "change_password";
  }) => Promise<ReauthResult>;
}

function PasswordChangeForm({ requireRecentAuth }: PasswordChangeFormProps) {
  const t = useTranslations("Account");
  const getError = useAccountErrorMessage();
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CredentialFieldErrors>({});

  const focusField = () => {
    requestAnimationFrame(() =>
      document.getElementById("password-change-new-password")?.focus(),
    );
  };

  const clearFieldError = () => {
    setFieldErrors((current) => {
      if (!current.newPassword) return current;
      const next = { ...current };
      delete next.newPassword;
      return next;
    });
  };

  const applyApiError = (requestError: AccountApiError) => {
    const mapped: CredentialFieldErrors = {};
    for (const fieldError of requestError.fieldErrors) {
      if (
        fieldError.field === "password" ||
        fieldError.field === "new_password"
      ) {
        mapped.newPassword = fieldError.message;
      }
    }
    setFieldErrors(mapped);
    if (mapped.newPassword) {
      setError(null);
      focusField();
    } else {
      setError(getError(requestError));
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setFieldErrors({ newPassword: t("validation." + passwordError) });
      focusField();
      setBusy(false);
      return;
    }

    setFieldErrors({});
    try {
      await requireRecentAuth({ reason: "change_password" });
      await changePasswordAccount(newPassword);
      await queryClient.invalidateQueries({ queryKey: accountKeys.current() });
      setNewPassword("");
      setMessage(t("account.passwordChanged"));
    } catch (requestError) {
      if (
        requestError instanceof AccountReauthError &&
        requestError.code === "AUTH_REAUTH_CANCELLED"
      )
        return;
      applyApiError(toAccountApiError(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          <CheckCircle className="h-5 w-5" aria-hidden />
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="h-5 w-5" aria-hidden />
          {error}
        </p>
      )}
      <form className="space-y-4" onSubmit={submitPassword} noValidate>
        <div>
          <label
            className="block text-sm font-semibold"
            htmlFor="password-change-new-password"
          >
            {t("account.newPasswordLabel")}
          </label>
          <PasswordInput
            id="password-change-new-password"
            className={
              inputClass +
              (fieldErrors.newPassword ? " " + invalidInputClass : "")
            }
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              clearFieldError();
            }}
            autoComplete="new-password"
            aria-invalid={fieldErrors.newPassword ? true : undefined}
            aria-describedby={
              fieldErrors.newPassword
                ? "password-change-new-password-error"
                : undefined
            }
          />
          {fieldErrors.newPassword && (
            <p
              id="password-change-new-password-error"
              role="alert"
              className="mt-1 text-sm text-red-700"
            >
              {fieldErrors.newPassword}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={busy}
          className={actionClass + " bg-site-action text-site-on-action"}
        >
          {busy && (
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden
            />
          )}
          {t("account.changePassword")}
        </button>
      </form>
    </div>
  );
}

interface EmailChangeFormProps {
  locale: string;
  requireRecentAuth: (options: {
    reason: "change_email";
  }) => Promise<ReauthResult>;
}

function EmailChangeForm({ locale, requireRecentAuth }: EmailChangeFormProps) {
  const t = useTranslations("Account");
  const getError = useAccountErrorMessage();
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CredentialFieldErrors>({});

  const focusField = () => {
    requestAnimationFrame(() =>
      document.getElementById("email-change-new-email")?.focus(),
    );
  };

  const clearFieldError = () => {
    setFieldErrors((current) => {
      if (!current.newEmail) return current;
      const next = { ...current };
      delete next.newEmail;
      return next;
    });
  };

  const applyApiError = (requestError: AccountApiError) => {
    const mapped: CredentialFieldErrors = {};
    if (requestError.code === "AUTH_EMAIL_ALREADY_REGISTERED")
      mapped.newEmail = getError(requestError);
    for (const fieldError of requestError.fieldErrors) {
      if (fieldError.field === "email" || fieldError.field === "new_email") {
        mapped.newEmail =
          fieldError.field === "new_email"
            ? t("validation.emailDifferent")
            : fieldError.message;
      }
    }
    setFieldErrors(mapped);
    if (mapped.newEmail) {
      setError(null);
      focusField();
    } else {
      setError(getError(requestError));
    }
  };

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const localErrors: CredentialFieldErrors = {};
    const normalized = normalizeAccountEmail(newEmail);
    if (!normalized) localErrors.newEmail = t("validation.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
      localErrors.newEmail = t("validation.emailInvalid");
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      focusField();
      setBusy(false);
      return;
    }
    setFieldErrors({});
    try {
      await requireRecentAuth({ reason: "change_email" });
      await requestEmailChange(normalized, locale);
      setNewEmail("");
      setMessage(t("account.emailConfirmationSent"));
    } catch (requestError) {
      if (
        requestError instanceof AccountReauthError &&
        requestError.code === "AUTH_REAUTH_CANCELLED"
      )
        return;
      applyApiError(toAccountApiError(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">
              {t("account.emailConfirmationTitle")}
            </p>
            <p>{message}</p>
          </div>
        </div>
      )}
      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="h-5 w-5" aria-hidden />
          {error}
        </p>
      )}
      <form className="space-y-4" onSubmit={submitEmail} noValidate>
        <div>
          <label
            className="block text-sm font-semibold"
            htmlFor="email-change-new-email"
          >
            {t("account.newEmailLabel")}
          </label>
          <input
            id="email-change-new-email"
            type="email"
            className={
              inputClass + (fieldErrors.newEmail ? " " + invalidInputClass : "")
            }
            value={newEmail}
            onChange={(event) => {
              setNewEmail(event.target.value);
              clearFieldError();
            }}
            autoComplete="email"
            aria-invalid={fieldErrors.newEmail ? true : undefined}
            aria-describedby={
              fieldErrors.newEmail ? "email-change-new-email-error" : undefined
            }
          />
          {fieldErrors.newEmail && (
            <p
              id="email-change-new-email-error"
              role="alert"
              className="mt-1 text-sm text-red-700"
            >
              {fieldErrors.newEmail}
            </p>
          )}
        </div>
        <p className="border-l-2 border-site-accent pl-3 text-sm text-site-muted">
          {t("account.emailVerificationHint")}
        </p>
        <button
          type="submit"
          disabled={busy}
          className={actionClass + " bg-site-action text-site-on-action"}
        >
          {busy && (
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden
            />
          )}
          {t("account.requestEmailChange")}
        </button>
      </form>
    </div>
  );
}

export function CredentialForms() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { account } = useAccountSession();
  const { requireRecentAuth } = useAccountReauth();
  const googleOnly = account ? !account.providers.includes("password") : false;
  const setupPassword = searchParams.get("setup") === "password";
  const [expandedSection, setExpandedSection] =
    useState<CredentialSection | null>(() =>
      setupPassword ? "password" : null,
    );
  const [setupPromptDismissed, setSetupPromptDismissed] = useState(false);

  return (
    <section
      className="space-y-8 border-t border-site-border pt-6"
      aria-labelledby="account-credentials-title"
    >
      <div>
        <h2
          id="account-credentials-title"
          className="font-heading text-xl font-bold text-site-foreground"
        >
          {t("account.credentialsTitle")}
        </h2>
        <p className="mt-1 text-sm text-site-muted">
          {t("account.credentialsDescription")}
        </p>
      </div>
      {googleOnly && !setupPromptDismissed && (
        <div className="border-2 border-site-accent bg-site-surface p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-site-accent bg-site-canvas text-site-accent">
              <KeyRound className="h-5 w-5" aria-hidden />
            </span>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-site-foreground">
                  {t("account.googlePasswordSetupTitle")}
                </h3>
                <span className="border border-site-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-site-accent">
                  {t("account.googlePasswordSetupRecommended")}
                </span>
              </div>
              <p className="text-sm text-site-muted">
                {t("account.googlePasswordSetupBody")}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className={`${actionClass} bg-site-action text-site-on-action`}
              onClick={() => {
                setSetupPromptDismissed(true);
                setExpandedSection("password");
                requestAnimationFrame(() =>
                  document
                    .getElementById("account-credentials-password-toggle")
                    ?.focus(),
                );
              }}
            >
              {t("account.googlePasswordSetupAction")}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center px-3 py-2 text-sm font-semibold text-site-muted underline decoration-site-border underline-offset-4 hover:text-site-foreground focus-visible:outline-3 focus-visible:outline-site-focus"
              onClick={() => setSetupPromptDismissed(true)}
            >
              {t("account.googlePasswordSetupSkip")}
            </button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        <CredentialAccordionItem
          id="password"
          title={t("account.passwordTitle")}
          summary={t("account.passwordDescription")}
          badge={
            googleOnly ? t("account.googlePasswordSetupRecommended") : undefined
          }
          expanded={expandedSection === "password"}
          onToggle={() =>
            setExpandedSection((current) =>
              current === "password" ? null : "password",
            )
          }
        >
          <PasswordChangeForm requireRecentAuth={requireRecentAuth} />
        </CredentialAccordionItem>
        <CredentialAccordionItem
          id="email"
          title={t("account.emailChangeTitle")}
          summary={t("account.emailChangeDescription")}
          expanded={expandedSection === "email"}
          onToggle={() =>
            setExpandedSection((current) =>
              current === "email" ? null : "email",
            )
          }
        >
          <EmailChangeForm
            locale={locale}
            requireRecentAuth={requireRecentAuth}
          />
        </CredentialAccordionItem>
      </div>
    </section>
  );
}
