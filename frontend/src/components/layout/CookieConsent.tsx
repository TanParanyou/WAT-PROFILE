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
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4 md:pb-5"
        >
          <div className="pointer-events-auto mx-auto max-w-3xl">
            <div className="max-h-[min(68dvh,24rem)] overflow-y-auto border border-site-border bg-site-canvas p-4 text-site-foreground sm:p-5 md:max-h-[min(22dvh,11rem)] md:flex md:items-center md:justify-between md:gap-6 md:p-6">
              <div className="space-y-2 md:max-w-lg">
                <h3 id="cookie-consent-title" className="font-heading text-lg font-medium sm:text-xl">
                  {t("title")}
                </h3>
                <p id="cookie-consent-description" className="text-sm leading-relaxed text-site-body">
                  {t("description")}{" "}
                  <Link
                    href="/privacy"
                    className="text-site-accent transition-colors underline decoration-site-accent/40 underline-offset-4 hover:decoration-site-accent"
                  >
                    {t("readMore")}
                  </Link>
                </p>
              </div>

              <div className="mt-4 flex min-w-fit flex-col gap-3 sm:flex-row md:mt-0">
                <button
                  onClick={handleDecline}
                  className="min-h-11 border border-site-border px-6 py-[13px] text-sm font-medium text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
                >
                  {t("decline")}
                </button>
                <button
                  onClick={handleAccept}
                  className="min-h-11 bg-site-action px-6 py-[13px] text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
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
