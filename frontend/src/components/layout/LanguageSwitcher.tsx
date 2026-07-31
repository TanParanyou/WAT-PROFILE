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

interface LanguageSwitcherProps {
  scrolled?: boolean;
}

export function LanguageSwitcher({ scrolled }: LanguageSwitcherProps) {
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
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
          scrolled
            ? "border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
            : "border border-white/20 bg-black/20 text-white backdrop-blur-md hover:bg-black/30"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe size={16} />
        <span>{currentLang.label}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-40 origin-top-right overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none"
          >
            <div className="p-1.5 space-y-0.5">
              {languageOptions.map((language) => (
                <Link
                  key={language.code}
                  href={pathname}
                  locale={language.code}
                  onClick={() => setIsOpen(false)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    locale === language.code
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-700 hover:bg-gray-100"
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
