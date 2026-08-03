"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import { Loader2, AlertCircle, CheckCircle, UserPlus } from "lucide-react";
import { registerAccount, startGoogle, toAccountApiError } from "@/features/public/account/api";
import {
  normalizeAccountEmail,
  validatePassword,
  validateDisplayName,
} from "@/features/public/account/validation";

const inputBase =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none transition-colors placeholder:text-site-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";
const labelBase = "block text-sm font-semibold text-text-800";
const errorText = "mt-1 text-sm text-red-700";

export function RegisterForm() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [googleUrl, setGoogleUrl] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const focusErrorSummary = () => {
    requestAnimationFrame(() => errorSummaryRef.current?.focus());
  };

  const handleGoogle = async () => {
    try {
      const url = await startGoogle(locale, "/account");
      setGoogleUrl(url);
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
      focusErrorSummary();
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
        setFormError(apiError.code === "AUTH_VALIDATION" ? null : apiError.message);
      } else {
        setFormError(apiError.message);
      }
      focusErrorSummary();
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t("register.successTitle")}</p>
            <p className="mt-1">{t("register.successBody")}</p>
          </div>
        </div>
        <p>
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

  return (
    <div className="space-y-5">
      {formError && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          id="form-error"
          aria-describedby="form-error"
          className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700 outline-none"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={submitting || googleUrl !== null}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-site-border bg-site-canvas px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
      >
        {googleUrl ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <UserPlus className="h-5 w-5" aria-hidden />
        )}
        {t("register.google")}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-site-border" />
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label className={labelBase} htmlFor="register-display-name">
            {t("register.displayNameLabel")}
          </label>
          <input
            id="register-display-name"
            name="display_name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("register.displayNamePlaceholder")}
            className={inputBase}
            aria-invalid={fieldErrors.displayName ? true : undefined}
            aria-describedby={fieldErrors.displayName ? "register-display-name-error" : undefined}
          />
          {fieldErrors.displayName && (
            <p id="register-display-name-error" className={errorText}>
              {fieldErrors.displayName}
            </p>
          )}
        </div>

        <div>
          <label className={labelBase} htmlFor="register-email">
            {t("register.emailLabel")}
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("register.emailPlaceholder")}
            className={inputBase}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
          />
          {fieldErrors.email && (
            <p id="register-email-error" className={errorText}>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label className={labelBase} htmlFor="register-password">
            {t("register.passwordLabel")}
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("register.passwordPlaceholder")}
            className={inputBase}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? "register-password-error" : undefined}
          />
          {fieldErrors.password && (
            <p id="register-password-error" className={errorText}>
              {fieldErrors.password}
            </p>
          )}
        </div>

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
