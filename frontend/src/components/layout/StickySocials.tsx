"use client";

import { useEffect, useState } from "react";
import { Facebook, Mail, Youtube, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePublicSiteSettings } from "@/features/public/settings/PublicSiteSettingsProvider";
import { LotusIcon } from "@/components/chatbot/LotusIcon";
import { useChatbotStore } from "@/features/public/chatbot/chatbotStore";

export default function StickySocials() {
  const t = useTranslations("Common");
  const tChatbot = useTranslations("Chatbot");
  const settings = usePublicSiteSettings();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { toggle: toggleChat, isOpen: isChatOpen } = useChatbotStore();

  const isChatbotEnabled = settings.features.chatbot;

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
      {/* Desktop Floating Stack (Scroll To Top + Socials + Chatbot at the very bottom) */}
      <div className={`fixed bottom-6 ${positionClass} z-40 hidden flex-col gap-3 md:flex print:hidden`}>
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
            aria-label={social.name}
          >
            <social.icon size={24} />
          </motion.a>
        ))}

        {/* Chatbot Button at the bottom of the stack */}
        {isChatbotEnabled && (
          <motion.button
            type="button"
            onClick={toggleChat}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + socials.length * 0.1 }}
            className={`group relative flex h-12 w-12 items-center justify-center border border-site-border bg-site-canvas text-site-foreground transition-colors hover:border-site-accent hover:bg-site-surface hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus active:scale-95 ${
              isChatOpen ? "border-site-accent bg-site-surface text-site-accent" : ""
            }`}
            title={tChatbot("triggerGreeting")}
            aria-label={tChatbot("triggerAria")}
          >
            <LotusIcon size={24} className="transition-transform group-hover:scale-110" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          </motion.button>
        )}
      </div>

      {/* Mobile Floating Stack (Scroll To Top + Chatbot at the very bottom) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 md:hidden print:hidden">
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

        {/* Chatbot Button on Mobile (at the bottom of the stack) */}
        {isChatbotEnabled && (
          <button
            type="button"
            onClick={toggleChat}
            className={`group relative flex h-12 w-12 items-center justify-center border border-site-border bg-site-canvas text-site-foreground shadow-md transition-colors hover:border-site-accent hover:bg-site-surface hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus active:scale-95 ${
              isChatOpen ? "border-site-accent bg-site-surface text-site-accent" : ""
            }`}
            title={tChatbot("triggerGreeting")}
            aria-label={tChatbot("triggerAria")}
          >
            <LotusIcon size={24} className="transition-transform group-hover:scale-110" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          </button>
        )}
      </div>
    </>
  );
}
