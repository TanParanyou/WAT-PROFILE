"use client";

import { Bell, Menu, UserRound, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/navigation";
import { usePublicSiteSettings } from "@/features/public/settings/PublicSiteSettingsProvider";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { getLocalizedText } from "@/utils/i18n";
import { siteConfig } from "@/config/site.config";
import { STATIC_ASSETS } from "@/constants/assets";
import { PublicThemeSwitcher } from "@/components/public/theme/PublicThemeSwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AccountAvatar } from "@/features/public/account/components/AccountAvatar";
import { useCommunityNotificationsQuery } from "@/features/public/community/queries";

const languageOptions = [
  { code: "th", label: "ไทย" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
] as const;

const ACCOUNT_FEATURE_ENABLED = process.env.NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED === "true";
const COMMUNITY_FEATURE_ENABLED = process.env.NEXT_PUBLIC_COMMUNITY_ENABLED === "true";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Navbar");
  const tSite = useTranslations("Site");
  const settings = usePublicSiteSettings();
  const accountSession = useAccountSession();
  const notifications = useCommunityNotificationsQuery(COMMUNITY_FEATURE_ENABLED && accountSession.status === "authenticated");

  const accountHref =
    accountSession.status === "authenticated" ? "/account" : "/account/login";

  const navLinks = [
    { name: t("home"), href: "/" },
    { name: t("about"), href: "/about" },
    { name: t("monks"), href: "/monks" },
    { name: t("events"), href: "/events" },
    { name: t("gallery"), href: "/gallery" },
    { name: t("contact"), href: "/contact" },
    ...(COMMUNITY_FEATURE_ENABLED ? [{ name: t("community"), href: "/community" }] : []),
  ];

  const accountLabel =
    accountSession.status === "authenticated" ? t("accountProfile") : t("accountLogin");

  return (
    <header className="fixed top-0 z-50 w-full border-b border-site-border bg-site-canvas text-site-foreground">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-4 px-6 sm:px-10 lg:px-[6vw]">
        <Link href="/" className="relative z-50 flex min-w-0 items-center gap-3 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">
          <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden border border-site-border bg-site-canvas">
            <Image
              src={settings.logoUrl || STATIC_ASSETS.LOGO.DEFAULT}
              alt={getLocalizedText(siteConfig.siteName, locale)}
              fill
              sizes="44px"
              priority
              className="object-cover"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-lg font-medium leading-none">{tSite("name")}</span>
            <span className="mt-1 block truncate text-[10px] font-medium tracking-widest text-site-muted">{tSite("location")}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label={t("primaryNavigation")}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`border-b px-0 py-2 text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${isActive ? "border-site-border text-site-foreground" : "border-transparent text-site-muted hover:border-site-border hover:text-site-foreground"}`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {ACCOUNT_FEATURE_ENABLED ? (
            <div className="flex items-center gap-2">
            {COMMUNITY_FEATURE_ENABLED && accountSession.status === "authenticated" ? <Link href="/community/notifications" aria-label={t("communityNotifications")} className="relative inline-flex size-11 items-center justify-center border border-site-border text-site-foreground hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"><Bell className="size-5" aria-hidden="true" />{notifications.data?.unread_count ? <span className="absolute right-1 top-1 min-w-4 rounded-full bg-site-action px-1 text-center text-[10px] leading-4 text-site-on-action">{notifications.data.unread_count > 99 ? "99+" : notifications.data.unread_count}</span> : null}</Link> : null}
            <Link href={accountHref} className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-canvas px-3 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus">
              {accountSession.status === "authenticated" && accountSession.account ? (
                <AccountAvatar account={accountSession.account} size="sm" />
              ) : (
                <UserRound className="size-5" aria-hidden="true" />
              )}
              <span>{accountLabel}</span>
            </Link></div>
          ) : null}
          <PublicThemeSwitcher />
          <LanguageSwitcher />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {ACCOUNT_FEATURE_ENABLED ? (
            <div className="flex items-center gap-2">{COMMUNITY_FEATURE_ENABLED && accountSession.status === "authenticated" ? <Link href="/community/notifications" aria-label={t("communityNotifications")} className="relative inline-flex size-11 items-center justify-center border border-site-border bg-site-canvas"><Bell className="size-5" aria-hidden="true" />{notifications.data?.unread_count ? <span className="absolute right-1 top-1 min-w-4 rounded-full bg-site-action px-1 text-center text-[10px] leading-4 text-site-on-action">{notifications.data.unread_count > 99 ? "99+" : notifications.data.unread_count}</span> : null}</Link> : null}<Link href={accountHref} className="inline-flex size-11 items-center justify-center border border-site-border bg-site-canvas transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus" aria-label={accountLabel}>
              {accountSession.status === "authenticated" && accountSession.account ? (
                <AccountAvatar account={accountSession.account} size="sm" />
              ) : (
                <UserRound className="size-5" aria-hidden="true" />
              )}
            </Link></div>
          ) : null}
          <button
            type="button"
            className="relative z-50 inline-flex size-11 items-center justify-center border border-site-border bg-site-canvas transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="public-navigation"
            aria-label={isOpen ? t("closeMenu") : t("openMenu")}
          >
            {isOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div id="public-navigation" className="border-t border-site-border bg-site-canvas px-6 py-6 sm:px-10 lg:hidden">
          <nav className="mx-auto max-w-7xl" aria-label={t("primaryNavigation")}>
            <div className="grid gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-12 items-center border-b border-site-border py-2 font-heading text-2xl font-medium text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="mt-8 flex flex-col gap-3" aria-label={t("languageNavigation")}>
              <span className="text-sm font-medium text-site-muted">เลือกภาษา / Language</span>
              <div className="flex gap-2">
                {languageOptions.map((language) => (
                  <Link
                    key={language.code}
                    href={pathname}
                    locale={language.code}
                    onClick={() => setIsOpen(false)}
                    aria-current={locale === language.code ? "page" : undefined}
                    className={`flex-1 border py-3 text-center text-sm font-semibold transition-all focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${
                      locale === language.code 
                        ? "border-site-border bg-site-action text-site-on-action hover:bg-site-action-hover"
                        : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
                    }`}
                  >
                    {language.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3" aria-label={t("theme")}>
              <span className="text-sm font-medium text-site-muted">{t("theme")}</span>
              <PublicThemeSwitcher className="w-full" variant="full" />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
