"use client";

import React from "react";
import { Share2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

export function SocialsPreview({
  socials = {},
}: {
  socials?: {
    facebook?: string;
    instagram?: string;
    messenger?: string;
    line?: string;
    youtube?: string;
  };
}) {
  const t = useTranslations("Admin.previews");
  const activeCount = Object.values(socials).filter((v) => v && v.trim()).length;

  return (
    <div className="space-y-4 border border-admin-border p-5 bg-admin-surface rounded-none">
      <div className="flex items-center justify-between border-b border-admin-border pb-3">
        <div className="flex items-center gap-2">
          <Share2 size={18} className="text-admin-action" />
          <h4 className="text-sm font-semibold text-admin-foreground">
            {t("socialsTitle", { count: activeCount })}
          </h4>
        </div>
      </div>

      <div className="p-4 bg-admin-surface-muted border border-admin-border flex flex-wrap items-center gap-3">
        {socials.facebook && socials.facebook.trim() && (
          <a
            href={socials.facebook}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: "#1877F2", color: "#ffffff" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-none hover:opacity-90 transition-opacity"
          >
            <Share2 size={14} /> Facebook Page
          </a>
        )}

        {socials.instagram && socials.instagram.trim() && (
          <a
            href={socials.instagram}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: "linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)", color: "#ffffff" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-none hover:opacity-90 transition-opacity"
          >
            <Share2 size={14} /> Instagram
          </a>
        )}

        {socials.messenger && socials.messenger.trim() && (
          <a
            href={socials.messenger}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: "#0084FF", color: "#ffffff" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-none hover:opacity-90 transition-opacity"
          >
            <Mail size={14} /> Messenger
          </a>
        )}

        {socials.line && socials.line.trim() && (
          <a
            href={socials.line.startsWith("http") ? socials.line : `https://line.me/R/ti/p/${socials.line}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: "#00B900", color: "#ffffff" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-none hover:opacity-90 transition-opacity"
          >
            <Share2 size={14} /> LINE ({socials.line})
          </a>
        )}

        {socials.youtube && socials.youtube.trim() && (
          <a
            href={socials.youtube}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: "#FF0000", color: "#ffffff" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-none hover:opacity-90 transition-opacity"
          >
            <Share2 size={14} /> YouTube Channel
          </a>
        )}

        {activeCount === 0 && (
          <span className="text-xs text-admin-muted py-1">
            {t("noSocials")}
          </span>
        )}
      </div>
    </div>
  );
}
