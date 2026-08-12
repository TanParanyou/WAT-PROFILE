"use client";

import { Clock, MapPin } from "lucide-react";
import { useState, useRef, type ReactNode } from "react";
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
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      if (rect.top < 120) {
        setPosition("bottom");
      } else {
        setPosition("top");
      }
    }
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

  const isTop = position === "top";

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
      {isOpen ? (
        <div
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 px-3 py-2 min-w-40 max-w-xs text-xs whitespace-normal transition-opacity duration-150 ${
            isTop ? "bottom-full mb-2" : "top-full mt-2"
          } ${themeClasses.container}`}
        >
          {renderTooltip ? renderTooltip(event) : defaultContent}
        </div>
      ) : null}
    </div>
  );
}
