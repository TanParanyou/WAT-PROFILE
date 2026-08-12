"use client";

import { useState, type ReactNode } from "react";
import type { CalendarEvent } from "../core/types";

export interface CalendarTooltipProps<TMeta> {
  event: CalendarEvent<TMeta>;
  showTooltip?: boolean;
  renderTooltip?: (event: CalendarEvent<TMeta>) => ReactNode;
  formatTime?: (event: CalendarEvent<TMeta>) => string | null;
  formatLocation?: (event: CalendarEvent<TMeta>) => string | null;
  children: ReactNode;
}

export function CalendarTooltip<TMeta>({
  event,
  showTooltip = true,
  renderTooltip,
  formatTime,
  formatLocation,
  children,
}: CalendarTooltipProps<TMeta>) {
  const [isOpen, setIsOpen] = useState(false);

  if (!showTooltip) {
    return <>{children}</>;
  }

  const timeStr = formatTime ? formatTime(event) : null;
  const locationStr = formatLocation ? formatLocation(event) : null;

  const defaultContent = (
    <div className="space-y-1 text-xs text-left">
      <div className="font-semibold text-slate-900 dark:text-slate-100">{event.title}</div>
      {timeStr ? <div className="text-slate-600 dark:text-slate-300">🕒 {timeStr}</div> : null}
      {locationStr ? <div className="text-slate-600 dark:text-slate-300">📍 {locationStr}</div> : null}
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
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md border border-slate-700/20 bg-slate-900/95 px-3 py-2 text-white shadow-xl backdrop-blur-sm dark:bg-slate-800/95 dark:text-slate-100 min-w-40 max-w-xs text-xs whitespace-normal transition-all duration-150 animate-in fade-in zoom-in-95"
        >
          {renderTooltip ? renderTooltip(event) : defaultContent}
          <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800/95" />
        </div>
      ) : null}
    </div>
  );
}
