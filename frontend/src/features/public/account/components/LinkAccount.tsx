"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { useSearchParams } from "next/navigation";
import {
  confirmGoogleLink,
  toAccountApiError,
} from "@/features/public/account/api";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { buildAccountHref } from "../accountNavigation";
import {
  classifyAccountActionError,
  type AccountActionState,
} from "../actionErrors";
import { useRetryCountdown } from "../hooks/useRetryCountdown";
import { AccountFeedback } from "./AccountFeedback";
import { AccountFlowFooter } from "./AccountFlowFooter";

const actionClass =
  "inline-flex min-h-11 items-center justify-center bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus";
const secondaryActionClass =
  "inline-flex min-h-11 items-center justify-center border border-site-border px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-canvas-strong focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus";

export function LinkAccountContent() {
  const t = useTranslations("Account");
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const token = searchParams.get("token") ?? "";
  const { adoptCurrentSession } = useAccountSession();
  const [state, setState] = useState<
    AccountActionState | { kind: "approval_sent" }
  >(
    status === "approval_sent"
      ? { kind: "approval_sent" }
      : token
        ? { kind: "loading" }
        : { kind: "invalid" },
  );
  const ranTokenRef = useRef<string | null>(null);

  const executeAction = useCallback(async () => {
    await Promise.resolve();
    setState({ kind: "loading" });
    try {
      await confirmGoogleLink(token);
      await adoptCurrentSession();
      setState({ kind: "success" });
    } catch (error: unknown) {
      setState(
        classifyAccountActionError(toAccountApiError(error), Boolean(token)),
      );
    }
  }, [adoptCurrentSession, token]);

  useEffect(() => {
    if (!token || ranTokenRef.current === token) return;
    const timer = window.setTimeout(() => {
      if (ranTokenRef.current === token) return;
      ranTokenRef.current = token;
      void executeAction();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [executeAction, token]);

  const remaining = useRetryCountdown(
    state.kind === "rate_limited" ? state.retryAfterSeconds : 0,
  );

  if (state.kind === "approval_sent") {
    return (
      <div className="space-y-4">
        <AccountFeedback
          state={{ kind: "success", title: t("link.approvalSentTitle"), body: t("link.approvalSentBody") }}
        />
        <AccountFlowFooter
          primary={
            <Link href="/account/login" className={actionClass}>
              {t("link.loginLink")}
            </Link>
          }
        />
      </div>
    );
  }

  if (state.kind === "loading") {
    return (
      <AccountFeedback state={{ kind: "loading", message: t("link.confirming") }} />
    );
  }

  if (state.kind === "success") {
    return (
      <div className="space-y-4">
        <AccountFeedback state={{ kind: "success", title: t("link.successTitle"), body: t("link.successBody") }} />
        <AccountFlowFooter
          primary={
            <Link href={buildAccountHref("security")} className={actionClass}>
              {t("account.tabsSecurity")}
            </Link>
          }
          secondary={
            <Link href="/account" className={secondaryActionClass}>
              {t("account.title")}
            </Link>
          }
        />
      </div>
    );
  }

  if (state.kind === "transient" || state.kind === "rate_limited") {
    return (
      <div className="space-y-4">
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
          className={actionClass}
        >
          {t("account.actionRetry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AccountFeedback state={{ kind: "error", message: `${t("link.invalidTitle")}. ${t("link.invalidBody")}` }} />
      <AccountFlowFooter
        primary={
          <Link href="/account/login" className={actionClass}>
            {t("link.loginLink")}
          </Link>
        }
        secondary={
          <Link href={buildAccountHref("security")} className={secondaryActionClass}>
            {t("account.tabsSecurity")}
          </Link>
        }
      />
    </div>
  );
}
