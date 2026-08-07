"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import {
  changePasswordAccount,
  toAccountApiError,
} from "../api";
import { AccountReauthError } from "../reauth/reauth-types";
import type { ReauthResult } from "../reauth/reauth-types";
import { accountKeys } from "../queries";
import {
  createAccountFormSchemas,
  type PasswordChangeFormValues,
} from "../formSchemas";
import { mapAccountFormError } from "../formErrors";
import { AccountField } from "./AccountField";
import { PasswordInput } from "./PasswordInput";

const inputClass =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none focus-visible:outline-3 focus-visible:outline-site-focus";
const actionClass =
  "inline-flex min-h-11 items-center gap-2 px-5 py-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60";
const invalidInputClass = "border-red-700 focus-visible:outline-red-700";

export interface PasswordChangeFormProps {
  requireRecentAuth: (options: {
    reason: "change_password";
  }) => Promise<ReauthResult>;
}

export function PasswordChangeForm({
  requireRecentAuth,
}: PasswordChangeFormProps) {
  const t = useTranslations("Account");
  const queryClient = useQueryClient();
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
  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(schemas.passwordChange),
    defaultValues: { newPassword: "" },
    shouldFocusError: true,
  });
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    clearErrors();
    setMessage(null);
    try {
      await requireRecentAuth({ reason: "change_password" });
      await changePasswordAccount(newPassword);
      await queryClient.invalidateQueries({ queryKey: accountKeys.current() });
      form.reset();
      setMessage(t("account.passwordChanged"));
    } catch (error: unknown) {
      if (
        error instanceof AccountReauthError &&
        error.code === "AUTH_REAUTH_CANCELLED"
      ) {
        return;
      }
      const apiError = toAccountApiError(error);
      const mapped = mapAccountFormError(apiError, {
        password: "newPassword",
        new_password: "newPassword",
      });
      const message = t(mapped.messageKey as Parameters<typeof t>[0]);
      if (mapped.target === "newPassword") {
        setError("newPassword", { type: "server", message });
      } else {
        setError("root.server", { type: "server", message });
      }
    }
  });

  return (
    <div className="space-y-4">
      {message ? (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          <CheckCircle className="h-5 w-5" aria-hidden />
          {message}
        </p>
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
          id="password-change-new-password"
          label={t("account.newPasswordLabel")}
          error={errors.newPassword?.message}
        >
          <PasswordInput
            id="password-change-new-password"
            autoComplete="new-password"
            {...register("newPassword")}
            className={`${inputClass}${errors.newPassword ? ` ${invalidInputClass}` : ""}`}
            aria-invalid={errors.newPassword ? true : undefined}
            aria-describedby={
              errors.newPassword
                ? "password-change-new-password-error"
                : undefined
            }
          />
        </AccountField>
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
          {t("account.changePassword")}
        </button>
      </form>
    </div>
  );
}
