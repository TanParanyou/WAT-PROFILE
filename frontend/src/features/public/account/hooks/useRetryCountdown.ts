"use client";

import { useEffect, useState } from "react";

export function useRetryCountdown(initialSeconds: number): number {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1_000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  return remaining;
}
