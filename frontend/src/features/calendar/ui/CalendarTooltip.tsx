"use client";

import { Clock, MapPin } from "lucide-react";
import { useState, type ReactNode } from "react";
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

  return (
    <div
      className="group relative inline-block w-full"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}
      {isOpen ? (
        <div
          role="tooltip"
          className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 px-3 py-2 min-w-40 max-w-xs text-xs whitespace-normal transition-opacity duration-150 ${themeClasses.container}`}
        >
          {renderTooltip ? renderTooltip(event) : defaultContent}
        </div>
      ) : null}
    </div>
  );
}
