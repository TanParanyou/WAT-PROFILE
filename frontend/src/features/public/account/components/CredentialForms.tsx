"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ChevronDown, KeyRound } from "lucide-react";
import { useAccountSession } from "../AccountSessionProvider";
import { useAccountReauth } from "../hooks/useAccountReauth";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { EmailChangeForm } from "./EmailChangeForm";

const actionClass =
  "inline-flex min-h-11 items-center gap-2 px-5 py-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60";

type CredentialSection = "password" | "email";

interface CredentialAccordionItemProps {
  id: CredentialSection;
  title: string;
  summary: string;
  badge?: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function CredentialAccordionItem({
  id,
  title,
  summary,
  badge,
  expanded,
  onToggle,
  children,
}: CredentialAccordionItemProps) {
  const headingId = `account-credentials-${id}-toggle`;
  const panelId = `account-credentials-${id}-panel`;

  return (
    <section className="border border-site-border" aria-labelledby={headingId}>
      <h3 id={headingId}>
        <button
          type="button"
          className={`flex min-h-16 w-full items-center justify-between gap-4 text-left focus-visible:outline-3 focus-visible:outline-site-focus ${
            expanded
              ? "border-2 border-site-accent bg-site-surface"
              : "border border-site-border bg-site-canvas"
          }`}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="min-w-0 px-4 py-3">
            <span className="flex flex-wrap items-center gap-2 font-semibold text-site-foreground">
              {title}
              {badge ? (
                <span className="border border-site-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-site-accent">
                  {badge}
                </span>
              ) : null}
            </span>
            <span className="mt-1 block text-sm font-normal text-site-muted">
              {summary}
            </span>
          </span>
          <span className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center border border-site-border bg-site-canvas">
            <ChevronDown
              className={`h-5 w-5 text-site-muted transition-transform duration-150 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </span>
        </button>
      </h3>
      <div id={panelId} hidden={!expanded} aria-labelledby={headingId}>
        <div className="border-t-2 border-site-accent p-4 sm:p-6">
          {children}
        </div>
      </div>
    </section>
  );
}

export function CredentialForms() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { account } = useAccountSession();
  const { requireRecentAuth } = useAccountReauth();
  const googleOnly = account ? !account.providers.includes("password") : false;
  const setupPassword = searchParams.get("setup") === "password";
  const [expandedSection, setExpandedSection] =
    useState<CredentialSection | null>(() =>
      setupPassword ? "password" : null,
    );
  const [setupPromptDismissed, setSetupPromptDismissed] = useState(false);

  return (
    <section
      className="space-y-8 border-t border-site-border pt-6"
      aria-labelledby="account-credentials-title"
    >
      <div>
        <h2
          id="account-credentials-title"
          className="font-heading text-xl font-bold text-site-foreground"
        >
          {t("account.credentialsTitle")}
        </h2>
        <p className="mt-1 text-sm text-site-muted">
          {t("account.credentialsDescription")}
        </p>
      </div>
      {googleOnly && !setupPromptDismissed ? (
        <div className="border-2 border-site-accent bg-site-surface p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-site-accent bg-site-canvas text-site-accent">
              <KeyRound className="h-5 w-5" aria-hidden />
            </span>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-site-foreground">
                  {t("account.googlePasswordSetupTitle")}
                </h3>
                <span className="border border-site-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-site-accent">
                  {t("account.googlePasswordSetupRecommended")}
                </span>
              </div>
              <p className="text-sm text-site-muted">
                {t("account.googlePasswordSetupBody")}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className={`${actionClass} bg-site-action text-site-on-action`}
              onClick={() => {
                setSetupPromptDismissed(true);
                setExpandedSection("password");
                requestAnimationFrame(() =>
                  document
                    .getElementById("account-credentials-password-toggle")
                    ?.focus(),
                );
              }}
            >
              {t("account.googlePasswordSetupAction")}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center px-3 py-2 text-sm font-semibold text-site-muted underline decoration-site-border underline-offset-4 hover:text-site-foreground focus-visible:outline-3 focus-visible:outline-site-focus"
              onClick={() => setSetupPromptDismissed(true)}
            >
              {t("account.googlePasswordSetupSkip")}
            </button>
          </div>
        </div>
      ) : null}
      <div className="space-y-3">
        <CredentialAccordionItem
          id="password"
          title={t("account.passwordTitle")}
          summary={t("account.passwordDescription")}
          badge={
            googleOnly ? t("account.googlePasswordSetupRecommended") : undefined
          }
          expanded={expandedSection === "password"}
          onToggle={() =>
            setExpandedSection((current) =>
              current === "password" ? null : "password",
            )
          }
        >
          <PasswordChangeForm requireRecentAuth={requireRecentAuth} />
        </CredentialAccordionItem>
        <CredentialAccordionItem
          id="email"
          title={t("account.emailChangeTitle")}
          summary={t("account.emailChangeDescription")}
          expanded={expandedSection === "email"}
          onToggle={() =>
            setExpandedSection((current) =>
              current === "email" ? null : "email",
            )
          }
        >
          <EmailChangeForm
            locale={locale}
            requireRecentAuth={requireRecentAuth}
          />
        </CredentialAccordionItem>
      </div>
    </section>
  );
}
