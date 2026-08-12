"use client";

import { Facebook, Mail, Youtube } from "lucide-react";
import { motion } from "framer-motion";
import { usePublicSiteSettings } from "@/features/public/settings/PublicSiteSettingsProvider";

export default function StickySocials() {
  const settings = usePublicSiteSettings();
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
    <div className={`fixed bottom-6 ${positionClass} z-40 hidden flex-col gap-3 md:flex`}>
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
  );
}
