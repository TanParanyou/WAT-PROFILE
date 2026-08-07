"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  toAccountApiError,
} from "@/features/public/account/api";
import { useAccountErrorMessage } from "@/features/public/account/hooks";
import { PasswordInput } from "./PasswordInput";
import { PasswordRequirements } from "./PasswordRequirements";
import { AccountField } from "./AccountField";
import { AccountFeedback } from "./AccountFeedback";
import { AccountFlowFooter } from "./AccountFlowFooter";
import {
  inspectPassword,
  normalizeAccountEmail,
  validatePassword,
} from "@/features/public/account/validation";

const inputBase =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none transition-colors placeholder:text-site-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";
const invalidInputClass = "border-red-700 focus-visible:outline-red-700";

const actionClass =
  "inline-flex min-h-11 items-center justify-center bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus";
const secondaryActionClass =
  "inline-flex min-h-11 items-center justify-center border border-site-border px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-canvas-strong focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus";

export function ForgotPasswordForm() {
  const t = useTranslations("Account");
  const getErrorMessage = useAccountErrorMessage();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setFormError(null);
    const normalized = normalizeAccountEmail(email);
    if (!normalized) {
      setEmailError(t("validation.emailRequired"));
      requestAnimationFrame(() => document.getElementById("forgot-email")?.focus());
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(normalized, locale);
      setSubmitted(true);
    } catch (err) {
      const apiError = toAccountApiError(err);
      const fieldError = apiError.fieldErrors.find((candidate) => candidate.field === "email");
      if (fieldError) {
        setEmailError(fieldError.message);
        requestAnimationFrame(() => document.getElementById("forgot-email")?.focus());
      } else {
        setFormError(getErrorMessage(apiError));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <AccountFeedback
          state={{ kind: "success", title: t("forgotPassword.successTitle"), body: t("forgotPassword.successBody") }}
        />
        <AccountFlowFooter
          primary={
            <Link href="/account/login" className={actionClass}>
              {t("login.submit")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {formError && <AccountFeedback state={{ kind: "error", message: formError }} />}
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AccountField id="forgot-email" label={t("forgotPassword.emailLabel")} error={emailError}>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
            }}
            placeholder={t("forgotPassword.emailPlaceholder")}
            className={inputBase}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "forgot-email-error" : undefined}
          />
        </AccountField>
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
  const getErrorMessage = useAccountErrorMessage();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const passwordRequirements = inspectPassword(password);

  const focusPassword = () => {
    requestAnimationFrame(() => document.getElementById("reset-password")?.focus());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setPasswordError(null);
    setTokenError(false);
    const pwError = validatePassword(password);
    if (pwError) {
      setPasswordError(t(`validation.${pwError}`));
      setFormError(null);
      focusPassword();
      return;
    }
    if (!token) {
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setSubmitted(true);
    } catch (err) {
      const apiError = toAccountApiError(err);
      const fieldError = apiError.fieldErrors.find(
        (candidate) => candidate.field === "password" || candidate.field === "new_password",
      );
      if (fieldError) {
        const localError = validatePassword(password);
        setPasswordError(localError ? t(`validation.${localError}`) : fieldError.message);
        setFormError(null);
        focusPassword();
      } else {
        setPasswordError(null);
        if (apiError.code === "AUTH_TOKEN_INVALID_OR_EXPIRED") {
          setTokenError(true);
          setFormError(null);
        } else {
          setFormError(getErrorMessage(apiError));
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <AccountFeedback
          state={{ kind: "success", title: t("resetPassword.successTitle"), body: t("resetPassword.successBody") }}
        />
        <AccountFlowFooter
          primary={
            <Link href="/account/login" className={actionClass}>
              {t("resetPassword.loginLink")}
            </Link>
          }
        />
      </div>
    );
  }

  if (!token || tokenError) {
    return (
      <div className="space-y-4">
        <AccountFeedback state={{ kind: "error", message: t("resetPassword.invalidBody") }} />
        <AccountFlowFooter
          primary={
            <Link href="/account/forgot-password" className={actionClass}>
              {t("resetPassword.requestNewLink")}
            </Link>
          }
          secondary={
            <Link href="/account/login" className={secondaryActionClass}>
              {t("login.submit")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {formError && <AccountFeedback state={{ kind: "error", message: formError }} />}
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AccountField id="reset-password" label={t("resetPassword.passwordLabel")} error={passwordError}>
          <PasswordInput
            id="reset-password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(null);
            }}
            placeholder={t("resetPassword.passwordPlaceholder")}
            className={`${inputBase} ${passwordError ? invalidInputClass : ""}`}
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={`reset-password-requirements${passwordError ? " reset-password-error" : ""}`}
          />
          <PasswordRequirements id="reset-password-requirements" requirements={passwordRequirements} />
        </AccountField>
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
  const getErrorMessage = useAccountErrorMessage();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"verifying" | "success" | "invalid" | "resend">("verifying");
  const [resendSent, setResendSent] = useState(false);
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (!token) {
      setState("resend");
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
        <AccountFeedback
          state={{ kind: "success", title: t("verifyEmail.successTitle"), body: t("verifyEmail.successBody") }}
        />
        <AccountFlowFooter
          primary={
            <Link href="/account/login" className={actionClass}>
              {t("verifyEmail.loginLink")}
            </Link>
          }
        />
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
      const apiError = toAccountApiError(err);
      setResendError(getErrorMessage(apiError));
    } finally {
      setResendSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {resendSent ? (
        <>
          <AccountFeedback
            state={{ kind: "success", title: t("verifyEmail.resendSent"), body: t("verifyEmail.resendNext") }}
          />
          <AccountFlowFooter
            primary={
              <Link href="/account/login" className={actionClass}>
                {t("verifyEmail.loginLink")}
              </Link>
            }
          />
        </>
      ) : (
        <>
          {state === "invalid" && <AccountFeedback state={{ kind: "error", message: t("verifyEmail.invalidBody") }} />}
          {state === "resend" && <p className="text-sm text-site-muted">{t("verifyEmail.resendIntro")}</p>}
          {resendError && <AccountFeedback state={{ kind: "error", message: resendError }} />}
          <AccountField id="verify-email" label={t("forgotPassword.emailLabel")}>
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
          </AccountField>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSubmitting}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
            {t("verifyEmail.resendSubmit")}
          </button>
          <AccountFlowFooter
            primary={
              <Link href="/account/forgot-password" className={actionClass}>
                {t("login.forgotLink")}
              </Link>
            }
            secondary={
              <Link href="/account/login" className={secondaryActionClass}>
                {t("login.submit")}
              </Link>
            }
          />
        </>
      )}
    </div>
  );
}
