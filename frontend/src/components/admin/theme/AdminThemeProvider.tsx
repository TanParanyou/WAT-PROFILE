"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { useTheme } from "next-themes";

function AdminThemeScope({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <div
      data-admin-theme={resolvedTheme ?? "light"}
      className="contents"
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-admin-theme"
      defaultTheme="system"
      enableSystem
      storageKey="wat-admin-theme"
      disableTransitionOnChange
    >
      <AdminThemeScope>{children}</AdminThemeScope>
    </ThemeProvider>
  );
}
