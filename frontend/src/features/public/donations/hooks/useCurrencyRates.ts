"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DEFAULT_FALLBACK_RATES,
  type SupportedCurrency,
} from "../utils/currencyExchange";

interface CachedRates {
  rates: Record<SupportedCurrency, number>;
  timestamp: number;
}

const CACHE_KEY = "wat_currency_rates_v1";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export interface UseCurrencyRatesResult {
  rates: Record<SupportedCurrency, number>;
  isLoading: boolean;
  isFallback: boolean;
  lastUpdated: Date | null;
  refreshRates: () => Promise<void>;
}

export function useCurrencyRates(): UseCurrencyRatesResult {
  const [rates, setRates] = useState<Record<SupportedCurrency, number>>(DEFAULT_FALLBACK_RATES);
  const [isLoading, setIsLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadFromCache = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const parsed: CachedRates = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.rates) {
        setRates({
          EUR: 1,
          THB: Number(parsed.rates.THB) || DEFAULT_FALLBACK_RATES.THB,
          USD: Number(parsed.rates.USD) || DEFAULT_FALLBACK_RATES.USD,
          CHF: Number(parsed.rates.CHF) || DEFAULT_FALLBACK_RATES.CHF,
        });
        setIsFallback(false);
        setLastUpdated(new Date(parsed.timestamp));
        return true;
      }
    } catch {
      // Ignore localStorage errors
    }
    return false;
  }, []);

  const fetchLiveRates = useCallback(async () => {
    if (typeof window === "undefined") return;
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      // Frankfurter API is free, open source, and specifically base-EUR
      const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=THB,USD,CHF", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Failed to fetch rates");
      const data = await res.json();

      if (data && data.rates) {
        const fetchedRates: Record<SupportedCurrency, number> = {
          EUR: 1,
          THB: Number(data.rates.THB) || DEFAULT_FALLBACK_RATES.THB,
          USD: Number(data.rates.USD) || DEFAULT_FALLBACK_RATES.USD,
          CHF: Number(data.rates.CHF) || DEFAULT_FALLBACK_RATES.CHF,
        };

        setRates(fetchedRates);
        setIsFallback(false);
        const now = new Date();
        setLastUpdated(now);

        try {
          const cacheData: CachedRates = {
            rates: fetchedRates,
            timestamp: now.getTime(),
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch {
          // Ignore storage quota
        }
      }
    } catch {
      // If live fetch fails, keep current state (cached or fallback)
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const hasCache = loadFromCache();
    if (!hasCache) {
      void fetchLiveRates();
    }
  }, [loadFromCache, fetchLiveRates]);

  return {
    rates,
    isLoading,
    isFallback,
    lastUpdated,
    refreshRates: fetchLiveRates,
  };
}
