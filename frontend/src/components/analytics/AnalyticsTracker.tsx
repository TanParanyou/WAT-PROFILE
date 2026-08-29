"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

interface AnalyticsTrackerProps {
  resourceType?: string;
  resourceId?: string | number;
}

export function AnalyticsTracker({ resourceType, resourceId }: AnalyticsTrackerProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const lastTrackedRef = useRef<string>("");

  useEffect(() => {
    // Don't track admin pages or API routes
    if (!pathname || pathname.includes("/admin") || pathname.includes("/api")) {
      return;
    }

    const payloadKey = `${pathname}:${resourceType || "page"}:${resourceId || ""}`;
    if (lastTrackedRef.current === payloadKey) {
      return;
    }
    lastTrackedRef.current = payloadKey;

    const payload = {
      path: pathname,
      locale: locale || "th",
      resource_type: resourceType || "page",
      resource_id: resourceId ? String(resourceId) : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
    };

    const apiUrl = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/analytics/track`
      : "/api/v1/public/analytics/track";

    // Use sendBeacon if available, otherwise fetch
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([JSON.stringify(payload)], {
          type: "application/json",
        });
        const success = navigator.sendBeacon(apiUrl, blob);
        if (!success) {
          fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {});
        }
      } else {
        fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Ignore client tracking failures silently
    }
  }, [pathname, locale, resourceType, resourceId]);

  return null;
}
