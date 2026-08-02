"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

export function PublicThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-public-theme"
      defaultTheme="system"
      enableSystem
      storageKey="wat-public-theme"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
