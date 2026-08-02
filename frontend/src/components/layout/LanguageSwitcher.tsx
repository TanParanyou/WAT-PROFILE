"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, usePathname } from "@/navigation";
import { useLocale } from "next-intl";

const languageOptions = [
  { code: "th", label: "ไทย", fullName: "ภาษาไทย" },
  { code: "en", label: "English", fullName: "English" },
  { code: "de", label: "Deutsch", fullName: "Deutsch" },
] as const;

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const pathname = usePathname();

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
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-11 items-center gap-1.5 border border-site-border bg-site-canvas px-3 py-0 text-sm font-medium text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
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
            className="absolute right-0 mt-2 w-40 origin-top-right overflow-hidden border border-site-border bg-site-canvas focus:outline-none"
          >
            <div className="p-1">
              {languageOptions.map((language) => (
                <Link
                  key={language.code}
                  href={pathname}
                  locale={language.code}
                  onClick={() => setIsOpen(false)}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                    locale === language.code
                      ? "bg-site-action font-medium text-site-on-action"
                      : "text-site-foreground hover:bg-site-surface"
                  }`}
                >
                  <span>{language.label}</span>
                  {locale === language.code && <Check size={16} />}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
