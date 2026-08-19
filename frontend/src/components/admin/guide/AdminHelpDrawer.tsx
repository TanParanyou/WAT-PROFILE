"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "@/navigation";
import { getGuideByRoutePath, allGuideArticles } from "@/data/admin-guide";
import { GuideIcon, getStatusBadgeClasses } from "./guideIcons";
import { useTranslations, useLocale } from "next-intl";
import { X, ExternalLink, HelpCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

interface AdminHelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminHelpDrawer({ isOpen, onClose }: AdminHelpDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Admin.guide");
  const locale = useLocale() as "th" | "en" | "de";
  const { isAdmin } = usePermission();

  // Find guide matching current pathname
  const matchedGuide = getGuideByRoutePath(pathname);
  const activeGuide =
    matchedGuide && (!matchedGuide.superAdminOnly || isAdmin)
      ? matchedGuide
      : allGuideArticles.find((a) => !a.superAdminOnly) || allGuideArticles[0];

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOpenFullGuide = () => {
    onClose();
    if (activeGuide) {
      router.push(`/admin/guide/${activeGuide.slug}`);
    } else {
      router.push("/admin/guide");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-admin-backdrop backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <aside className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-admin-surface border-l border-admin-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-admin-border flex items-center justify-between bg-admin-surface-muted">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-admin-surface border border-admin-border text-admin-action">
                <HelpCircle size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-admin-foreground">
                  {t("contextHelp")}
                </h2>
                <p className="text-xs text-admin-muted">
                  {t("contextHelpSubtitle")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-admin-muted hover:text-admin-foreground hover:bg-admin-surface border border-transparent hover:border-admin-border transition-colors min-h-10 min-w-10 flex items-center justify-center cursor-pointer"
              title={t("close")}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Active Module Card */}
            <div className="p-4 bg-admin-surface border border-admin-border space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-admin-surface-muted text-admin-foreground border border-admin-border">
                  <GuideIcon name={activeGuide.iconName} size={16} />
                </div>
                <h3 className="font-bold text-sm text-admin-foreground">
                  {activeGuide.title[locale]}
                </h3>
              </div>
              <p className="text-xs text-admin-muted leading-relaxed">
                {activeGuide.summary[locale]}
              </p>
            </div>

            {/* Quick Steps */}
            {activeGuide.quickSteps && activeGuide.quickSteps.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-admin-foreground uppercase tracking-wider">
                  <CheckCircle2 size={14} className="text-admin-action" />
                  <h4>{t("quickSteps")}</h4>
                </div>
                <ol className="space-y-2">
                  {activeGuide.quickSteps.map((step, idx) => (
                    <li
                      key={idx}
                      className="p-3 bg-admin-surface-muted/60 border border-admin-border text-xs text-admin-foreground flex items-start gap-2.5"
                    >
                      <span className="flex-shrink-0 w-4.5 h-4.5 rounded-none bg-admin-action text-white flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{step[locale]}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Status Legends */}
            {activeGuide.statusLegends && activeGuide.statusLegends.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-admin-foreground uppercase tracking-wider">
                  {t("statusLegend")}
                </h4>
                <div className="space-y-1.5">
                  {activeGuide.statusLegends.map((legend, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-admin-surface border border-admin-border text-xs space-y-1"
                    >
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] border font-medium ${getStatusBadgeClasses(
                          legend.badgeVariant,
                        )}`}
                      >
                        {legend.label[locale]}
                      </span>
                      <p className="text-admin-muted text-[11px] leading-relaxed">
                        {legend.meaning[locale]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-4 border-t border-admin-border bg-admin-surface-muted space-y-2">
            <button
              onClick={handleOpenFullGuide}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-admin-action text-white text-xs sm:text-sm font-semibold hover:bg-admin-action/90 transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus min-h-11 cursor-pointer"
            >
              <span>{t("openFullGuide")}</span>
              <ExternalLink size={15} />
            </button>
            <button
              onClick={() => {
                onClose();
                router.push("/admin/guide");
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-admin-muted hover:text-admin-foreground transition-colors cursor-pointer"
            >
              <span>{t("allArticles")}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
