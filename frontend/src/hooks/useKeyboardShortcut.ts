"use client";

import { useEffect, useCallback } from "react";

export interface ShortcutOptions {
  /** Target key, e.g. "s", "k", "Escape", "Enter" */
  key: string;
  /** Whether Control (or Command on Mac) must be pressed */
  ctrlOrMeta?: boolean;
  /** Whether Shift must be pressed */
  shift?: boolean;
  /** Whether Alt / Option must be pressed */
  alt?: boolean;
  /** Whether to prevent default browser action */
  preventDefault?: boolean;
  /** Whether the shortcut is currently enabled */
  enabled?: boolean;
}

/**
 * useKeyboardShortcut: Hook to bind custom keyboard shortcuts to actions (e.g. Save, Close, Search).
 *
 * @example
 * useKeyboardShortcut({ key: "s", ctrlOrMeta: true, preventDefault: true }, () => handleSave());
 * useKeyboardShortcut({ key: "Escape" }, () => handleClose());
 */
export function useKeyboardShortcut(
  options: ShortcutOptions,
  callback: (e: KeyboardEvent) => void
) {
  const {
    key,
    ctrlOrMeta = false,
    shift = false,
    alt = false,
    preventDefault = true,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const isKeyMatch = event.key.toLowerCase() === key.toLowerCase();
      if (!isKeyMatch) return;

      if (ctrlOrMeta) {
        const isCtrlOrMetaPressed = event.ctrlKey || event.metaKey;
        if (!isCtrlOrMetaPressed) return;
      }

      if (shift && !event.shiftKey) return;
      if (alt && !event.altKey) return;

      if (preventDefault) {
        event.preventDefault();
      }

      callback(event);
    },
    [key, ctrlOrMeta, shift, alt, preventDefault, enabled, callback]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}
