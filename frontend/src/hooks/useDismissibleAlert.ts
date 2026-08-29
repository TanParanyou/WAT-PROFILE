'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * useDismissibleAlert manages the dismissal state of site alerts / announcements
 * in localStorage keyed by alert ID and updatedAt timestamp so if an alert is updated,
 * it becomes visible again.
 */
export function useDismissibleAlert(alertId: number, updatedAt: string) {
  const storageKey = `wat_dismissed_alert_${alertId}`;
  const [isDismissed, setIsDismissed] = useState<boolean>(true); // start hidden until mounted to avoid SSR flash

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === updatedAt) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }
  }, [storageKey, updatedAt]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, updatedAt);
      setIsDismissed(true);
    } catch {
      setIsDismissed(true);
    }
  }, [storageKey, updatedAt]);

  return { isDismissed, dismiss };
}
