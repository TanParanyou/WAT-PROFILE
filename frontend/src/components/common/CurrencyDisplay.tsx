"use client";

import { useLocale } from "next-intl";
import { formatCurrency } from "@/utils/formatters";

export interface CurrencyDisplayProps {
  amount: number | string | null | undefined;
  currency?: string;
  locale?: string;
  className?: string;
  showCurrencySymbol?: boolean;
}

/**
 * CurrencyDisplay: Standardized component for localized currency display adhering to DESIGN.md.
 * Automatically resolves the active route locale ('th' | 'en' | 'de') or accepts explicit overrides.
 */
export function CurrencyDisplay({
  amount,
  currency = "EUR",
  locale: propLocale,
  className = "",
}: CurrencyDisplayProps) {
  const currentLocale = useLocale();
  const effectiveLocale = propLocale || currentLocale || "th";
  const formatted = formatCurrency(amount, currency, effectiveLocale);

  return <span className={`font-mono ${className}`}>{formatted}</span>;
}
