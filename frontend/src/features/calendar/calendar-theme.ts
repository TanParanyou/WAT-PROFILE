import type { CalendarEntry, CalendarScope } from "./types";

export type CalendarVariant = CalendarScope;

export function calendarEntryToneClass(
  variant: CalendarVariant,
  tone: CalendarEntry["display"]["tone"],
): string {
  if (variant === "public") {
    if (tone === "warning") return "border-l-4 border-site-danger bg-site-surface pl-3 pr-2";
    if (tone === "muted") return "border-l-4 border-site-border bg-site-surface text-site-muted pl-3 pr-2";
    return "border-l-4 border-site-accent bg-site-surface pl-3 pr-2";
  }

  if (tone === "warning") return "border-l-4 border-admin-warning bg-admin-surface-muted pl-3 pr-2";
  if (tone === "muted") return "border-l-4 border-admin-border bg-admin-surface-muted pl-3 pr-2";
  return "border-l-4 border-admin-info bg-admin-surface-muted pl-3 pr-2";
}

export function calendarFocusClass(variant: CalendarVariant): string {
  return variant === "public" ? "focus-visible:outline-site-focus" : "focus-visible:outline-admin-focus";
}

export function calendarTooltipClass(variant: CalendarVariant): {
  container: string;
  subtext: string;
  icon: string;
} {
  if (variant === "public") {
    return {
      container:
        "public-theme border border-site-border bg-site-canvas text-site-foreground rounded-none shadow-2xl z-[9999] opacity-100",
      subtext: "text-site-muted",
      icon: "text-site-accent opacity-90",
    };
  }
  return {
    container:
      "admin-theme border border-admin-border bg-admin-canvas text-admin-foreground rounded-none shadow-2xl z-[9999] opacity-100",
    subtext: "text-admin-muted",
    icon: "text-admin-foreground opacity-80",
  };
}
