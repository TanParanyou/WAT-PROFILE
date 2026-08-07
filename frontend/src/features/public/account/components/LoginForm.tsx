"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "@/navigation";
import { Loader2 } from "lucide-react";
import { startGoogle } from "@/features/public/account/api";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { toAccountApiError } from "@/features/public/account/api";
import { useGoogleRedirect } from "../hooks/useGoogleRedirect";
import {
  createAccountFormSchemas,
  type LoginFormValues,
} from "@/features/public/account/formSchemas";
import { mapAccountFormError } from "@/features/public/account/formErrors";
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
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAccountSession();
  const { redirecting, markRedirecting } = useGoogleRedirect();
  const schemas = useMemo(
    () =>
      createAccountFormSchemas({
        emailRequired: t("validation.emailRequired"),
        emailInvalid: t("validation.emailInvalid"),
        displayNameRequired: t("validation.displayNameRequired"),
        displayNameMin: t("validation.displayNameMin"),
        displayNameMax: t("validation.displayNameMax"),
        passwordRequired: t("validation.passwordRequired"),
        passwordMin: t("validation.passwordMin"),
        passwordMax: t("validation.passwordMax"),
        passwordComplexity: t("validation.passwordComplexity"),
      }),
    [t],
  );
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schemas.login),
    defaultValues: { email: "", password: "" },
    shouldFocusError: true,
  });
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = form;
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
      setError("root.server", {
        type: "server",
        message: t("google.unexpected"),
      });
    }
  };

  const onSubmit = handleSubmit(async ({ email, password }) => {
    clearErrors();
    try {
      await login(email, password);
      router.replace("/account");
    } catch (error: unknown) {
      const apiError = toAccountApiError(error);
      const mapped = mapAccountFormError(apiError, {
        email: "email",
        password: "password",
      });
      const message = t(mapped.messageKey as Parameters<typeof t>[0]);
      if (mapped.target === "email" || mapped.target === "password") {
        setError(mapped.target, {
          type: "server",
          message,
        }, { shouldFocus: true });
      } else {
        setError("root.server", {
          type: "server",
          message,
        });
      }
    }
  });

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
      {errors.root?.server?.message ? (
        <AccountFeedback
          state={{ kind: "error", message: errors.root.server.message }}
        />
      ) : null}

      <AuthMethodPanel
        googleLabel={t("login.google")}
        dividerLabel={t("navigation.or")}
        loading={isSubmitting || redirecting}
        onGoogle={handleGoogle}
      />

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <AccountField
          id="login-email"
          label={t("login.emailLabel")}
          error={errors.email?.message}
        >
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            {...register("email")}
            placeholder={t("login.emailPlaceholder")}
            className={inputBase}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={
              errors.email ? "login-email-error" : undefined
            }
          />
        </AccountField>

        <AccountField
          id="login-password"
          label={t("login.passwordLabel")}
          error={errors.password?.message}
        >
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            {...register("password")}
            placeholder={t("login.passwordPlaceholder")}
            className={inputBase}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? "login-password-error" : undefined
            }
          />
        </AccountField>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && (
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
