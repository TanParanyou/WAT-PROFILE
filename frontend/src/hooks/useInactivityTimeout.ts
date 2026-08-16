"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_DURATION_MS = 60 * 1000;  // 60 seconds countdown
const CHECK_INTERVAL_MS = 1000;         // check every second

export function useInactivityTimeout() {
  const { isAuthenticated, logout } = useAuth();
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const lastActivityRef = useRef<number>(Date.now());
  const isWarningOpenRef = useRef<boolean>(false);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isWarningOpenRef.current) {
      isWarningOpenRef.current = false;
      setIsWarningOpen(false);
    }
  }, []);

  const stayLoggedIn = useCallback(() => {
    resetActivity();
  }, [resetActivity]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsWarningOpen(false);
      isWarningOpenRef.current = false;
      return;
    }

    lastActivityRef.current = Date.now();

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    let throttleTimer: NodeJS.Timeout | null = null;
    const handleUserActivity = () => {
      if (!throttleTimer && !isWarningOpenRef.current) {
        throttleTimer = setTimeout(() => {
          lastActivityRef.current = Date.now();
          throttleTimer = null;
        }, 1000);
      }
    };

    activityEvents.forEach((evt) =>
      window.addEventListener(evt, handleUserActivity, { passive: true }),
    );

    const interval = setInterval(async () => {
      const elapsed = Date.now() - lastActivityRef.current;
      const timeUntilLogout = IDLE_TIMEOUT_MS - elapsed;

      if (timeUntilLogout <= 0) {
        clearInterval(interval);
        setIsWarningOpen(false);
        isWarningOpenRef.current = false;
        await logout();
      } else if (timeUntilLogout <= WARNING_DURATION_MS) {
        if (!isWarningOpenRef.current) {
          isWarningOpenRef.current = true;
          setIsWarningOpen(true);
        }
        setSecondsRemaining(Math.max(1, Math.ceil(timeUntilLogout / 1000)));
      } else {
        if (isWarningOpenRef.current) {
          isWarningOpenRef.current = false;
          setIsWarningOpen(false);
        }
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      if (throttleTimer) clearTimeout(throttleTimer);
      clearInterval(interval);
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, handleUserActivity),
      );
    };
  }, [isAuthenticated, logout]);

  return {
    isWarningOpen,
    secondsRemaining,
    stayLoggedIn,
    logout,
  };
}
