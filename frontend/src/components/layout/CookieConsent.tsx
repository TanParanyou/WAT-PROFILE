"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const t = useTranslations("CookieConsent");
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show with a slight delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="region"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-description"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
          className="relative z-40 w-full border-b border-site-border bg-site-canvas pt-[72px]"
        >
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 md:px-8">
            <div className="max-h-[min(38dvh,14rem)] overflow-y-auto p-1 text-site-foreground sm:p-2 md:flex md:items-center md:justify-between md:gap-6">
              <div className="space-y-2 md:max-w-lg">
                <h3 id="cookie-consent-title" className="font-heading text-base font-medium sm:text-lg">
                  {t("title")}
                </h3>
                <p id="cookie-consent-description" className="text-xs leading-relaxed text-site-body sm:text-sm">
                  {t("description")}{" "}
                  <Link
                    href="/privacy"
                    className="text-site-accent transition-colors underline decoration-site-accent/40 underline-offset-4 hover:decoration-site-accent"
                  >
                    {t("readMore")}
                  </Link>
                </p>
              </div>

              <div className="mt-3 flex min-w-fit gap-3 md:mt-0">
                <button
                  onClick={handleDecline}
                  className="min-h-11 flex-1 border border-site-border px-4 py-2 text-xs font-medium text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus sm:px-6 sm:text-sm"
                >
                  {t("decline")}
                </button>
                <button
                  onClick={handleAccept}
                  className="min-h-11 flex-1 bg-site-action px-4 py-2 text-xs font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus sm:px-6 sm:text-sm"
                >
                  {t("acceptAll")}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
