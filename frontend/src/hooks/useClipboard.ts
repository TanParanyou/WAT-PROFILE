"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/useToast";

export interface UseClipboardOptions {
  timeout?: number;
  showToast?: boolean;
  toastMessage?: string;
}

/**
 * useClipboard: Hook for copying text to the clipboard with temporary feedback state and optional Toast.
 *
 * @example
 * const { copy, copied } = useClipboard({ showToast: true, toastMessage: "คัดลอกรหัสแล้ว" });
 * <button onClick={() => copy("REG-2026-001")}>{copied ? "คัดลอกแล้ว!" : "คัดลอก"}</button>
 */
export function useClipboard(options: UseClipboardOptions = {}) {
  const { timeout = 2000, showToast = false, toastMessage = "คัดลอกลงคลิปบอร์ดแล้ว" } = options;
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        console.warn("Clipboard API not available");
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);

        if (showToast) {
          toast.success(toastMessage);
        }

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
          setCopied(false);
        }, timeout);

        return true;
      } catch (err) {
        console.error("Failed to copy text: ", err);
        setCopied(false);
        return false;
      }
    },
    [timeout, showToast, toastMessage, toast]
  );

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setCopied(false);
  }, []);

  return { copy, copied, reset };
}
