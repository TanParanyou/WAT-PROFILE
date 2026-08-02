"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

type PublicThemeMode = "system" | "light" | "dark";

interface PublicThemeSwitcherProps {
  className?: string;
}

const modes: Array<{
  value: PublicThemeMode;
  labelKey: "themeSystem" | "themeLight" | "themeDark";
  Icon: typeof Monitor;
}> = [
  { value: "system", labelKey: "themeSystem", Icon: Monitor },
  { value: "light", labelKey: "themeLight", Icon: Sun },
  { value: "dark", labelKey: "themeDark", Icon: Moon },
];

export function PublicThemeSwitcher({ className }: PublicThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("Navbar");
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
      className={cn("flex min-h-11 items-center gap-0.5 border border-site-border bg-site-canvas p-0.5", className)}
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
              "flex min-h-10 min-w-10 items-center justify-center gap-1 px-2 text-xs font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-site-focus",
              selected
                ? "bg-site-action text-site-on-action"
                : "text-site-muted hover:bg-site-surface hover:text-site-foreground",
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

export type { PublicThemeMode, PublicThemeSwitcherProps };
