export type SupportedCurrency = "THB" | "EUR" | "USD" | "CHF";

export interface CurrencyOption {
  code: SupportedCurrency;
  symbol: string;
  name: {
    th: string;
    en: string;
    de: string;
  };
}

export const SUPPORTED_CURRENCIES: readonly CurrencyOption[] = [
  {
    code: "THB",
    symbol: "฿",
    name: {
      th: "บาทไทย (THB)",
      en: "Thai Baht (THB)",
      de: "Thailändischer Baht (THB)",
    },
  },
  {
    code: "EUR",
    symbol: "€",
    name: {
      th: "ยูโร (EUR)",
      en: "Euro (EUR)",
      de: "Euro (EUR)",
    },
  },
  {
    code: "CHF",
    symbol: "Fr",
    name: {
      th: "ฟรังก์สวิส (CHF)",
      en: "Swiss Franc (CHF)",
      de: "Schweizer Franken (CHF)",
    },
  },
  {
    code: "USD",
    symbol: "$",
    name: {
      th: "ดอลลาร์สหรัฐ (USD)",
      en: "US Dollar (USD)",
      de: "US-Dollar (USD)",
    },
  },
] as const;

/**
 * Fallback exchange rates relative to 1 EUR (Base Currency)
 */
export const DEFAULT_FALLBACK_RATES: Record<SupportedCurrency, number> = {
  EUR: 1.0,
  THB: 37.0,
  USD: 1.08,
  CHF: 0.96,
};

/**
 * Quick amount presets tailored to donation habits of each currency
 */
export const CURRENCY_PRESETS: Record<SupportedCurrency, readonly number[]> = {
  THB: [100, 300, 500, 999, 1000, 2500, 5000],
  EUR: [10, 20, 50, 100, 200, 500],
  CHF: [10, 25, 50, 100, 250, 500],
  USD: [15, 30, 50, 100, 250, 500],
};

/**
 * Converts an amount from one currency to another using EUR-based exchange rates.
 * Round to 2 decimal places.
 */
export function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  rates: Record<SupportedCurrency, number> = DEFAULT_FALLBACK_RATES,
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (from === to) return Math.round(amount * 100) / 100;

  const rateFrom = rates[from] || DEFAULT_FALLBACK_RATES[from] || 1;
  const rateTo = rates[to] || DEFAULT_FALLBACK_RATES[to] || 1;

  // Convert to EUR first, then to target currency
  // Since rates are 1 EUR = X [Currency]
  const amountInEur = from === "EUR" ? amount : amount / rateFrom;
  const targetAmount = to === "EUR" ? amountInEur : amountInEur * rateTo;

  return Math.round(targetAmount * 100) / 100;
}

/**
 * Formats exchange rate display string (e.g. "1 EUR ≈ 37.04 THB")
 */
export function formatExchangeRateText(
  currency: SupportedCurrency,
  rates: Record<SupportedCurrency, number> = DEFAULT_FALLBACK_RATES,
): string {
  if (currency === "EUR") return "1 EUR = 1 EUR";
  const rate = rates[currency] || DEFAULT_FALLBACK_RATES[currency];
  return `1 EUR ≈ ${rate.toFixed(2)} ${currency}`;
}
