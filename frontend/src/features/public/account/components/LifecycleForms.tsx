"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  confirmAccountReopen,
  confirmEmailChange,
  requestAccountReopen,
  toAccountApiError,
} from "../api";
import {
  createAccountFormSchemas,
  type EmailRequestFormValues,
} from "../formSchemas";
import { mapAccountFormError } from "../formErrors";
import {
  classifyAccountActionError,
  type AccountActionState,
} from "../actionErrors";
import { useRetryCountdown } from "../hooks/useRetryCountdown";
import { AccountField } from "./AccountField";
import { AccountFeedback } from "./AccountFeedback";
import { AccountFlowFooter } from "./AccountFlowFooter";

const inputClass =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none focus-visible:outline-3 focus-visible:outline-site-focus";
const primaryActionClass =
  "inline-flex min-h-11 items-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action disabled:cursor-not-allowed disabled:opacity-60";
const secondaryActionClass =
  "inline-flex min-h-11 items-center justify-center border border-site-border px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-canvas-strong focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus";

export function ReopenRequestForm() {
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

  const submit = handleSubmit(async ({ email }) => {
    clearErrors();
    try {
      await requestAccountReopen(email, locale);
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
      <section className="space-y-4">
        <AccountFeedback
          state={{
            kind: "success",
            title: t("account.reopenRequestSentTitle"),
            body: t("account.reopenRequestSentBody"),
          }}
        />
        <AccountFlowFooter
          primary={
            <Link href="/account/login" className={primaryActionClass}>
              {t("login.submit")}
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {errors.root?.server?.message ? (
        <AccountFeedback
          state={{ kind: "error", message: errors.root.server.message }}
        />
      ) : null}
      <form className="space-y-5" onSubmit={submit} noValidate>
        <AccountField
          id="reopen-email"
          label={t("account.emailLabel")}
          error={errors.email?.message}
        >
          <input
            id="reopen-email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className={inputClass}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "reopen-email-error" : undefined}
          />
        </AccountField>
        <button type="submit" disabled={isSubmitting} className={primaryActionClass}>
          {isSubmitting && <span aria-hidden>…</span>}
          {t("account.reopenRequestAction")}
        </button>
      </form>
    </section>
  );
}

export function ConfirmEmailChangeForm() {
  const t = useTranslations("Account");
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<AccountActionState>(() =>
    token ? { kind: "loading" } : { kind: "invalid" },
  );
  const ranTokenRef = useRef<string | null>(null);
  const executeAction = useCallback(async () => {
    await Promise.resolve();
    setState({ kind: "loading" });
    try {
      await confirmEmailChange(token);
      setState({ kind: "success" });
    } catch (error: unknown) {
      setState(
        classifyAccountActionError(toAccountApiError(error), Boolean(token)),
      );
    }
  }, [token]);

  useEffect(() => {
    if (!token || ranTokenRef.current === token) return;
    ranTokenRef.current = token;
    const timer = window.setTimeout(() => {
      void executeAction();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [executeAction, token]);

  const remaining = useRetryCountdown(
    state.kind === "rate_limited" ? state.retryAfterSeconds : 0,
  );

  return (
    <section className="space-y-4">
      {state.kind === "loading" ? (
        <AccountFeedback state={{ kind: "loading", message: t("account.loading") }} />
      ) : state.kind === "success" ? (
        <>
          <AccountFeedback state={{ kind: "success", title: t("account.emailChanged"), body: t("account.emailChangedBody") }} />
          <AccountFlowFooter
            primary={
              <Link href="/account/login" className={primaryActionClass}>
                {t("login.submit")}
              </Link>
            }
            secondary={
              <Link href="/account?tab=security" className={secondaryActionClass}>
                {t("account.emailChangedSecurityLink")}
              </Link>
            }
          />
        </>
      ) : state.kind === "transient" || state.kind === "rate_limited" ? (
        <>
          <AccountFeedback
            state={{
              kind: "error",
              message:
                state.kind === "rate_limited"
                  ? t("account.actionRateLimited", { seconds: remaining })
                  : t("account.actionTransient"),
            }}
          />
          <button
            type="button"
            onClick={() => void executeAction()}
            disabled={remaining > 0}
            className={primaryActionClass}
          >
            {t("account.actionRetry")}
          </button>
        </>
      ) : (
        <>
          <AccountFeedback state={{ kind: "error", message: t("account.actionInvalidBody") }} />
          <AccountFlowFooter
            primary={
              <Link href="/account?tab=security" className={primaryActionClass}>
                {t("account.securitySection")}
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
    </section>
  );
}

export function ReopenAccountForm() {
  const t = useTranslations("Account");
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<AccountActionState>(() =>
    token ? { kind: "loading" } : { kind: "invalid" },
  );
  const ranTokenRef = useRef<string | null>(null);
  const executeAction = useCallback(async () => {
    await Promise.resolve();
    setState({ kind: "loading" });
    try {
      await confirmAccountReopen(token);
      setState({ kind: "success" });
    } catch (error: unknown) {
      setState(
        classifyAccountActionError(toAccountApiError(error), Boolean(token)),
      );
    }
  }, [token]);

  useEffect(() => {
    if (!token || ranTokenRef.current === token) return;
    ranTokenRef.current = token;
    const timer = window.setTimeout(() => {
      void executeAction();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [executeAction, token]);

  const remaining = useRetryCountdown(
    state.kind === "rate_limited" ? state.retryAfterSeconds : 0,
  );

  return (
    <section className="space-y-4">
      {state.kind === "loading" ? (
        <AccountFeedback state={{ kind: "loading", message: t("account.loading") }} />
      ) : state.kind === "success" ? (
        <>
          <AccountFeedback
            state={{ kind: "success", title: t("account.accountRestored"), body: t("account.accountRestoredBody") }}
          />
          <AccountFlowFooter
            primary={
              <Link href="/account/login" className={primaryActionClass}>
                {t("account.accountRestoredLogin")}
              </Link>
            }
          />
        </>
      ) : state.kind === "transient" || state.kind === "rate_limited" ? (
        <>
          <AccountFeedback
            state={{
              kind: "error",
              message:
                state.kind === "rate_limited"
                  ? t("account.actionRateLimited", { seconds: remaining })
                  : t("account.actionTransient"),
            }}
          />
          <button
            type="button"
            onClick={() => void executeAction()}
            disabled={remaining > 0}
            className={primaryActionClass}
          >
            {t("account.actionRetry")}
          </button>
        </>
      ) : (
        <>
          <AccountFeedback state={{ kind: "error", message: t("account.actionInvalidBody") }} />
          <AccountFlowFooter
            primary={
              <Link href="/account/reopen-request" className={primaryActionClass}>
                {t("account.reopenRequestAction")}
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
    </section>
  );
}
