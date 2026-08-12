import type { CalendarEntry, CalendarScope } from "./types";

export type CalendarVariant = CalendarScope;

export function calendarEntryToneClass(
  variant: CalendarVariant,
  tone: CalendarEntry["display"]["tone"],
): string {
  if (variant === "public") {
    if (tone === "warning") return "border-l-2 border-site-danger bg-site-surface";
    if (tone === "muted") return "border-l-2 border-site-border bg-site-surface text-site-muted";
    return "border-l-2 border-site-accent bg-site-surface";
  }

  if (tone === "warning") return "border-l-2 border-admin-warning bg-admin-surface-muted";
  if (tone === "muted") return "border-l-2 border-admin-border bg-admin-surface-muted";
  return "border-l-2 border-admin-info bg-admin-surface-muted";
}

export function calendarFocusClass(variant: CalendarVariant): string {
  return variant === "public" ? "focus-visible:outline-site-focus" : "focus-visible:outline-admin-focus";
}
