"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const t = useTranslations("CookieConsent");

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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-100 px-4 pb-4 md:pb-6 pointer-events-none"
        >
          <div className="container mx-auto max-w-5xl pointer-events-auto">
            <div className="border border-site-border bg-site-canvas p-6 text-site-foreground md:flex md:items-center md:justify-between md:gap-8 md:p-8">
              <div className="space-y-3 md:max-w-xl">
                <h3 className="text-xl font-heading font-medium">
                  {t("title")}
                </h3>
                <p className="text-sm leading-relaxed text-site-body">
                  {t("description")}{" "}
                  <Link
                    href="/privacy"
                    className="text-site-accent transition-colors underline decoration-site-accent/40 underline-offset-4 hover:decoration-site-accent"
                  >
                    {t("readMore")}
                  </Link>
                </p>
              </div>

              <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3 min-w-fit">
                <button
                  onClick={handleDecline}
                  className="border border-site-border px-6 py-[13px] text-sm font-medium text-site-foreground transition-colors hover:bg-site-surface"
                >
                  {t("decline")}
                </button>
                <button
                  onClick={handleAccept}
                  className="bg-site-action px-6 py-[13px] text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover"
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
