"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { useAdminTheme, type AdminThemeMode } from "./AdminThemeProvider";

interface AdminThemeSwitcherProps {
  className?: string;
}

const modes: Array<{
  value: AdminThemeMode;
  labelKey: "themeSystem" | "themeLight" | "themeDark";
  Icon: typeof Monitor;
}> = [
  { value: "system", labelKey: "themeSystem", Icon: Monitor },
  { value: "light", labelKey: "themeLight", Icon: Sun },
  { value: "dark", labelKey: "themeDark", Icon: Moon },
];

export function AdminThemeSwitcher({ className }: AdminThemeSwitcherProps) {
  const { theme, setTheme } = useAdminTheme();
  const t = useTranslations("Admin.header");
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div aria-hidden="true" className={cn("h-11 w-[132px]", className)} />;
  }

  return (
    <div
      aria-label={t("theme")}
      className={cn(
        "flex min-h-11 items-center gap-0.5 border border-admin-control-border bg-admin-surface p-0.5",
        className,
      )}
      role="group"
    >
      {modes.map(({ value, labelKey, Icon }) => {
        const selected = theme === value;
        const label = t(labelKey);

        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={selected}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex min-h-10 min-w-10 items-center justify-center gap-1 px-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus",
              selected
                ? "bg-admin-action text-admin-on-action hover:bg-admin-action-hover"
                : "text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground",
            )}
          >
            <Icon aria-hidden="true" size={15} strokeWidth={1.75} />
            <span className="sr-only sm:not-sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export type { AdminThemeMode, AdminThemeSwitcherProps };
