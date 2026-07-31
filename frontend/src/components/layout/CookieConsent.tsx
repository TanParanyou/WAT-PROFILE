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
            <div className="border border-[#333] bg-[#fffef2] p-6 text-[#333] md:flex md:items-center md:justify-between md:gap-8 md:p-8">
              <div className="space-y-3 md:max-w-xl">
                <h3 className="text-xl font-heading font-medium">
                  {t("title")}
                </h3>
                <p className="text-sm leading-relaxed text-[#505050]">
                  {t("description")}{" "}
                  <Link
                    href="/privacy"
                    className="text-[#945c26] transition-colors underline decoration-[#945c26]/40 underline-offset-4 hover:decoration-[#945c26]"
                  >
                    {t("readMore")}
                  </Link>
                </p>
              </div>

              <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3 min-w-fit">
                <button
                  onClick={handleDecline}
                  className="border border-[#333] px-6 py-[13px] text-sm font-medium text-[#333] transition-colors hover:bg-[#f7ecdd]"
                >
                  {t("decline")}
                </button>
                <button
                  onClick={handleAccept}
                  className="bg-[#333] px-6 py-[13px] text-sm font-semibold text-[#fffef2] transition-colors hover:bg-[#242424]"
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
