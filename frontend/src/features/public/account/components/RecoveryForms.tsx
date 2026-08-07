"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  toAccountApiError,
} from "@/features/public/account/api";
import {
  createAccountFormSchemas,
  type EmailRequestFormValues,
  type ResetPasswordFormValues,
} from "@/features/public/account/formSchemas";
import { mapAccountFormError } from "@/features/public/account/formErrors";
import { PasswordInput } from "./PasswordInput";
import { PasswordRequirements } from "./PasswordRequirements";
import { AccountField } from "./AccountField";
import { AccountFeedback } from "./AccountFeedback";
import { AccountFlowFooter } from "./AccountFlowFooter";
import {
  inspectPassword,
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
  const locale = useLocale();
  const [submitted, setSubmitted] = useState(false);
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
  const form = useForm<EmailRequestFormValues>({
    resolver: zodResolver(schemas.emailRequest),
    defaultValues: { email: "" },
    shouldFocusError: true,
  });
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async ({ email }) => {
    clearErrors();
    try {
      await forgotPassword(email, locale);
      setSubmitted(true);
    } catch (error: unknown) {
      const apiError = toAccountApiError(error);
      const mapped = mapAccountFormError(apiError, { email: "email" });
      const message = t(mapped.messageKey as Parameters<typeof t>[0]);
      if (mapped.target === "email") {
        setError("email", { type: "server", message });
      } else {
        setError("root.server", { type: "server", message });
      }
    }
  });

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
      {errors.root?.server?.message ? (
        <AccountFeedback
          state={{ kind: "error", message: errors.root.server.message }}
        />
      ) : null}
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <AccountField
          id="forgot-email"
          label={t("forgotPassword.emailLabel")}
          error={errors.email?.message}
        >
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            {...register("email")}
            placeholder={t("forgotPassword.emailPlaceholder")}
            className={inputBase}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "forgot-email-error" : undefined}
          />
        </AccountField>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
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
  const [tokenError, setTokenError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schemas.resetPassword),
    defaultValues: { password: "" },
    shouldFocusError: true,
  });
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  const password = useWatch({ control: form.control, name: "password" });
  const passwordRequirements = useMemo(
    () => inspectPassword(password),
    [password],
  );

  const onSubmit = handleSubmit(async ({ password }) => {
    clearErrors();
    setTokenError(false);
    if (!token) return;
    try {
      await resetPassword(token, password);
      form.reset();
      setSubmitted(true);
    } catch (error: unknown) {
      const apiError = toAccountApiError(error);
      if (apiError.code === "AUTH_TOKEN_INVALID_OR_EXPIRED") {
        setTokenError(true);
        return;
      }
      const mapped = mapAccountFormError(apiError, {
        password: "password",
        new_password: "password",
      });
      const message = t(mapped.messageKey as Parameters<typeof t>[0]);
      if (mapped.target === "password") {
        setError("password", { type: "server", message });
      } else {
        setError("root.server", { type: "server", message });
      }
    }
  });

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
      {errors.root?.server?.message ? (
        <AccountFeedback
          state={{ kind: "error", message: errors.root.server.message }}
        />
      ) : null}
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <AccountField
          id="reset-password"
          label={t("resetPassword.passwordLabel")}
          error={errors.password?.message}
        >
          <PasswordInput
            id="reset-password"
            autoComplete="new-password"
            {...register("password")}
            placeholder={t("resetPassword.passwordPlaceholder")}
            className={`${inputBase} ${errors.password ? invalidInputClass : ""}`}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={`reset-password-requirements${errors.password ? " reset-password-error" : ""}`}
          />
          <PasswordRequirements id="reset-password-requirements" requirements={passwordRequirements} />
        </AccountField>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
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
  const [state, setState] = useState<"verifying" | "success" | "invalid" | "resend">(
    () => (token ? "verifying" : "resend"),
  );
  const [resendSent, setResendSent] = useState(false);
  const ranRef = useRef(false);

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
  const resendForm = useForm<EmailRequestFormValues>({
    resolver: zodResolver(schemas.emailRequest),
    defaultValues: { email: "" },
    shouldFocusError: true,
  });
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = resendForm;

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (!token) return;
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

  const handleResend = handleSubmit(async ({ email }) => {
    clearErrors();
    try {
      await resendVerification(email, locale);
      setResendSent(true);
    } catch (error: unknown) {
      const apiError = toAccountApiError(error);
      const mapped = mapAccountFormError(apiError, { email: "email" });
      const message = t(mapped.messageKey as Parameters<typeof t>[0]);
      if (mapped.target === "email") {
        setError("email", { type: "server", message });
      } else {
        setError("root.server", { type: "server", message });
      }
    }
  });

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
          {errors.root?.server?.message ? (
            <AccountFeedback
              state={{ kind: "error", message: errors.root.server.message }}
            />
          ) : null}
          <form className="space-y-5" onSubmit={handleResend} noValidate>
            <AccountField
              id="verify-email"
              label={t("forgotPassword.emailLabel")}
              error={errors.email?.message}
            >
              <input
                id="verify-email"
                type="email"
                autoComplete="email"
                {...register("email")}
                placeholder={t("forgotPassword.emailPlaceholder")}
                className={inputBase}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "verify-email-error" : undefined}
              />
            </AccountField>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
              {t("verifyEmail.resendSubmit")}
            </button>
          </form>
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
