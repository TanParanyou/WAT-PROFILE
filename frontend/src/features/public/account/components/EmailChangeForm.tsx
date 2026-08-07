"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { requestEmailChange, toAccountApiError } from "../api";
import { AccountReauthError } from "../reauth/reauth-types";
import type { ReauthResult } from "../reauth/reauth-types";
import {
  createAccountFormSchemas,
  type EmailChangeFormValues,
} from "../formSchemas";
import { mapAccountFormError } from "../formErrors";
import { AccountField } from "./AccountField";

const inputClass =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none focus-visible:outline-3 focus-visible:outline-site-focus";
const actionClass =
  "inline-flex min-h-11 items-center gap-2 px-5 py-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60";
const invalidInputClass = "border-red-700 focus-visible:outline-red-700";

export interface EmailChangeFormProps {
  locale: string;
  requireRecentAuth: (options: {
    reason: "change_email";
  }) => Promise<ReauthResult>;
}

export function EmailChangeForm({
  locale,
  requireRecentAuth,
}: EmailChangeFormProps) {
  const t = useTranslations("Account");
  const [message, setMessage] = useState<string | null>(null);
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
  const form = useForm<EmailChangeFormValues>({
    resolver: zodResolver(schemas.emailChange),
    defaultValues: { newEmail: "" },
    shouldFocusError: true,
  });
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async ({ newEmail }) => {
    clearErrors();
    setMessage(null);
    try {
      await requireRecentAuth({ reason: "change_email" });
      await requestEmailChange(newEmail, locale);
      form.reset();
      setMessage(t("account.emailConfirmationSent"));
    } catch (error: unknown) {
      if (
        error instanceof AccountReauthError &&
        error.code === "AUTH_REAUTH_CANCELLED"
      ) {
        return;
      }
      const apiError = toAccountApiError(error);
      const mapped = mapAccountFormError(apiError, {
        email: "newEmail",
        new_email: "newEmail",
      });
      const message = t(mapped.messageKey as Parameters<typeof t>[0]);
      if (mapped.target === "newEmail") {
        setError("newEmail", { type: "server", message }, { shouldFocus: true });
      } else {
        setError("root.server", { type: "server", message });
      }
    }
  });

  return (
    <div className="space-y-4">
      {message ? (
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
      ) : null}
      {errors.root?.server?.message ? (
        <p
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="h-5 w-5" aria-hidden />
          {errors.root.server.message}
        </p>
      ) : null}
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <AccountField
          id="email-change-new-email"
          label={t("account.newEmailLabel")}
          error={errors.newEmail?.message}
        >
          <input
            id="email-change-new-email"
            type="email"
            {...register("newEmail")}
            className={`${inputClass}${errors.newEmail ? ` ${invalidInputClass}` : ""}`}
            autoComplete="email"
            aria-invalid={errors.newEmail ? true : undefined}
            aria-describedby={
              errors.newEmail ? "email-change-new-email-error" : undefined
            }
          />
        </AccountField>
        <p className="border-l-2 border-site-accent pl-3 text-sm text-site-muted">
          {t("account.emailVerificationHint")}
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${actionClass} bg-site-action text-site-on-action`}
        >
          {isSubmitting ? (
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden
            />
          ) : null}
          {t("account.requestEmailChange")}
        </button>
      </form>
    </div>
  );
}
