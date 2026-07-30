"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/navigation";
import { usePublicSiteSettings } from "@/features/public/settings/PublicSiteSettingsProvider";
import { getLocalizedText } from "@/utils/i18n";
import { siteConfig } from "@/config/site.config";

const languageOptions = [
  { code: "th", label: "ไทย" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
] as const;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Navbar");
  const tSite = useTranslations("Site");
  const settings = usePublicSiteSettings();

  const navLinks = [
    { name: t("home"), href: "/" },
    { name: t("about"), href: "/about" },
    { name: t("monks"), href: "/monks" },
    { name: t("events"), href: "/events" },
    { name: t("gallery"), href: "/gallery" },
    { name: t("contact"), href: "/contact" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled || isOpen ? "border-b border-white/20 bg-white py-4 shadow-sm" : "bg-transparent py-6"}`}>
      <div className="container mx-auto flex min-h-11 items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="relative z-50 flex min-w-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <span className={`relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-lg transition-all ${scrolled || isOpen ? "bg-primary" : "bg-white"}`}>
            <Image
              src={settings.logoUrl || "/images/icon/logo.png"}
              alt={getLocalizedText(siteConfig.siteName, locale)}
              fill
              sizes="44px"
              className="object-cover"
            />
          </span>
          <span className="min-w-0">
            <span className={`block truncate font-heading text-lg font-bold leading-none ${scrolled || isOpen ? "text-gray-900" : "text-white"}`}>{tSite("name")}</span>
            <span className={`mt-1 block truncate text-[10px] font-medium uppercase tracking-widest ${scrolled || isOpen ? "text-gray-500" : "text-white/80"}`}>{tSite("location")}</span>
          </span>
        </Link>

        <nav className={`hidden items-center gap-1 rounded-full px-4 py-1.5 lg:flex ${scrolled ? "border border-gray-200 bg-gray-100" : "border border-white/10 bg-black/20 backdrop-blur-md"}`} aria-label={t("primaryNavigation")}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${isActive ? "bg-white text-primary shadow-sm" : scrolled ? "text-gray-600 hover:text-primary" : "text-white/90 hover:text-white"}`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1 lg:flex" aria-label={t("languageNavigation")}>
          {languageOptions.map((language) => (
            <Link
              key={language.code}
              href={pathname}
              locale={language.code}
              aria-current={locale === language.code ? "page" : undefined}
              className={`rounded-full px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${scrolled ? "bg-gray-900 text-white" : "bg-white text-primary shadow-lg"}`}
            >
              {language.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className={`relative z-50 inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:hidden ${scrolled || isOpen ? "text-gray-900 hover:bg-gray-100" : "text-white hover:bg-white/10"}`}
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="public-navigation"
          aria-label={isOpen ? t("closeMenu") : t("openMenu")}
        >
          {isOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      {isOpen ? (
        <div id="public-navigation" className="border-t border-gray-100 bg-white px-5 py-6 sm:px-8 lg:hidden">
          <nav className="mx-auto max-w-7xl" aria-label={t("primaryNavigation")}>
            <div className="grid gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-12 items-center border-b border-[#20382b]/10 py-2 font-heading text-2xl font-bold text-[#20382b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#20382b]"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-5" aria-label={t("languageNavigation")}>
              {languageOptions.map((language) => (
                <Link
                  key={language.code}
                  href={pathname}
                  locale={language.code}
                  onClick={() => setIsOpen(false)}
                  aria-current={locale === language.code ? "page" : undefined}
                  className={`min-h-11 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#20382b] ${locale === language.code ? "text-[#8a5a10]" : "text-[#5d5b53]"}`}
                >
                  {language.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
