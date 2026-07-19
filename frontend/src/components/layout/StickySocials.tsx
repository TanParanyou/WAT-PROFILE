"use client";

import { Facebook, Mail, Youtube } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { usePublicSiteSettings } from "@/features/public/settings/PublicSiteSettingsProvider";

export default function StickySocials() {
  const settings = usePublicSiteSettings();
  const shouldReduceMotion = useReducedMotion();
  const socials = [
    {
      name: "Facebook",
      icon: Facebook,
      href: settings.social.facebook,
      color: "bg-[#1877F2]",
    },
    {
      name: "YouTube",
      icon: Youtube,
      href: settings.social.youtube,
      color: "bg-[#FF0000]",
    },
    {
      name: "Email",
      icon: Mail,
      href: settings.email
        ? `mailto:${settings.email}`
        : null,
      color: "bg-green-600",
    },
  ].filter((item) => item.href);

  const positionClass =
    settings.socialSidebarPosition === "right" ? "right-6" : "left-6";

  return (
    <div className={`fixed bottom-6 ${positionClass} z-40 flex flex-col gap-3`}>
      {socials.map((social, index) => (
        <motion.a
          key={social.name}
          href={social.href || "#"}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.name}
          initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.5 + index * 0.1, duration: 0.35, ease: "easeOut" }}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 hover:-translate-y-1 transition-all duration-300 ${social.color}`}
          title={social.name}
        >
          <social.icon aria-hidden="true" size={24} />
        </motion.a>
      ))}
    </div>
  );
}
