"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/navigation";
import { Loader2 } from "lucide-react";
import { startGoogle } from "@/features/public/account/api";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { toAccountApiError } from "@/features/public/account/api";
import { useAccountErrorMessage } from "@/features/public/account/hooks";
import { useGoogleRedirect } from "../hooks/useGoogleRedirect";
import { normalizeAccountEmail } from "@/features/public/account/validation";
import { PasswordInput } from "./PasswordInput";
import { AccountField } from "./AccountField";
import { AccountFeedback } from "./AccountFeedback";
import { AuthMethodPanel } from "./AuthMethodPanel";
import type { AccountErrorCode } from "../types";

const inputBase =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none transition-colors placeholder:text-site-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";

const callbackErrorCodes: ReadonlySet<string> = new Set<AccountErrorCode>([
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_EMAIL_VERIFICATION_REQUIRED",
  "AUTH_TOKEN_INVALID_OR_EXPIRED",
  "AUTH_RATE_LIMITED",
  "AUTH_ACCOUNT_DISABLED",
  "AUTH_REAUTH_REQUIRED",
  "AUTH_EMAIL_ALREADY_REGISTERED",
  "AUTH_VALIDATION",
  "AUTH_GOOGLE_EMAIL_MISMATCH",
  "AUTH_GOOGLE_IDENTITY_IN_USE",
  "AUTH_GOOGLE_ALREADY_LINKED",
  "AUTH_GOOGLE_LINK_PENDING",
  "AUTH_INTERNAL",
  "AUTH_UNKNOWN",
]);

export function LoginForm() {
  const t = useTranslations("Account");
  const getErrorMessage = useAccountErrorMessage();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAccountSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const { redirecting, markRedirecting } = useGoogleRedirect();
  const logoutAllReason = searchParams.get("reason") === "logout-all";
  const callbackErrorCode = searchParams.get("error");
  const callbackErrorMessage =
    callbackErrorCode && callbackErrorCodes.has(callbackErrorCode)
      ? t(`errors.${callbackErrorCode}` as Parameters<typeof t>[0])
      : null;

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
    if (!normalized) {
      setFieldErrors({ email: t("validation.emailRequired") });
      requestAnimationFrame(() =>
        document.getElementById("login-email")?.focus(),
      );
      return;
    }

    setSubmitting(true);
    try {
      await login(normalized, password);
      router.replace("/account");
    } catch (err) {
      const apiError = toAccountApiError(err);
      const mapped = Object.fromEntries(
        apiError.fieldErrors
          .filter(
            (fieldError) =>
              fieldError.field === "email" || fieldError.field === "password",
          )
          .map((fieldError) => [fieldError.field, fieldError.message]),
      ) as { email?: string; password?: string };
      setFieldErrors(mapped);
      const firstField = mapped.email
        ? "login-email"
        : mapped.password
          ? "login-password"
          : null;
      if (firstField) {
        setFormError(null);
        requestAnimationFrame(() =>
          document.getElementById(firstField)?.focus(),
        );
      } else {
        setFormError(getErrorMessage(apiError));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {logoutAllReason ? (
        <AccountFeedback
          state={{
            kind: "success",
            title: t("login.logoutAllTitle"),
            body: t("login.logoutAllBody"),
          }}
        />
      ) : null}
      {callbackErrorMessage ? (
        <AccountFeedback
          state={{ kind: "error", message: callbackErrorMessage }}
        />
      ) : null}
      {formError ? (
        <AccountFeedback state={{ kind: "error", message: formError }} />
      ) : null}

      <AuthMethodPanel
        googleLabel={t("login.google")}
        dividerLabel={t("navigation.or")}
        loading={submitting || redirecting}
        onGoogle={handleGoogle}
      />

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AccountField
          id="login-email"
          label={t("login.emailLabel")}
          error={fieldErrors.email}
        >
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((current) => ({ ...current, email: undefined }));
            }}
            placeholder={t("login.emailPlaceholder")}
            className={inputBase}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={
              fieldErrors.email ? "login-email-error" : undefined
            }
          />
        </AccountField>

        <AccountField
          id="login-password"
          label={t("login.passwordLabel")}
          error={fieldErrors.password}
        >
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((current) => ({
                ...current,
                password: undefined,
              }));
            }}
            placeholder={t("login.passwordPlaceholder")}
            className={inputBase}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={
              fieldErrors.password ? "login-password-error" : undefined
            }
          />
        </AccountField>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          )}
          {t("login.submit")}
        </button>
      </form>

      <nav
        aria-labelledby="login-help-links-title"
        className="space-y-2 border-t border-site-border pt-4 text-sm text-site-muted"
      >
        <h2
          id="login-help-links-title"
          className="font-semibold text-site-foreground"
        >
          {t("login.linksTitle")}
        </h2>
        <ul className="space-y-2">
          <li>
            {t("login.registerPrompt")}{" "}
            <Link
              href="/account/register"
              className="font-medium text-text-900 underline decoration-primary/40 underline-offset-4"
            >
              {t("login.registerLink")}
            </Link>
          </li>
          <li>
            <Link
              href="/account/forgot-password"
              className="font-medium text-text-900 underline decoration-primary/40 underline-offset-4"
            >
              {t("login.forgotLink")}
            </Link>
          </li>
          <li>
            <Link
              href="/account/reopen-request"
              className="font-medium text-text-900 underline decoration-primary/40 underline-offset-4"
            >
              {t("login.reopenLink")}
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
