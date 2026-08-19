"use client";

import React, { useMemo, useState, useRef } from "react";
import { Search, X, ChevronRight, FileText } from "lucide-react";
import { searchGuideArticles, allGuideArticles } from "@/data/admin-guide";
import { GuideIcon } from "./guideIcons";
import { useRouter } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import { usePermission } from "@/hooks/usePermission";

interface GuideSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideSearchModal({ isOpen, onClose }: GuideSearchModalProps) {
  const t = useTranslations("Admin.guide");
  const locale = useLocale() as "th" | "en" | "de";
  const router = useRouter();
  const { isSuperAdmin } = usePermission();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive results using useMemo instead of setting state inside useEffect
  const results = useMemo(() => {
    const rawResults = !query.trim()
      ? allGuideArticles.slice(0, 6)
      : searchGuideArticles(query, locale);

    return rawResults.filter((a) => !a.superAdminOnly || isSuperAdmin);
  }, [query, locale, isSuperAdmin]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex].slug);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelect = (slug: string) => {
    onClose();
    router.push(`/admin/guide/${slug}`);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("searchModalTitle")}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-admin-backdrop backdrop-blur-xs"
    >
      <div
        className="w-full max-w-2xl bg-admin-surface border border-admin-border shadow-2xl rounded-none overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-admin-border bg-admin-surface">
          <Search size={18} className="text-admin-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={t("searchPlaceholder")}
            autoFocus
            className="w-full bg-transparent text-admin-foreground placeholder:text-admin-muted text-sm sm:text-base outline-hidden border-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
              }}
              className="p-1 text-admin-muted hover:text-admin-foreground"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono bg-admin-surface-muted border border-admin-border text-admin-muted">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-admin-border/40">
          {results.length > 0 ? (
            results.map((article, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={article.slug}
                  onClick={() => handleSelect(article.slug)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-admin-selected text-admin-selected-foreground"
                      : "hover:bg-admin-surface-muted text-admin-foreground"
                  }`}
                >
                  <div
                    className={`p-2 border rounded-none flex-shrink-0 ${
                      isSelected
                        ? "bg-admin-surface text-admin-foreground border-admin-border"
                        : "bg-admin-surface-muted text-admin-muted border-admin-border"
                    }`}
                  >
                    <GuideIcon name={article.iconName} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold truncate">
                        {article.title[locale]}
                      </h4>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-admin-surface-muted border border-admin-border text-admin-muted">
                        {article.category}
                      </span>
                    </div>
                    <p className="text-xs text-admin-muted line-clamp-1 mt-0.5">
                      {article.summary[locale]}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`flex-shrink-0 self-center ${
                      isSelected ? "text-admin-selected-foreground" : "text-admin-muted"
                    }`}
                  />
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-admin-muted">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t("noResults")}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-admin-surface-muted border-t border-admin-border text-[11px] text-admin-muted">
          <div className="flex items-center gap-2">
            <span>{t("keyboardNavSelect")}</span>
            <span>•</span>
            <span>{t("keyboardNavOpen")}</span>
          </div>
          <div>{t("articlesCount", { count: results.length })}</div>
        </div>
      </div>
    </div>
  );
}
