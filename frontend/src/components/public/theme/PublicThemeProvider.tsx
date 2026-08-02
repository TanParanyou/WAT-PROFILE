"use client";

import type { ReactNode } from "react";
import { ThemeProvider, useTheme } from "next-themes";

function PublicThemeScope({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <div data-public-theme={resolvedTheme ?? "light"} className="contents">
      {children}
    </div>
  );
}

export function PublicThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-public-theme"
      defaultTheme="system"
      enableSystem
      storageKey="wat-public-theme"
      disableTransitionOnChange
    >
      <PublicThemeScope>{children}</PublicThemeScope>
    </ThemeProvider>
  );
}
