"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * Public-themed shell for account pages. Site tokens, 44px controls and the
 * localized page title come from here so every account page stays consistent.
 */
export function AccountShell({ children }: { children: ReactNode }) {
  const t = useTranslations("Account");
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-heading text-3xl font-bold text-site-foreground">{t("title")}</h1>
          <p className="text-sm text-site-muted">{t("subtitle")}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
