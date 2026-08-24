"use client";

import { useRef, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import type { AccountTab } from "../accountNavigation";

export type { AccountTab } from "../accountNavigation";

export interface AccountTabsProps {
  activeTab: AccountTab;
  onChange: (tab: AccountTab) => void | boolean;
  isDirty: boolean;
}

const tabs: readonly AccountTab[] = [
  "profile",
  "registrations",
  "donations",
  "preferences",
  "security",
];

const tabLabels: Record<
  AccountTab,
  "tabsProfile" | "tabsRegistrations" | "tabsDonations" | "tabsPreferences" | "tabsSecurity"
> = {
  profile: "tabsProfile",
  registrations: "tabsRegistrations",
  donations: "tabsDonations",
  preferences: "tabsPreferences",
  security: "tabsSecurity",
};

const tabPanelIds: Record<AccountTab, string> = {
  profile: "account-tabpanel-profile",
  registrations: "account-tabpanel-registrations",
  donations: "account-tabpanel-donations",
  preferences: "account-tabpanel-preferences",
  security: "account-tabpanel-security",
};

const tabIds: Record<AccountTab, string> = {
  profile: "account-tab-profile",
  registrations: "account-tab-registrations",
  donations: "account-tab-donations",
  preferences: "account-tab-preferences",
  security: "account-tab-security",
};

export function AccountTabs({ activeTab, onChange, isDirty }: AccountTabsProps) {
  const t = useTranslations("Account");
  const tabRefs = useRef<Partial<Record<AccountTab, HTMLButtonElement | null>>>({});

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentTab: AccountTab) => {
    const currentIndex = tabs.indexOf(currentTab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;

    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    const changed = onChange(nextTab);
    if (changed !== false) tabRefs.current[nextTab]?.focus();
  };

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label={t("account.title")}
        className="flex w-full overflow-x-auto border-b border-site-border"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              ref={(element) => {
                tabRefs.current[tab] = element;
              }}
              type="button"
              id={tabIds[tab]}
              role="tab"
              aria-selected={isActive}
              aria-controls={tabPanelIds[tab]}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab)}
              onKeyDown={(event) => handleKeyDown(event, tab)}
              className={`min-h-11 shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus sm:px-4 ${isActive
                ? "border-site-action text-site-foreground"
                : "border-transparent text-site-muted hover:border-site-border hover:text-site-foreground"
                }`}
            >
              {t(`account.${tabLabels[tab]}`)}
            </button>
          );
        })}
      </div>
      {isDirty ? (
        <div className="flex min-h-8 items-center">
          <span
            role="status"
            aria-live="polite"
            className="border border-site-border bg-site-surface px-2.5 py-1 text-xs font-semibold text-site-foreground"
          >
            {t("account.unsaved")}
          </span>
        </div>
      ) : null}
    </div>
  );
}
