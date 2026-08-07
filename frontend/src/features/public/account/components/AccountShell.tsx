"use client";

import type { ReactNode } from "react";
import { AccountBackButton } from "./AccountBackButton";
import { AccountPageHeader, type AccountPageContext } from "./AccountPageHeader";

/**
 * Public-themed shell for account pages. Site tokens, 44px controls and the
 * localized page title come from here so every account page stays consistent.
 */
export function AccountShell({
  context,
  children,
}: {
  context: AccountPageContext;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <header aria-labelledby="account-page-title" className="space-y-4">
          <AccountBackButton href={context.backHref} label={context.backLabel} />
          <AccountPageHeader context={context} />
        </header>
        {children}
      </div>
    </div>
  );
}
