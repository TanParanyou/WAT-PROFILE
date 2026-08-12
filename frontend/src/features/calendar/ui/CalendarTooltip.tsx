"use client";

import { Clock, MapPin } from "lucide-react";
import { useState, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { CalendarVariant } from "../calendar-theme";
import { calendarTooltipClass } from "../calendar-theme";
import type { CalendarEventLike } from "../core/types";

export interface CalendarTooltipProps<TEvent extends CalendarEventLike> {
  event: TEvent;
  variant?: CalendarVariant;
  showTooltip?: boolean;
  renderTooltip?: (event: TEvent) => ReactNode;
  formatTime?: (event: TEvent) => string | null;
  formatLocation?: (event: TEvent) => string | null;
  children: ReactNode;
}

export function CalendarTooltip<TEvent extends CalendarEventLike>({
  event,
  variant = "public",
  showTooltip = true,
  renderTooltip,
  formatTime,
  formatLocation,
  children,
}: CalendarTooltipProps<TEvent>) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; isBottom: boolean } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const isNearTop = rect.top < 160;
      const left = Math.max(16, Math.min(window.innerWidth - 16, rect.left + rect.width / 2));
      const top = isNearTop ? rect.bottom + 8 : rect.top - 8;
      setCoords({ top, left, isBottom: isNearTop });
    }
  };

  const handleOpen = () => {
    updateCoords();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!showTooltip) {
    return <>{children}</>;
  }

  const timeStr = formatTime ? formatTime(event) : null;
  const locationStr = formatLocation ? formatLocation(event) : null;
  const themeClasses = calendarTooltipClass(variant);

  const defaultContent = (
    <div className="space-y-1.5 text-xs text-left">
      <div className="font-medium leading-snug">{event.title}</div>
      {timeStr ? (
        <div className={`flex items-center gap-1.5 ${themeClasses.subtext}`}>
          <Clock size={12} className={`shrink-0 ${themeClasses.icon}`} aria-hidden="true" />
          <span>{timeStr}</span>
        </div>
      ) : null}
      {locationStr ? (
        <div className={`flex items-center gap-1.5 ${themeClasses.subtext}`}>
          <MapPin size={12} className={`shrink-0 ${themeClasses.icon}`} aria-hidden="true" />
          <span className="truncate">{locationStr}</span>
        </div>
      ) : null}
    </div>
  );

  const tooltipPortal = isOpen && coords && typeof window !== "undefined" ? (
    createPortal(
      <div
        role="tooltip"
        style={{
          position: "fixed",
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          transform: coords.isBottom ? "translate(-50%, 0)" : "translate(-50%, -100%)",
        }}
        className={`pointer-events-none px-3.5 py-2.5 min-w-44 max-w-xs text-xs whitespace-normal transition-opacity duration-150 ${themeClasses.container}`}
      >
        {renderTooltip ? renderTooltip(event) : defaultContent}
      </div>,
      document.body
    )
  ) : null;

  return (
    <div
      ref={triggerRef}
      className="group relative inline-block w-full"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      {children}
      {tooltipPortal}
    </div>
  );
}
