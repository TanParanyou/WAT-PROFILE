"use client";

import React from "react";
import { ExternalLink, Phone, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

export function TestLinkButton({ href, label }: { href?: string; label?: string }) {
  const t = useTranslations("Admin.previews");
  if (!href || href.trim() === "") return null;
  
  let validUrl = href.trim();
  if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://") && !validUrl.startsWith("/")) {
    validUrl = `https://${validUrl}`;
  }

  const displayLabel = label || t("testLink");

  return (
    <a
      href={validUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-admin-action hover:underline focus-visible:outline-2 focus-visible:outline-admin-focus"
      title={displayLabel}
    >
      <ExternalLink size={13} />
      <span>{displayLabel}</span>
    </a>
  );
}

export function TestPhoneButton({ phone }: { phone?: string }) {
  const t = useTranslations("Admin.previews");
  if (!phone || phone.trim() === "") return null;
  return (
    <a
      href={`tel:${phone.replace(/\s+/g, "")}`}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-admin-action hover:underline"
    >
      <Phone size={13} />
      <span>{t("testCall", { phone })}</span>
    </a>
  );
}

export function TestEmailButton({ email }: { email?: string }) {
  const t = useTranslations("Admin.previews");
  if (!email || email.trim() === "") return null;
  return (
    <a
      href={`mailto:${email.trim()}`}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-admin-action hover:underline"
    >
      <Mail size={13} />
      <span>{t("testMail", { email })}</span>
    </a>
  );
}
