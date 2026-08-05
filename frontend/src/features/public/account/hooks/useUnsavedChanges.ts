"use client";

import { useCallback, useEffect } from "react";

interface UseUnsavedChangesOptions {
  isDirty: boolean;
  message: string;
}

interface UseUnsavedChangesResult {
  confirmNavigation: () => boolean;
}

export function useUnsavedChanges({
  isDirty,
  message,
}: UseUnsavedChangesOptions): UseUnsavedChangesResult {
  const confirmNavigation = useCallback(() => {
    if (!isDirty || typeof window === "undefined") return true;
    return window.confirm(message);
  }, [isDirty, message]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, message]);

  return { confirmNavigation };
}
