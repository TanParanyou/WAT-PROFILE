"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  confirmAccountReopen,
  confirmEmailChange,
  requestAccountReopen,
  toAccountApiError,
} from "../api";
import { useAccountErrorMessage } from "../hooks";
import { normalizeAccountEmail } from "../validation";

const inputClass =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none focus-visible:outline-3 focus-visible:outline-site-focus";
const primaryActionClass =
  "inline-flex min-h-11 items-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action disabled:cursor-not-allowed disabled:opacity-60";

export function ReopenRequestForm() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const getError = useAccountErrorMessage();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const normalized = normalizeAccountEmail(email);
    if (!normalized) {
      setError(t("validation.emailRequired"));
      return;
    }

    setBusy(true);
    try {
      await requestAccountReopen(normalized, locale);
      setSubmitted(true);
    } catch (requestError) {
      setError(getError(toAccountApiError(requestError)));
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <section className="space-y-4" role="status" aria-live="polite">
        <h2 className="font-heading text-2xl font-bold">{t("account.reopenRequestSentTitle")}</h2>
        <p className="text-sm text-site-muted">{t("account.reopenRequestSentBody")}</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <h2 className="font-heading text-2xl font-bold">{t("account.reopenRequestTitle")}</h2>
      <p className="text-sm text-site-muted">{t("account.reopenRequestBody")}</p>
      {error && (
        <p role="alert" className="border border-red-700 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <form className="space-y-5" onSubmit={submit} noValidate>
        <div>
          <label className="block text-sm font-semibold" htmlFor="reopen-email">
            {t("account.emailLabel")}
          </label>
          <input
            id="reopen-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </div>
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
    <section className="space-y-4" role={state === "error" ? "alert" : "status"} aria-live="polite">
      <h2 className="font-heading text-2xl font-bold">
        {state === "loading"
          ? t("account.loading")
          : state === "success"
            ? t("account.emailChanged")
            : t("account.actionInvalid")}
      </h2>
      {state === "success" && <p className="text-sm text-site-muted">{t("account.emailChangedBody")}</p>}
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
    <section className="space-y-4" role={state === "error" ? "alert" : "status"} aria-live="polite">
      <h2 className="font-heading text-2xl font-bold">
        {state === "loading"
          ? t("account.loading")
          : state === "success"
            ? t("account.accountRestored")
            : t("account.actionInvalid")}
      </h2>
      {state === "success" && <p className="text-sm text-site-muted">{t("account.accountRestoredBody")}</p>}
    </section>
  );
}
