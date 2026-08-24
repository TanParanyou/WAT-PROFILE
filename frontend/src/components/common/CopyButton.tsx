"use client";

import { useClipboard } from "@/hooks/useClipboard";
import { Check, Copy } from "lucide-react";

export interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  variant?: "button" | "icon" | "inline";
  size?: "sm" | "md";
  showToast?: boolean;
}

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  className = "",
  variant = "inline",
  size = "sm",
  showToast = false,
}: CopyButtonProps) {
  const { copy, copied } = useClipboard({ showToast, timeout: 2000 });

  const handleCopy = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    void copy(text);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center justify-center border border-site-border bg-site-surface text-site-foreground transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-site-focus ${
          size === "sm" ? "size-7 p-1" : "size-9 p-1.5"
        } ${className}`}
        title={copied ? copiedLabel : label}
        aria-label={copied ? copiedLabel : label}
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-700" aria-hidden />
        ) : (
          <Copy className="size-3.5 text-site-muted" aria-hidden />
        )}
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-surface px-4 py-2 text-xs font-semibold text-site-foreground transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus ${className}`}
      >
        {copied ? (
          <>
            <Check className="size-4 text-emerald-700" aria-hidden />
            <span className="text-emerald-700">{copiedLabel}</span>
          </>
        ) : (
          <>
            <Copy className="size-4 text-site-muted" aria-hidden />
            <span>{label}</span>
          </>
        )}
      </button>
    );
  }

  // Default: inline
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 border border-site-border bg-site-surface px-1.5 py-0.5 text-[11px] font-sans font-medium text-site-foreground transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-site-focus ${className}`}
      title={copied ? copiedLabel : label}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? (
        <>
          <Check className="size-3 text-emerald-700" aria-hidden />
          <span className="text-emerald-700">{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className="size-3 text-site-muted" aria-hidden />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
