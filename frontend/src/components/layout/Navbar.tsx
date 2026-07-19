"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site.config";
import { Menu, X, Sun, Moon, Globe } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, Variants } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/navigation";
import { routing } from "@/routing";
import { getLocalizedText } from "@/utils/i18n";
import Image from "next/image";
import { usePublicSiteSettings } from "@/features/public/settings/PublicSiteSettingsProvider";

const fallbackLogo = "/images/icon/logo.png";

function ResilientLogo({ src, alt }: { src: string; alt: string }) {
  const [logoSrc, setLogoSrc] = useState(src || fallbackLogo);

  return (
    <Image
      src={logoSrc}
      alt={alt}
      width={40}
      height={40}
      onError={() => {
        if (logoSrc !== fallbackLogo) setLogoSrc(fallbackLogo);
      }}
      className="object-cover"
    />
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const t = useTranslations("Navbar");
  const tSite = useTranslations("Site");
  const locale = useLocale();
  const settings = usePublicSiteSettings();
  const shouldReduceMotion = useReducedMotion();

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // This effect runs only on the client side after hydration,
    // so we can safely set mounted to true here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const savedTheme = window.localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    // Set initial scroll state
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const navLinks = [
    { name: t("home"), href: "/" },
    { name: t("about"), href: "/about" },
    { name: t("monks"), href: "/monks" },
    { name: t("events"), href: "/events" },
    { name: t("gallery"), href: "/gallery" },
    { name: t("contact"), href: "/contact" },
  ];

  const toggleLanguage = () => {
    const currentIndex = routing.locales.indexOf(
      locale as (typeof routing.locales)[number],
    );
    const nextIndex = (currentIndex + 1) % routing.locales.length;
    const nextLocale = routing.locales[nextIndex];
    router.replace(pathname, { locale: nextLocale });
  };

  const navVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
          delay: shouldReduceMotion ? 0 : i * 0.08,
          duration: shouldReduceMotion ? 0 : 0.35,
          ease: "easeOut",
        },
      }),
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        scrolled
          ? "bg-white dark:bg-black border-b border-white/20 dark:border-white/5 py-4 shadow-sm"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 group relative z-50">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-heading font-bold text-xl shadow-lg transition-all duration-500 group-hover:rotate-12 ${
              scrolled || isOpen
                ? "bg-primary text-white"
                : "bg-white text-primary"
            }`}
          >
            <ResilientLogo
              key={settings.logoUrl || fallbackLogo}
              src={settings.logoUrl || fallbackLogo}
              alt={getLocalizedText(siteConfig.siteName, locale)}
            />
          </div>
          <div className="flex flex-col">
            <span
              className={`font-heading font-bold text-lg leading-none tracking-tight transition-colors duration-300 ${
                scrolled || isOpen
                  ? "text-gray-900 dark:text-white"
                  : "text-white"
              }`}
            >
              {tSite("name")}
            </span>
            <span
              className={`text-[10px] uppercase tracking-widest font-medium opacity-80 ${
                scrolled || isOpen
                  ? "text-gray-500 dark:text-gray-400"
                  : "text-white/80"
              }`}
            >
              {tSite("location")}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center">
          <div
            className={`flex items-center gap-1 px-4 py-1.5 rounded-full transition-all duration-300 ${
              scrolled
                ? "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                : "bg-black/20 backdrop-blur-md border border-white/10"
            }`}
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                    isActive
                      ? scrolled
                        ? "bg-white text-primary shadow-sm"
                        : "bg-white text-primary shadow-sm"
                      : scrolled
                        ? "text-gray-600 dark:text-gray-300 hover:text-primary"
                        : "text-white/90 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white -z-10 shadow-sm"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            aria-label={t("switchTheme")}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
              scrolled
                ? "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
                : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md"
            }`}
          >
            {!mounted ? (
              <div className="h-5 w-5" aria-hidden="true" />
            ) : theme === "dark" ? (
              <Sun aria-hidden="true" size={20} />
            ) : (
              <Moon aria-hidden="true" size={20} />
            )}
          </button>

          <button
            onClick={toggleLanguage}
            aria-label={t("switchLanguage")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
              scrolled
                ? "bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200"
                : "bg-white text-primary hover:bg-white/90 shadow-lg"
            }`}
          >
            <Globe aria-hidden="true" size={16} />
            {locale.toUpperCase()}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          aria-label={isOpen ? t("closeMenu") : t("openMenu")}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          className={`md:hidden relative z-50 p-2 rounded-full transition-colors ${
            scrolled || isOpen
              ? "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
              : "text-white hover:bg-white/10"
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            {isOpen ? <X aria-hidden="true" size={24} /> : <Menu aria-hidden="true" size={24} />}
          </div>
        </button>
      </div>

      {/* Full Screen Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-white px-6 pt-32 dark:bg-zinc-950 md:hidden"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link, i) => (
                <motion.div
                  custom={i}
                  variants={navVariants}
                  initial={shouldReduceMotion ? false : "hidden"}
                  animate="visible"
                  key={link.href}
                >
                  <Link
                    href={link.href}
                    className={`flex items-center justify-between text-xl font-heading font-bold border-b border-gray-100 dark:border-gray-800 pb-4 ${
                      pathname === link.href
                        ? "text-primary border-primary/30 pl-4"
                        : "text-gray-900 dark:text-white hover:pl-4 transition-all"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                    {pathname === link.href && (
                        <motion.div
                        layoutId="active-dot"
                        className="w-2 h-2 rounded-full bg-primary"
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-auto mb-12 space-y-6"
            >
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full py-4 rounded-2xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white font-bold text-lg shadow-sm flex items-center justify-center gap-2"
              >
                {theme === "dark" ? <Sun aria-hidden="true" size={20} /> : <Moon aria-hidden="true" size={20} />}
                <span>
                  {theme === "dark"
                    ? t("switchToLight")
                    : t("switchToDark")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  toggleLanguage();
                  setIsOpen(false);
                }}
                aria-label={t("switchLanguage")}
                className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
              >
                <Globe aria-hidden="true" size={20} />
                {t("switchLanguage")} ({locale.toUpperCase()})
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
