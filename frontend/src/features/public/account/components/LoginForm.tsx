"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/navigation";
import { Loader2, AlertCircle, User } from "lucide-react";
import { startGoogle } from "@/features/public/account/api";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { toAccountApiError } from "@/features/public/account/api";
import { useAccountErrorMessage } from "@/features/public/account/hooks";
import { useGoogleRedirect } from "../hooks/useGoogleRedirect";
import { normalizeAccountEmail } from "@/features/public/account/validation";
import { PasswordInput } from "./PasswordInput";

const inputBase =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none transition-colors placeholder:text-site-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";
const labelBase = "block text-sm font-semibold text-text-800";
const errorText = "mt-1 text-sm text-red-700";

export function LoginForm() {
  const t = useTranslations("Account");
  const getErrorMessage = useAccountErrorMessage();
  const locale = useLocale();
  const router = useRouter();
  const { login } = useAccountSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { redirecting, markRedirecting } = useGoogleRedirect();

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
    setFieldError(null);

    const normalized = normalizeAccountEmail(email);
    if (!normalized) {
      setFieldError(t("validation.emailRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await login(normalized, password);
      router.replace("/account");
    } catch (err) {
      const apiError = toAccountApiError(err);
      setFormError(getErrorMessage(apiError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {formError && (
        <div
          role="alert"
          id="form-error"
          aria-describedby="form-error"
          className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={submitting || redirecting}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-site-border bg-site-canvas px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
      >
        {redirecting ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <User className="h-5 w-5" aria-hidden />
        )}
        {t("login.google")}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-site-border" />
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label className={labelBase} htmlFor="login-email">
            {t("login.emailLabel")}
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.emailPlaceholder")}
            className={inputBase}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? "login-email-error" : undefined}
          />
          {fieldError && (
            <p id="login-email-error" className={errorText}>
              {fieldError}
            </p>
          )}
        </div>

        <div>
          <label className={labelBase} htmlFor="login-password">
            {t("login.passwordLabel")}
          </label>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.passwordPlaceholder")}
            className={inputBase}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {t("login.submit")}
        </button>
      </form>

      <div className="flex flex-col gap-2 text-sm text-site-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {t("login.registerPrompt")}{" "}
          <Link
            href="/account/register"
            className="font-medium text-text-900 underline decoration-primary/40 underline-offset-4"
          >
            {t("login.registerLink")}
          </Link>
        </p>
        <p>
          <Link
            href="/account/forgot-password"
            className="font-medium text-text-900 underline decoration-primary/40 underline-offset-4"
          >
            {t("login.forgotLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
