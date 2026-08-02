"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { usePublicTheme, type PublicThemeMode } from "./PublicThemeProvider";

interface PublicThemeSwitcherProps {
  className?: string;
  variant?: "compact" | "full";
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

export function PublicThemeSwitcher({ className, variant = "compact" }: PublicThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { theme, mounted, setTheme } = usePublicTheme();
  const t = useTranslations("Navbar");

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const activeMode = modes.find((mode) => mode.value === theme) ?? modes[0];
  const ActiveIcon = activeMode.Icon;

  if (!mounted) {
    return <div aria-hidden="true" className={cn(variant === "full" ? "h-11 w-full" : "h-11 w-11", className)} />;
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={t("theme")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex min-h-11 items-center gap-2 border border-site-border bg-site-canvas px-3 text-sm font-medium text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus",
          variant === "full" ? "w-full justify-between" : "w-11 justify-center px-0 sm:w-auto sm:px-3",
        )}
      >
        <ActiveIcon aria-hidden="true" size={17} strokeWidth={1.75} />
        <span className={variant === "full" ? "" : "sr-only sm:not-sr-only"}>{t(activeMode.labelKey)}</span>
        <ChevronDown aria-hidden="true" size={15} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label={t("theme")}
          className={cn(
            "absolute right-0 z-20 mt-2 min-w-48 border border-site-border bg-site-canvas p-1 shadow-[0_12px_30px_rgba(36,36,36,0.16)]",
            variant === "full" && "left-0 right-auto w-full",
          )}
        >
          {modes.map(({ value, labelKey, Icon }) => {
            const selected = theme === value;
            const label = t(labelKey);

            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-site-focus",
                  selected
                    ? "bg-site-action text-site-on-action"
                    : "text-site-foreground hover:bg-site-surface",
                )}
              >
                <Icon aria-hidden="true" size={17} strokeWidth={1.75} />
                <span className="grow">{label}</span>
                {selected ? <Check aria-hidden="true" size={16} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export type { PublicThemeMode, PublicThemeSwitcherProps };
