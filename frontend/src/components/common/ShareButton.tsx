"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { usePathname } from "next/navigation";

interface ShareButtonProps {
  shareLabel: string;
  copiedLabel: string;
}

export default function ShareButton({ shareLabel, copiedLabel }: ShareButtonProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;

    const url = window.location.origin + pathname;

    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: document.title,
          url: url,
        });
      } catch (err) {
        // Ignore AbortError (user cancelled)
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-canvas px-4 py-2.5 text-xs font-semibold text-site-foreground transition-colors hover:bg-site-surface hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
      aria-label={shareLabel}
    >
      {copied ? (
        <>
          <Check size={15} className="text-green-600" aria-hidden="true" />
          <span className="text-green-700">{copiedLabel}</span>
        </>
      ) : (
        <>
          <Share2 size={15} aria-hidden="true" />
          <span>{shareLabel}</span>
        </>
      )}
    </button>
  );
}
