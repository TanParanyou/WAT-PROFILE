"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Link, usePathname } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X, UserRound, Bell, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { PublicThemeSwitcher } from "@/components/public/theme/PublicThemeSwitcher";
import { siteConfig } from "@/config/site.config";
import { getLocalizedText } from "@/utils/i18n";
import { STATIC_ASSETS } from "@/constants/assets";
import { usePublicSiteSettings } from "@/features/public/settings/PublicSiteSettingsProvider";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { AccountAvatar } from "@/features/public/account/components/AccountAvatar";
import { useCommunityNotificationsQuery } from "@/features/public/community/queries";
import PwaInstallButton from "@/components/pwa/PwaInstallButton";

const languageOptions = [
  { code: "th", label: "ไทย" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
] as const;

type NavDropdownItem = {
  name: string;
  href: string;
};

type NavItem =
  | { type: "link"; name: string; href: string }
  | { type: "dropdown"; name: string; items: NavDropdownItem[] };

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const aboutDropdownRef = useRef<HTMLDivElement>(null);

  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Navbar");
  const tSite = useTranslations("Site");
  const settings = usePublicSiteSettings();
  const accountSession = useAccountSession();

  const isAccountEnabled = settings.features?.accountAuth ?? (process.env.NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED === "true");
  const isCommunityEnabled = settings.features?.communityRead ?? (process.env.NEXT_PUBLIC_COMMUNITY_ENABLED === "true");

  const notifications = useCommunityNotificationsQuery(isCommunityEnabled && accountSession.status === "authenticated");

  const accountHref =
    accountSession.status === "authenticated" ? "/account" : "/account/login";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(event.target as Node)) {
        setAboutDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAboutDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navItems: NavItem[] = [
    { type: "link", name: t("home"), href: "/" },
    {
      type: "dropdown",
      name: t("about"),
      items: [
        { name: t("aboutOverview"), href: "/about" },
        { name: t("monks"), href: "/monks" },
        { name: t("gallery"), href: "/gallery" },
      ],
    },
    { type: "link", name: t("events"), href: "/events" },
    { type: "link", name: t("chanting"), href: "/chanting" },
    ...(isCommunityEnabled ? [{ type: "link" as const, name: t("community"), href: "/community" }] : []),
    { type: "link", name: t("contact"), href: "/contact" },
  ];

  const accountLabel =
    accountSession.status === "authenticated" ? t("accountProfile") : t("accountLogin");

  return (
    <header className="fixed top-0 z-50 w-full border-b border-site-border bg-site-canvas text-site-foreground print:hidden">
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
          {navItems.map((item) => {
            if (item.type === "link") {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`border-b px-0 py-2 text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${isActive
                      ? "border-site-border text-site-foreground"
                      : "border-transparent text-site-muted hover:border-site-border hover:text-site-foreground"
                    }`}
                >
                  {item.name}
                </Link>
              );
            }

            // Dropdown menu
            const isGroupActive = item.items.some((sub) => pathname === sub.href);
            return (
              <div key={item.name} className="relative" ref={aboutDropdownRef}>
                <button
                  type="button"
                  onClick={() => setAboutDropdownOpen(!aboutDropdownOpen)}
                  onMouseEnter={() => setAboutDropdownOpen(true)}
                  aria-expanded={aboutDropdownOpen}
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1 border-b px-0 py-2 text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${isGroupActive || aboutDropdownOpen
                      ? "border-site-border text-site-foreground"
                      : "border-transparent text-site-muted hover:border-site-border hover:text-site-foreground"
                    }`}
                >
                  <span>{item.name}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${aboutDropdownOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence>
                  {aboutDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      onMouseLeave={() => setAboutDropdownOpen(false)}
                      className="absolute left-0 mt-2 w-52 origin-top-left overflow-hidden border border-site-border bg-site-canvas shadow-md focus:outline-none"
                    >
                      <div className="p-1">
                        {item.items.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => setAboutDropdownOpen(false)}
                              aria-current={isSubActive ? "page" : undefined}
                              className={`flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors ${isSubActive
                                  ? "bg-site-action font-medium text-site-on-action"
                                  : "text-site-foreground hover:bg-site-surface"
                                }`}
                            >
                              <span>{sub.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAccountEnabled ? (
            <div className="flex items-center gap-2">
              {isCommunityEnabled && accountSession.status === "authenticated" ? (
                <Link
                  href="/community/notifications"
                  aria-label={t("communityNotifications")}
                  className="relative inline-flex size-11 items-center justify-center border border-site-border text-site-foreground hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
                >
                  <Bell className="size-5" aria-hidden="true" />
                  {notifications.data?.unread_count ? (
                    <span className="absolute right-1 top-1 min-w-4 rounded-full bg-site-action px-1 text-center text-[10px] leading-4 text-site-on-action">
                      {notifications.data.unread_count > 99 ? "99+" : notifications.data.unread_count}
                    </span>
                  ) : null}
                </Link>
              ) : null}
              <Link
                href={accountHref}
                className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-canvas px-3 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
              >
                {accountSession.status === "authenticated" && accountSession.account ? (
                  <AccountAvatar account={accountSession.account} size="sm" />
                ) : (
                  <UserRound className="size-5" aria-hidden="true" />
                )}
                <span>{accountLabel}</span>
              </Link>
            </div>
          ) : null}
          <PublicThemeSwitcher />
          <LanguageSwitcher />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {isAccountEnabled ? (
            <div className="flex items-center gap-2">
              {isCommunityEnabled && accountSession.status === "authenticated" ? (
                <Link
                  href="/community/notifications"
                  aria-label={t("communityNotifications")}
                  className="relative inline-flex size-11 items-center justify-center border border-site-border bg-site-canvas"
                >
                  <Bell className="size-5" aria-hidden="true" />
                  {notifications.data?.unread_count ? (
                    <span className="absolute right-1 top-1 min-w-4 rounded-full bg-site-action px-1 text-center text-[10px] leading-4 text-site-on-action">
                      {notifications.data.unread_count > 99 ? "99+" : notifications.data.unread_count}
                    </span>
                  ) : null}
                </Link>
              ) : null}
              <Link
                href={accountHref}
                className="inline-flex size-11 items-center justify-center border border-site-border bg-site-canvas transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
                aria-label={accountLabel}
              >
                {accountSession.status === "authenticated" && accountSession.account ? (
                  <AccountAvatar account={accountSession.account} size="sm" />
                ) : (
                  <UserRound className="size-5" aria-hidden="true" />
                )}
              </Link>
            </div>
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
              {navItems.map((item) => {
                if (item.type === "link") {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-12 items-center border-b border-site-border py-2 font-heading text-2xl font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${isActive ? "text-site-foreground font-semibold" : "text-site-foreground"
                        }`}
                    >
                      {item.name}
                    </Link>
                  );
                }

                // Mobile Dropdown / Sub-menu section
                const isGroupActive = item.items.some((sub) => pathname === sub.href);
                return (
                  <div key={item.name} className="border-b border-site-border py-2">
                    <button
                      type="button"
                      onClick={() => setMobileAboutOpen((prev) => !prev)}
                      className={`flex min-h-12 w-full items-center justify-between font-heading text-2xl font-medium focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${isGroupActive ? "text-site-foreground font-semibold" : "text-site-foreground"
                        }`}
                      aria-expanded={mobileAboutOpen}
                    >
                      <span>{item.name}</span>
                      <ChevronDown
                        size={22}
                        className={`transition-transform duration-200 ${mobileAboutOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {mobileAboutOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-4 pt-1"
                        >
                          {item.items.map((sub) => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setIsOpen(false)}
                                aria-current={isSubActive ? "page" : undefined}
                                className={`flex min-h-11 items-center border-b border-site-border/40 py-2 text-lg font-medium transition-colors ${isSubActive
                                    ? "text-site-foreground font-bold"
                                    : "text-site-muted hover:text-site-foreground"
                                  }`}
                              >
                                {sub.name}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
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
                    className={`flex-1 border py-3 text-center text-sm font-semibold transition-all focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${locale === language.code
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

            <div className="mt-6">
              <PwaInstallButton variant="mobile-menu" onInstalled={() => setIsOpen(false)} />
            </div>
          </nav>
        </div>
      ) : null}

    </header>
  );
}
