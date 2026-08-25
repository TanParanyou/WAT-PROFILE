"use client";

import { useEffect } from "react";

// Global reference count to support nested modal/drawer scroll locks safely
let lockCount = 0;
let originalOverflow = "";

export function lockScroll(): void {
  if (typeof document === "undefined") return;

  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

export function unlockScroll(): void {
  if (typeof document === "undefined") return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow;
  }
}

/**
 * useScrollLock: Locks body scroll while `isLocked` is true and automatically restores it on unmount.
 * Handles nested modals and dynamic open states safely.
 */
export function useScrollLock(isLocked: boolean = true): void {
  useEffect(() => {
    if (!isLocked) return;

    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isLocked]);
}
