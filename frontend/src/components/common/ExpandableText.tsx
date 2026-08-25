"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  readMoreLabel?: string;
  showLessLabel?: string;
}

/**
 * ExpandableText: Clean Register-style component for collapsing long descriptions with a localized toggle.
 */
export function ExpandableText({
  text,
  maxLines = 3,
  className = "",
  readMoreLabel,
  showLessLabel,
}: ExpandableTextProps) {
  const t = useTranslations("Common");
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const resolvedReadMore = readMoreLabel || t("readMore");
  const resolvedShowLess = showLessLabel || t("showLess");

  return (
    <div className={`text-sm leading-relaxed text-site-body ${className}`}>
      <p
        className={
          isExpanded
            ? "whitespace-pre-line"
            : `line-clamp-${maxLines} whitespace-pre-line`
        }
        style={
          !isExpanded
            ? {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : undefined
        }
      >
        {text}
      </p>

      {text.length > 120 ? (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          className="mt-1.5 inline-block text-xs font-semibold text-site-accent underline underline-offset-2 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-site-focus"
        >
          {isExpanded ? resolvedShowLess : resolvedReadMore}
        </button>
      ) : null}
    </div>
  );
}
