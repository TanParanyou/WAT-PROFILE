"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import { Loader2 } from "lucide-react";
import { registerAccount, startGoogle, toAccountApiError } from "@/features/public/account/api";
import { useAccountErrorMessage } from "@/features/public/account/hooks";
import { useGoogleRedirect } from "../hooks/useGoogleRedirect";
import {
  inspectPassword,
  normalizeAccountEmail,
  validatePassword,
  validateDisplayName,
} from "@/features/public/account/validation";
import { PasswordInput } from "./PasswordInput";
import { PasswordRequirements } from "./PasswordRequirements";
import { AccountField } from "./AccountField";
import { AccountFeedback } from "./AccountFeedback";
import { AuthMethodPanel } from "./AuthMethodPanel";

const inputBase =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none transition-colors placeholder:text-site-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";
const invalidInputClass = "border-red-700 focus-visible:outline-red-700";

export function RegisterForm() {
  const t = useTranslations("Account");
  const getErrorMessage = useAccountErrorMessage();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { redirecting, markRedirecting } = useGoogleRedirect();
  const passwordRequirements = inspectPassword(password);

  const focusFirstError = () => {
    requestAnimationFrame(() => {
      const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.focus();
    });
  };

  const handleGoogle = async () => {
    try {
      const url = await startGoogle(locale, "/account");
      markRedirecting();
      window.location.assign(url);
    } catch {
      setFormError(t("google.unexpected"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const normalized = normalizeAccountEmail(email);
    const nextFieldErrors: Record<string, string> = {};
    if (!normalized) {
      nextFieldErrors.email = t("validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      nextFieldErrors.email = t("validation.emailInvalid");
    }
    const pwError = validatePassword(password);
    if (pwError) nextFieldErrors.password = t(`validation.${pwError}`);
    const nameError = validateDisplayName(displayName);
    if (nameError) nextFieldErrors.displayName = t(`validation.${nameError}`);

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      focusFirstError();
      return;
    }

    setSubmitting(true);
    try {
      await registerAccount({
        email: normalized,
        password,
        display_name: displayName.trim(),
        locale,
      });
      setSubmitted(true);
    } catch (err) {
      const apiError = toAccountApiError(err);
      if (apiError.fieldErrors.length > 0) {
        const mapped: Record<string, string> = {};
        for (const fe of apiError.fieldErrors) {
          if (fe.field === "email") mapped.email = fe.message;
          if (fe.field === "password") mapped.password = fe.message;
          if (fe.field === "display_name") mapped.displayName = fe.message;
        }
        setFieldErrors(mapped);
        setFormError(apiError.code === "AUTH_VALIDATION" ? null : getErrorMessage(apiError));
      } else {
        setFormError(getErrorMessage(apiError));
      }
      focusFirstError();
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <AccountFeedback
          state={{
            kind: "success",
            title: t("register.successTitle"),
            body: t("register.successBody"),
          }}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/account/verify-email"
            className="inline-flex min-h-11 items-center justify-center bg-site-action px-5 py-2.5 font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
          >
            {t("register.verificationResendLink")}
          </Link>
          <Link
            href="/account/login"
            className="inline-flex min-h-11 items-center justify-center border border-site-border bg-site-canvas px-5 py-2.5 font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
          >
            {t("register.loginLink")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {formError ? <AccountFeedback state={{ kind: "error", message: formError }} /> : null}

      <AuthMethodPanel
        googleLabel={t("register.google")}
        dividerLabel={t("navigation.or")}
        loading={submitting || redirecting}
        onGoogle={handleGoogle}
      />

      <div
        role="note"
        aria-labelledby="register-requirements-title"
        className="space-y-1 border border-site-border bg-site-surface p-3 text-sm text-site-muted"
      >
        <p id="register-requirements-title" className="font-semibold text-site-foreground">
          {t("register.requirementsTitle")}
        </p>
        <p>{t("register.emailHint")}</p>
        <p>{t("register.verificationHint")}</p>
        <p>{t("register.googleHint")}</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AccountField id="register-display-name" label={t("register.displayNameLabel")} error={fieldErrors.displayName}>
          <input
            id="register-display-name"
            name="display_name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("register.displayNamePlaceholder")}
            className={`${inputBase} ${fieldErrors.displayName ? invalidInputClass : ""}`}
            aria-invalid={fieldErrors.displayName ? true : undefined}
            aria-describedby={fieldErrors.displayName ? "register-display-name-error" : undefined}
          />
        </AccountField>

        <AccountField id="register-email" label={t("register.emailLabel")} error={fieldErrors.email}>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("register.emailPlaceholder")}
            className={`${inputBase} ${fieldErrors.email ? invalidInputClass : ""}`}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
          />
        </AccountField>

        <AccountField
          id="register-password"
          label={t("register.passwordLabel")}
          error={fieldErrors.password}
          description={
            <>
              <PasswordRequirements id="register-password-requirements" requirements={passwordRequirements} />
              <p id="register-password-hint" className="mt-1 text-sm text-site-muted">
                {t("register.passwordHint")}
              </p>
            </>
          }
        >
          <PasswordInput
            id="register-password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("register.passwordPlaceholder")}
            className={`${inputBase} ${fieldErrors.password ? invalidInputClass : ""}`}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={`register-password-requirements register-password-hint${
              fieldErrors.password ? " register-password-error" : ""
            }`}
          />
        </AccountField>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {t("register.submit")}
        </button>
      </form>

      <p className="text-sm text-site-muted">
        {t("register.loginPrompt")}{" "}
        <Link
          href="/account/login"
          className="font-medium text-text-900 underline decoration-primary/40 underline-offset-4"
        >
          {t("register.loginLink")}
        </Link>
      </p>
    </div>
  );
}
