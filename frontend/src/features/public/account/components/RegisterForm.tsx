"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import { Loader2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerAccount, startGoogle, toAccountApiError } from "@/features/public/account/api";
import { useGoogleRedirect } from "../hooks/useGoogleRedirect";
import {
  createAccountFormSchemas,
  type RegisterFormValues,
} from "@/features/public/account/formSchemas";
import { mapAccountFormError } from "@/features/public/account/formErrors";
import { inspectPassword } from "@/features/public/account/validation";
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
  const locale = useLocale();
  const [submitted, setSubmitted] = useState(false);
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
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schemas.register),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      locale: locale as RegisterFormValues["locale"],
    },
    shouldFocusError: true,
  });
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  const passwordRequirements = useWatch({
    control: form.control,
    name: "password",
  });
  const passwordPolicy = useMemo(
    () => inspectPassword(passwordRequirements),
    [passwordRequirements],
  );

  const handleGoogle = async () => {
    try {
      const url = await startGoogle(locale, "/account?tab=security&setup=password");
      markRedirecting();
      window.location.assign(url);
    } catch {
      setError("root.server", {
        type: "server",
        message: t("google.unexpected"),
      });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    clearErrors();
    try {
      await registerAccount({
        email: values.email,
        password: values.password,
        display_name: values.displayName,
        locale: values.locale,
      });
      setSubmitted(true);
    } catch (error: unknown) {
      const apiError = toAccountApiError(error);
      const mapped = mapAccountFormError(apiError, {
        email: "email",
        password: "password",
        display_name: "displayName",
      });
      const message = t(mapped.messageKey as Parameters<typeof t>[0]);
      if (
        mapped.target === "email" ||
        mapped.target === "password" ||
        mapped.target === "displayName"
      ) {
        setError(mapped.target, {
          type: "server",
          message,
        });
      } else {
        setError("root.server", {
          type: "server",
          message,
        });
      }
    }
  });

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
      {errors.root?.server?.message ? (
        <AccountFeedback
          state={{ kind: "error", message: errors.root.server.message }}
        />
      ) : null}

      <AuthMethodPanel
        googleLabel={t("register.google")}
        dividerLabel={t("navigation.or")}
        loading={isSubmitting || redirecting}
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

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <AccountField
          id="register-display-name"
          label={t("register.displayNameLabel")}
          error={errors.displayName?.message}
        >
          <input
            id="register-display-name"
            type="text"
            autoComplete="name"
            {...register("displayName")}
            placeholder={t("register.displayNamePlaceholder")}
            className={`${inputBase} ${errors.displayName ? invalidInputClass : ""}`}
            aria-invalid={errors.displayName ? true : undefined}
            aria-describedby={errors.displayName ? "register-display-name-error" : undefined}
          />
        </AccountField>

        <AccountField
          id="register-email"
          label={t("register.emailLabel")}
          error={errors.email?.message}
        >
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            {...register("email")}
            placeholder={t("register.emailPlaceholder")}
            className={`${inputBase} ${errors.email ? invalidInputClass : ""}`}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "register-email-error" : undefined}
          />
        </AccountField>

        <AccountField
          id="register-password"
          label={t("register.passwordLabel")}
          error={errors.password?.message}
          description={
            <>
              <PasswordRequirements id="register-password-requirements" requirements={passwordPolicy} />
              <p id="register-password-hint" className="mt-1 text-sm text-site-muted">
                {t("register.passwordHint")}
              </p>
            </>
          }
        >
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            {...register("password")}
            placeholder={t("register.passwordPlaceholder")}
            className={`${inputBase} ${errors.password ? invalidInputClass : ""}`}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={`register-password-requirements register-password-hint${
              errors.password ? " register-password-error" : ""
            }`}
          />
        </AccountField>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
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
