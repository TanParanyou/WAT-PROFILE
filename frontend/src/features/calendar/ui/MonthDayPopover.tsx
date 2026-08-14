"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import { calendarFocusClass } from "../calendar-theme";
import type { CalendarEventLike } from "../core/types";
import { CalendarTooltip } from "./CalendarTooltip";

export interface MonthDayPopoverProps<TEvent extends CalendarEventLike> {
  date: Date;
  dateKey: string;
  entries: readonly TEvent[];
  targetRect: DOMRect;
  labels: CalendarLabels;
  variant: CalendarVariant;
  showTooltip?: boolean;
  renderTooltip?: (event: TEvent) => ReactNode;
  formatTime: (event: TEvent, date: string) => string | null;
  formatLocation: (event: TEvent) => string | null;
  getEventClass: (event: TEvent, density: "summary" | "row") => string;
  renderEventLabel: (event: TEvent, density: "summary" | "row") => ReactNode;
  onEntryActivate: (event: TEvent) => void;
  onClose: () => void;
}

export function MonthDayPopover<TEvent extends CalendarEventLike>({
  date,
  dateKey,
  entries,
  targetRect,
  labels,
  variant,
  showTooltip = true,
  renderTooltip,
  formatTime,
  formatLocation,
  getEventClass,
  renderEventLabel,
  onEntryActivate,
  onClose,
}: MonthDayPopoverProps<TEvent>) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !popoverRef.current) return;

      const focusable = Array.from(
        popoverRef.current.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
      );
      if (focusable.length === 0) return;

      const activeElement = document.activeElement;
      const currentIndex = activeElement instanceof HTMLElement
        ? focusable.findIndex((button) => button === activeElement)
        : -1;
      const nextIndex = e.shiftKey
        ? currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1
        : currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
      e.preventDefault();
      focusable[nextIndex]?.focus();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      returnFocusRef.current?.focus();
    };
  }, [onClose]);

  if (typeof window === "undefined") return null;

  const isPublic = variant === "public";
  const themeScope = isPublic ? "public-theme" : "admin-theme";
  const surfaceClass = isPublic
    ? "bg-site-canvas text-site-foreground border-site-border"
    : "bg-admin-canvas text-admin-foreground border-admin-border";

  const width = Math.min(320, window.innerWidth - 32);
  let left = targetRect.left + targetRect.width / 2 - width / 2;
  left = Math.max(16, Math.min(window.innerWidth - width - 16, left));

  let top = targetRect.bottom + 8;
  if (top + 280 > window.innerHeight && targetRect.top > 280) {
    top = targetRect.top - 280 - 8;
  }

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="true"
      aria-label={labels.selectedDateLabel(date)}
      style={{
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
      }}
      className={`${themeScope} z-[9999] border-2 ${surfaceClass} rounded-none shadow-2xl animate-in fade-in zoom-in-95`}
    >
      <div className="flex items-center justify-between border-b border-current/15 px-3 py-2">
        <div>
          <div className="text-xs font-semibold">{labels.selectedDateLabel(date)}</div>
          <div className="text-[0.7rem] opacity-70">{labels.eventsCount(entries.length)}</div>
        </div>
        <button
          type="button"
          ref={closeButtonRef}
          onClick={onClose}
          aria-label={labels.closeDialog ?? "Close"}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center opacity-70 hover:opacity-100 focus-visible:outline-[3px] focus-visible:outline-offset-2 ${calendarFocusClass(variant)}`}
        >
          <X size={16} />
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1.5 p-2">
        {entries.map((event) => {
          const time = formatTime(event, dateKey);
          const location = formatLocation(event);

          return (
            <CalendarTooltip
              key={event.id}
              event={event}
              variant={variant}
              showTooltip={showTooltip}
              renderTooltip={renderTooltip}
              formatTime={(item) => formatTime(item, dateKey)}
              formatLocation={formatLocation}
            >
              <button
                type="button"
                onClick={() => {
                  onEntryActivate(event);
                  onClose();
                }}
                className={`flex min-h-11 w-full flex-col overflow-hidden px-2.5 py-1.5 text-left text-xs leading-tight transition-colors focus-visible:outline-[3px] focus-visible:outline-offset-2 ${calendarFocusClass(variant)} ${getEventClass(event, "row")}`}
              >
                <div className="font-medium truncate">{renderEventLabel(event, "row")}</div>
                {time || location ? (
                  <div className="text-[0.68rem] opacity-75 truncate">
                    {time} {location ? `• ${location}` : ""}
                  </div>
                ) : null}
              </button>
            </CalendarTooltip>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
