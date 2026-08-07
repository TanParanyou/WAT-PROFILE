"use client";

import { useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";
import { SiteModal } from "@/components/public/modal";
import {
  createAccountFormSchemas,
  type PasswordReauthFormValues,
} from "../formSchemas";
import { PasswordInput } from "./PasswordInput";
import type { ReauthReason } from "../reauth/reauth-types";

interface AccountReauthModalProps {
  open: boolean;
  reason: ReauthReason | null;
  googleOnly: boolean;
  busy: boolean;
  redirecting: boolean;
  error: string | null;
  onClose: () => void;
  onPasswordSubmit: (password: string) => Promise<void>;
  onGoogleContinue: () => Promise<void>;
}

type AccountMessageKey =
  | "account.reauthChangePasswordTitle"
  | "account.reauthChangePasswordDescription"
  | "account.reauthChangeEmailTitle"
  | "account.reauthChangeEmailDescription"
  | "account.reauthCloseAccountTitle"
  | "account.reauthCloseAccountDescription"
  | "account.reauthUnlinkGoogleTitle"
  | "account.reauthUnlinkGoogleDescription"
  | "account.reauthLinkGoogleTitle"
  | "account.reauthLinkGoogleDescription";

const reasonCopy: Record<
  ReauthReason,
  { title: AccountMessageKey; description: AccountMessageKey }
> = {
  change_password: {
    title: "account.reauthChangePasswordTitle",
    description: "account.reauthChangePasswordDescription",
  },
  change_email: {
    title: "account.reauthChangeEmailTitle",
    description: "account.reauthChangeEmailDescription",
  },
  close_account: {
    title: "account.reauthCloseAccountTitle",
    description: "account.reauthCloseAccountDescription",
  },
  unlink_google: {
    title: "account.reauthUnlinkGoogleTitle",
    description: "account.reauthUnlinkGoogleDescription",
  },
  link_google: {
    title: "account.reauthLinkGoogleTitle",
    description: "account.reauthLinkGoogleDescription",
  },
};

export function AccountReauthModal({
  open,
  reason,
  googleOnly,
  busy,
  redirecting,
  error,
  onClose,
  onPasswordSubmit,
  onGoogleContinue,
}: AccountReauthModalProps) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const googleButtonRef = useRef<HTMLButtonElement>(null);
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
  const form = useForm<PasswordReauthFormValues>({
    resolver: zodResolver(schemas.passwordReauth),
    defaultValues: { password: "" },
    shouldFocusError: true,
  });
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  if (!reason) return null;
  const copy = reasonCopy[reason];

  const submitPassword = handleSubmit(async ({ password }) => {
    await onPasswordSubmit(password);
    form.reset();
  });

  return (
    <SiteModal
      open={open}
      eyebrow={t("account.reauthEyebrow")}
      title={t(copy.title)}
      description={t(copy.description)}
      tone={reason === "close_account" ? "danger" : "neutral"}
      initialFocusRef={googleOnly ? googleButtonRef : passwordInputRef}
      closeLabel={t("account.reauthClose")}
      onClose={onClose}
      busy={busy || redirecting}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 border border-site-border bg-site-surface p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-site-accent bg-site-canvas text-site-accent">
            <KeyRound className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm leading-6 text-site-muted">
            {googleOnly
              ? t("account.reauthGoogleDescription")
              : t("account.reauthPasswordDescription")}
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2 border border-site-danger bg-site-danger-surface p-3 text-sm text-site-danger"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span>{error}</span>
          </p>
        ) : null}

        {googleOnly ? (
          <button
            ref={googleButtonRef}
            type="button"
            onClick={() => void onGoogleContinue()}
            disabled={busy || redirecting}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
          >
            {(busy || redirecting) && (
              <Loader2
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            )}
            {redirecting
              ? t("google.redirecting")
              : t("account.reauthGoogleAction")}
          </button>
        ) : (
          <form
            className="space-y-4"
            onSubmit={submitPassword}
            noValidate
          >
            <div>
              <label
                className="block text-sm font-semibold"
                htmlFor={`account-reauth-password-${locale}`}
              >
                {t("account.reauthPasswordLabel")}
              </label>
              <Controller
                name="password"
                control={control}
                render={({ field, fieldState }) => (
                  <PasswordInput
                    {...field}
                    ref={(element) => {
                      field.ref(element);
                      passwordInputRef.current = element;
                    }}
                    id={`account-reauth-password-${locale}`}
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid || undefined}
                    aria-describedby={
                      fieldState.error
                        ? "account-reauth-password-error"
                        : undefined
                    }
                    className="mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none focus-visible:outline-3 focus-visible:outline-site-focus"
                    disabled={busy || isSubmitting}
                  />
                )}
              />
              {errors.password?.message ? (
                <p
                  id="account-reauth-password-error"
                  role="alert"
                  className="mt-1 text-sm text-red-700"
                >
                  {errors.password.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={busy || isSubmitting}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {busy && (
                  <Loader2
                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                    aria-hidden
                  />
                )}
                {t("account.reauthSubmit")}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="inline-flex min-h-11 w-full items-center justify-center border border-site-border bg-site-canvas px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {t("account.reauthCancel")}
              </button>
            </div>
          </form>
        )}
      </div>
    </SiteModal>
  );
}
