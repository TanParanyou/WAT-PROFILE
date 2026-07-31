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
      className="inline-flex min-h-11 items-center gap-2 border border-[#333] bg-[#fffef2] px-5 py-[13px] text-sm font-semibold text-[#333] transition-colors hover:bg-[#f7ecdd] hover:text-[#945c26] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#945c26]"
      aria-label={shareLabel}
    >
      {copied ? (
        <>
          <Check size={18} className="text-green-600" aria-hidden="true" />
          <span className="text-green-700">{copiedLabel}</span>
        </>
      ) : (
        <>
          <Share2 size={18} aria-hidden="true" />
          {shareLabel}
        </>
      )}
    </button>
  );
}
