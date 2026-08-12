"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarVariant } from "../calendar-theme";
import { calendarFocusClass } from "../calendar-theme";
import type { CalendarEvent } from "../core/types";
import { CalendarTooltip } from "./CalendarTooltip";

export interface MonthDayPopoverProps<TMeta> {
  date: Date;
  dateKey: string;
  entries: readonly CalendarEvent<TMeta>[];
  targetRect: DOMRect;
  labels: CalendarLabels;
  variant: CalendarVariant;
  showTooltip?: boolean;
  renderTooltip?: (event: CalendarEvent<TMeta>) => ReactNode;
  formatTime: (event: CalendarEvent<TMeta>, date: string) => string | null;
  formatLocation: (event: CalendarEvent<TMeta>) => string | null;
  getEventClass: (event: CalendarEvent<TMeta>, density: "summary" | "row") => string;
  renderEventLabel: (event: CalendarEvent<TMeta>, density: "summary" | "row") => ReactNode;
  onEntryActivate: (event: CalendarEvent<TMeta>) => void;
  onClose: () => void;
}

export function MonthDayPopover<TMeta>({
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
}: MonthDayPopoverProps<TMeta>) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
          onClick={onClose}
          aria-label="Close"
          className={`p-1 opacity-70 hover:opacity-100 ${calendarFocusClass(variant)}`}
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
                className={`flex w-full min-h-9 flex-col overflow-hidden px-2.5 py-1.5 text-left text-xs leading-tight transition-colors focus-visible:outline-2 ${calendarFocusClass(variant)} ${getEventClass(event, "row")}`}
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
