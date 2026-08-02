"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-admin-theme"
      defaultTheme="system"
      enableSystem
      storageKey="wat-admin-theme"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
