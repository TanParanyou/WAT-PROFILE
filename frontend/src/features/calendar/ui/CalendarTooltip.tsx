"use client";

import { Clock, MapPin } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { CalendarEventLike } from "../core/types";

export interface CalendarTooltipProps<TEvent extends CalendarEventLike> {
  event: TEvent;
  showTooltip?: boolean;
  renderTooltip?: (event: TEvent) => ReactNode;
  formatTime?: (event: TEvent) => string | null;
  formatLocation?: (event: TEvent) => string | null;
  children: ReactNode;
}

export function CalendarTooltip<TEvent extends CalendarEventLike>({
  event,
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

  const defaultContent = (
    <div className="space-y-1.5 text-xs text-left">
      <div className="font-semibold text-slate-100 leading-snug">{event.title}</div>
      {timeStr ? (
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock size={12} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span>{timeStr}</span>
        </div>
      ) : null}
      {locationStr ? (
        <div className="flex items-center gap-1.5 text-slate-300">
          <MapPin size={12} className="shrink-0 text-slate-400" aria-hidden="true" />
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
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md border border-slate-700/60 bg-slate-900/95 px-3 py-2 text-slate-100 shadow-xl backdrop-blur-sm min-w-40 max-w-xs text-xs whitespace-normal transition-all duration-150 animate-in fade-in zoom-in-95"
        >
          {renderTooltip ? renderTooltip(event) : defaultContent}
          <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-slate-900/95" />
        </div>
      ) : null}
    </div>
  );
}
