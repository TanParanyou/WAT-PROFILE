"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  toAccountApiError,
} from "@/features/public/account/api";
import { PasswordInput } from "./PasswordInput";
import {
  normalizeAccountEmail,
  validatePassword,
} from "@/features/public/account/validation";

const inputBase =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none transition-colors placeholder:text-site-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";
const labelBase = "block text-sm font-semibold text-text-800";

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

function SuccessBanner({ title, body }: { title: string; body: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700"
    >
      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1">{body}</p>
      </div>
    </div>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const normalized = normalizeAccountEmail(email);
    if (!normalized) {
      setFormError(t("validation.emailRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(normalized, locale);
      setSubmitted(true);
    } catch (err) {
      setFormError(toAccountApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <SuccessBanner title={t("forgotPassword.successTitle")} body={t("forgotPassword.successBody")} />
        <p>
          <Link
            href="/account/login"
            className="font-medium text-text-900 underline decoration-primary/40 underline-offset-4"
          >
            {t("login.submit")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {formError && <ErrorBanner message={formError} />}
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label className={labelBase} htmlFor="forgot-email">
            {t("forgotPassword.emailLabel")}
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("forgotPassword.emailPlaceholder")}
            className={inputBase}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {t("forgotPassword.submit")}
        </button>
      </form>
    </div>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations("Account");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const pwError = validatePassword(password);
    if (pwError) {
      setFormError(t(`validation.${pwError}`));
      return;
    }
    if (!token) {
      setFormError(t("validation.tokenRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setSubmitted(true);
    } catch (err) {
      setFormError(toAccountApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <SuccessBanner title={t("resetPassword.successTitle")} body={t("resetPassword.successBody")} />
        <p>
          <Link
            href="/account/login"
            className="font-medium text-text-900 underline decoration-primary/40 underline-offset-4"
          >
            {t("resetPassword.loginLink")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {formError && <ErrorBanner message={formError} />}
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label className={labelBase} htmlFor="reset-password">
            {t("resetPassword.passwordLabel")}
          </label>
          <PasswordInput
            id="reset-password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("resetPassword.passwordPlaceholder")}
            className={inputBase}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {t("resetPassword.submit")}
        </button>
      </form>
    </div>
  );
}

export function VerifyEmailContent() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"verifying" | "success" | "invalid">("verifying");
  const [resendSent, setResendSent] = useState(false);
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (!token) {
      setState("invalid");
      return;
    }
    verifyEmail(token)
      .then(() => setState("success"))
      .catch(() => setState("invalid"));
  }, [token]);

  if (state === "verifying") {
    return (
      <div className="flex items-center gap-2 text-sm text-site-muted">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span>{t("verifyEmail.verifying")}</span>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="space-y-4">
        <SuccessBanner title={t("verifyEmail.successTitle")} body={t("verifyEmail.successBody")} />
        <p>
          <Link
            href="/account/login"
            className="font-medium text-text-900 underline decoration-primary/40 underline-offset-4"
          >
            {t("verifyEmail.loginLink")}
          </Link>
        </p>
      </div>
    );
  }

  const handleResend = async () => {
    setResendSubmitting(true);
    setResendError(null);
    try {
      await resendVerification(email, locale);
      setResendSent(true);
    } catch (err) {
      setResendError(toAccountApiError(err).message);
    } finally {
      setResendSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {resendSent ? (
        <SuccessBanner title={t("verifyEmail.resendSent")} body={t("forgotPassword.successBody")} />
      ) : (
        <>
          <ErrorBanner message={t("verifyEmail.invalidBody")} />
          {resendError && <ErrorBanner message={resendError} />}
          <div>
            <label className={labelBase} htmlFor="verify-email">
              {t("forgotPassword.emailLabel")}
            </label>
            <input
              id="verify-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("forgotPassword.emailPlaceholder")}
              className={inputBase}
            />
          </div>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSubmitting}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
            {t("verifyEmail.resendSubmit")}
          </button>
        </>
      )}
    </div>
  );
}
