"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const languageOptions = [
  { code: "th", label: "ไทย", fullName: "ภาษาไทย" },
  { code: "en", label: "English", fullName: "English" },
  { code: "de", label: "Deutsch", fullName: "Deutsch" },
] as const;

export function AdminLanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { locale, changeLocale } = useAdminLocale();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = languageOptions.find((l) => l.code === locale) || languageOptions[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-11 items-center gap-1.5 border border-admin-control-border bg-admin-surface px-3 py-0 text-sm font-medium text-admin-foreground transition-colors hover:bg-admin-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe size={16} />
        <span>{currentLang.label}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-40 origin-top-right overflow-hidden border border-admin-border bg-admin-surface shadow-lg focus:outline-none z-50"
          >
            <div className="p-1">
              {languageOptions.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => {
                    changeLocale(language.code);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                    locale === language.code
                      ? "bg-admin-action font-medium text-admin-on-action hover:bg-admin-action-hover"
                      : "text-admin-foreground hover:bg-admin-surface-muted"
                  }`}
                >
                  <span>{language.label}</span>
                  {locale === language.code && <Check size={16} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
