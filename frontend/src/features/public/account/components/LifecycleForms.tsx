"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import {
  confirmAccountReopen,
  confirmEmailChange,
  requestAccountReopen,
  toAccountApiError,
} from "../api";
import { useAccountErrorMessage } from "../hooks";
import { normalizeAccountEmail } from "../validation";
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
  const getError = useAccountErrorMessage();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError(null);
    setError(null);
    const normalized = normalizeAccountEmail(email);
    if (!normalized) {
      setEmailError(t("validation.emailRequired"));
      requestAnimationFrame(() => document.getElementById("reopen-email")?.focus());
      return;
    }

    setBusy(true);
    try {
      await requestAccountReopen(normalized, locale);
      setSubmitted(true);
    } catch (requestError) {
      const apiError = toAccountApiError(requestError);
      const fieldError = apiError.fieldErrors.find((candidate) => candidate.field === "email");
      if (fieldError) {
        setEmailError(fieldError.message);
        requestAnimationFrame(() => document.getElementById("reopen-email")?.focus());
      } else {
        setError(getError(apiError));
      }
    } finally {
      setBusy(false);
    }
  };

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
      {error && <AccountFeedback state={{ kind: "error", message: error }} />}
      <form className="space-y-5" onSubmit={submit} noValidate>
        <AccountField id="reopen-email" label={t("account.emailLabel")} error={emailError}>
          <input
            id="reopen-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailError(null);
            }}
            className={inputClass}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "reopen-email-error" : undefined}
          />
        </AccountField>
        <button type="submit" disabled={busy} className={primaryActionClass}>
          {busy && <span aria-hidden>…</span>}
          {t("account.reopenRequestAction")}
        </button>
      </form>
    </section>
  );
}

type ConfirmationState = "loading" | "success" | "error";

export function ConfirmEmailChangeForm() {
  const t = useTranslations("Account");
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<ConfirmationState>(() => (token ? "loading" : "error"));

  useEffect(() => {
    if (!token) return;
    void confirmEmailChange(token)
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [token]);

  return (
    <section className="space-y-4">
      {state === "loading" ? (
        <AccountFeedback state={{ kind: "loading", message: t("account.loading") }} />
      ) : state === "success" ? (
        <>
          <AccountFeedback state={{ kind: "success", title: t("account.emailChanged"), body: t("account.emailChangedBody") }} />
          <AccountFlowFooter
            primary={
              <Link href="/account/login" className={primaryActionClass}>
                {t("login.submit")}
              </Link>
            }
          />
        </>
      ) : (
        <>
          <AccountFeedback state={{ kind: "error", message: t("account.actionInvalid") }} />
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
  const token = params.get("token");
  const [state, setState] = useState<ConfirmationState>(() => (token ? "loading" : "error"));

  useEffect(() => {
    if (!token) return;
    void confirmAccountReopen(token)
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [token]);

  return (
    <section className="space-y-4">
      {state === "loading" ? (
        <AccountFeedback state={{ kind: "loading", message: t("account.loading") }} />
      ) : state === "success" ? (
        <>
          <AccountFeedback
            state={{ kind: "success", title: t("account.accountRestored"), body: t("account.accountRestoredBody") }}
          />
          <AccountFlowFooter
            primary={
              <Link href="/account/login" className={primaryActionClass}>
                {t("login.submit")}
              </Link>
            }
          />
        </>
      ) : (
        <>
          <AccountFeedback state={{ kind: "error", message: t("account.actionInvalid") }} />
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
