"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { SiteModal } from "@/components/public/modal";
import { useGoogleAccountLink } from "@/features/public/account/hooks/useGoogleAccountLink";
import { useAccountErrorMessage } from "@/features/public/account/hooks";
import type { Account } from "@/features/public/account/types";

const primaryActionClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";
const dangerActionClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 border border-site-danger bg-site-canvas px-6 py-[13px] font-semibold text-site-danger transition-colors hover:bg-site-danger-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export function AccountProviderMethods({ account }: { account: Account }) {
  const t = useTranslations("Account");
  const getErrorMessage = useAccountErrorMessage();
  const { status, loading, redirecting, unlinking, error, startLink, unlink } =
    useGoogleAccountLink();

  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    if (!successOpen) return;
    const timer = window.setTimeout(() => setSuccessOpen(false), 1800);
    return () => window.clearTimeout(timer);
  }, [successOpen]);

  const hasPassword = account.providers.includes("password");
  const connected = status?.connected ?? account.providers.includes("google");
  const pending = status?.pending ?? false;
  const cooldownSeconds = status?.retry_after_seconds ?? 0;

  const handleStart = async () => {
    await startLink();
  };

  const handleUnlink = async () => {
    if (await unlink()) setSuccessOpen(true);
  };

  return (
    <section aria-labelledby="account-providers-title" className="space-y-4">
      <h2
        id="account-providers-title"
        className="font-heading text-xl font-bold text-site-foreground"
      >
        {t("account.providersLabel")}
      </h2>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 border border-site-danger bg-site-danger-surface p-3 text-sm text-site-danger"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{getErrorMessage(error)}</span>
        </div>
      )}

      {loading ? (
        <p role="status" aria-live="polite" className="text-sm text-site-muted">
          {t("account.loading")}
        </p>
      ) : connected ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 border border-site-border bg-site-surface p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-site-accent bg-site-canvas text-site-accent">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-site-foreground">
                {t("account.providerGoogleLabel")}
              </p>
              <p className="mt-1 text-sm text-site-muted">
                {t("account.providerConnectedStatus")}
              </p>
            </div>
          </div>
          {hasPassword ? (
            <button
              type="button"
              className={dangerActionClass}
              onClick={() => void handleUnlink()}
              disabled={unlinking}
            >
              {unlinking && (
                <Loader2
                  className="h-5 w-5 animate-spin motion-reduce:animate-none"
                  aria-hidden
                />
              )}
              {t("account.providerDisconnect")}
            </button>
          ) : (
            <p className="border-l-2 border-site-accent pl-3 text-sm text-site-muted">
              {t("account.providerDisconnectNeedsPassword")}
            </p>
          )}
        </div>
      ) : pending ? (
        <div className="space-y-4">
          <p className="text-sm text-site-muted">
            {t("account.providerPending")}
          </p>
          {cooldownSeconds > 0 && (
            <p className="text-sm text-site-muted">
              {t("account.providerCooldown", { seconds: cooldownSeconds })}
            </p>
          )}
          <button
            type="button"
            className={primaryActionClass}
            onClick={handleStart}
            disabled={cooldownSeconds > 0 || redirecting}
          >
            {redirecting && (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            )}
            {redirecting
              ? t("google.redirecting")
              : t("account.providerConnect")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-site-muted">
            {t("account.providerIntro")}
          </p>
          <button
            type="button"
            className={primaryActionClass}
            onClick={handleStart}
            disabled={redirecting}
          >
            {redirecting && (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            )}
            {redirecting
              ? t("google.redirecting")
              : t("account.providerConnect")}
          </button>
        </div>
      )}

      <SiteModal
        open={successOpen}
        title={t("account.providerDisconnectSuccessTitle")}
        closeLabel={t("account.providerSuccessClose")}
        onClose={() => setSuccessOpen(false)}
      >
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 border border-site-border bg-site-surface p-4 text-site-foreground"
        >
          <CheckCircle2
            className="h-6 w-6 shrink-0 text-site-accent"
            aria-hidden
          />
          <p className="text-sm leading-6">
            {t("account.providerDisconnectSuccessBody")}
          </p>
        </div>
      </SiteModal>
    </section>
  );
}
