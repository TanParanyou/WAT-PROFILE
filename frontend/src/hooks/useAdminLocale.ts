"use client";

import { useState, useEffect } from "react";

const ADMIN_LOCALE_KEY = "admin-locale";

export const useAdminLocale = () => {
  // Default to Thai ('th')
  const [locale, setLocale] = useState("th");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_LOCALE_KEY);
    if (saved) {
      setTimeout(() => setLocale(saved), 0);
    }
    setTimeout(() => setMounted(true), 0);
  }, []);

  const changeLocale = (newLocale: string) => {
    setLocale(newLocale);
    localStorage.setItem(ADMIN_LOCALE_KEY, newLocale);
    // We reload the page to ensure all server/client components get the new locale setting properly
    // without risking hydration mismatch or complex context passing for server components.
    window.location.reload();
  };

  return { locale, changeLocale, mounted };
};
