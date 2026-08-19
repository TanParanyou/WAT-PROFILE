"use client";

import { useEffect, useState } from "react";
import { Facebook, Mail, Youtube, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePublicSiteSettings } from "@/features/public/settings/PublicSiteSettingsProvider";

export default function StickySocials() {
  const t = useTranslations("Common");
  const settings = usePublicSiteSettings();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const socials = [
    {
      name: "Facebook",
      icon: Facebook,
      href: settings.social.facebook,
    },
    {
      name: "YouTube",
      icon: Youtube,
      href: settings.social.youtube,
    },
    {
      name: "Email",
      icon: Mail,
      href: settings.email
        ? `mailto:${settings.email}`
        : null,
    },
  ].filter((item) => item.href);

  const positionClass =
    settings.socialSidebarPosition === "right" ? "right-6" : "left-6";

  return (
    <>
      {/* Desktop Floating Stack (Scroll To Top + Socials) */}
      <div className={`fixed bottom-6 ${positionClass} z-40 hidden flex-col gap-3 md:flex`}>
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              type="button"
              onClick={scrollToTop}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="flex h-12 w-12 items-center justify-center border border-site-border bg-site-canvas text-site-foreground transition-colors hover:bg-site-surface hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
              title={t("scrollToTop")}
              aria-label={t("scrollToTop")}
            >
              <ChevronUp size={24} aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>

        {socials.map((social, index) => (
          <motion.a
            key={social.name}
            href={social.href || "#"}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="flex h-12 w-12 items-center justify-center border border-site-border bg-site-canvas text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
            title={social.name}
          >
            <social.icon size={24} />
          </motion.a>
        ))}
      </div>

      {/* Mobile Scroll To Top */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              type="button"
              onClick={scrollToTop}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="flex h-12 w-12 items-center justify-center border border-site-border bg-site-canvas text-site-foreground shadow-sm transition-colors hover:bg-site-surface hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
              title={t("scrollToTop")}
              aria-label={t("scrollToTop")}
            >
              <ChevronUp size={24} aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
