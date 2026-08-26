"use client";

import React, { useState, useId } from "react";
import { useTranslations } from "next-intl";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_PRESETS,
  convertCurrency,
  formatExchangeRateText,
  type SupportedCurrency,
} from "@/features/public/donations/utils/currencyExchange";
import { useCurrencyRates } from "@/features/public/donations/hooks/useCurrencyRates";
import { Calculator, RefreshCw, Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils/cn";

export interface AdminCurrencyConverterProps {
  locale?: "th" | "en" | "de";
  onApplyAmount: (amountEur: number) => void;
  className?: string;
  defaultOpen?: boolean;
}

export function AdminCurrencyConverter({
  locale = "th",
  onApplyAmount,
  className,
  defaultOpen = false,
}: AdminCurrencyConverterProps) {
  const t = useTranslations("Admin");
  const inputId = useId();
  const { rates, lastUpdated, refreshRates, isLoading: isRateLoading } = useCurrencyRates();

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>("THB");
  const [inputAmount, setInputAmount] = useState<string>("500");
  const [justApplied, setJustApplied] = useState(false);

  const numericAmount = parseFloat(inputAmount) || 0;
  const convertedEur = convertCurrency(numericAmount, selectedCurrency, "EUR", rates);
  const presets = CURRENCY_PRESETS[selectedCurrency] || [];

  const handleSelectCurrency = (code: SupportedCurrency) => {
    setSelectedCurrency(code);
    setJustApplied(false);
    const defaultPreset = CURRENCY_PRESETS[code]?.[2] ?? 50;
    setInputAmount(String(defaultPreset));
  };

  const handlePresetClick = (amount: number) => {
    setInputAmount(String(amount));
    setJustApplied(false);
  };

  const handleApply = () => {
    if (convertedEur <= 0) return;
    onApplyAmount(convertedEur);
    setJustApplied(true);
    setTimeout(() => {
      setJustApplied(false);
    }, 2500);
  };

  return (
    <div className={cn("border border-admin-border bg-admin-surface text-admin-foreground", className)}>
      {/* Header / Trigger */}
      <div className="flex items-center justify-between p-3 bg-admin-surface-muted/50">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="admin-currency-converter-panel"
          className="flex flex-1 items-center justify-between text-left text-xs font-semibold text-admin-action hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-admin-focus"
        >
          <span className="flex items-center gap-1.5">
            <Calculator size={15} className="text-admin-action shrink-0" />
            <span>{isOpen ? t("donations.hideConverter") : t("donations.toggleConverter")}</span>
          </span>
          <span className="text-admin-muted">
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>
      </div>

      {isOpen && (
        <div
          id="admin-currency-converter-panel"
          className="border-t border-admin-border p-4 space-y-3.5 bg-admin-surface"
        >
          <div>
            <h4 className="text-xs font-bold text-admin-foreground">{t("donations.converterTitle")}</h4>
            <p className="text-[11px] text-admin-muted mt-0.5">{t("donations.converterDesc")}</p>
          </div>

          {/* Currency Selection Radio Group */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-admin-muted uppercase tracking-wider block">
              {t("donations.transferCurrency")}
            </span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup">
              {SUPPORTED_CURRENCIES.map((c) => {
                const isSelected = selectedCurrency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectCurrency(c.code)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1",
                      isSelected
                        ? "bg-admin-action text-admin-on-action border-admin-action font-semibold shadow-xs"
                        : "bg-admin-surface text-admin-foreground border-admin-control-border hover:bg-admin-surface-muted"
                    )}
                  >
                    <span>{c.symbol}</span>
                    <span>{c.name[locale] || c.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transferred Amount Input */}
          <div className="space-y-1.5">
            <label htmlFor={inputId} className="text-xs font-medium text-admin-body block">
              {t("donations.transferAmount")} ({selectedCurrency})
            </label>
            <div className="relative flex items-center">
              <input
                id={inputId}
                type="number"
                min="0.01"
                step="any"
                inputMode="decimal"
                value={inputAmount}
                onChange={(e) => {
                  setInputAmount(e.target.value);
                  setJustApplied(false);
                }}
                className="box-border h-9 w-full border border-admin-control-border bg-admin-surface px-3 py-1.5 text-xs text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"
              />
              <span className="pointer-events-none absolute right-3 text-xs font-mono font-bold text-admin-muted">
                {selectedCurrency}
              </span>
            </div>
          </div>

          {/* Presets */}
          {presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] text-admin-muted mr-1">
                {t("donations.quickAmounts")}:
              </span>
              {presets.map((preset) => {
                const isCurrent = Number(inputAmount) === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={cn(
                      "px-2 py-0.5 text-[11px] font-medium border transition-colors cursor-pointer",
                      isCurrent
                        ? "border-admin-action bg-admin-action/10 font-bold text-admin-action"
                        : "border-admin-control-border bg-admin-surface text-admin-body hover:bg-admin-surface-muted"
                    )}
                  >
                    {preset.toLocaleString()} {selectedCurrency === "THB" ? "฿" : selectedCurrency}
                  </button>
                );
              })}
            </div>
          )}

          {/* Converted Output Card */}
          <div className="border border-admin-border bg-admin-surface-muted/60 p-3 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-[11px] text-admin-muted block">{t("donations.convertedEquivalent")}:</span>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-lg font-bold text-admin-success">
                    {convertedEur.toFixed(2)} EUR
                  </span>
                  <span className="text-[11px] text-admin-muted">
                    ({numericAmount > 0 ? `${numericAmount.toLocaleString()} ${selectedCurrency}` : "-"})
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={convertedEur <= 0}
                onClick={handleApply}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                  justApplied
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-admin-action text-admin-on-action border-admin-action hover:bg-admin-action/90"
                )}
              >
                {justApplied ? (
                  <>
                    <Check size={14} />
                    <span>{t("donations.applied")}</span>
                  </>
                ) : (
                  <span>{t("donations.applyAmount", { amount: convertedEur.toFixed(2) })}</span>
                )}
              </button>
            </div>

            {/* Exchange rate info */}
            <div className="flex items-center justify-between text-[10px] text-admin-muted border-t border-admin-border/50 pt-2">
              <span>
                {t("donations.exchangeRateRef", {
                  rate: formatExchangeRateText(selectedCurrency, rates),
                })}
                {lastUpdated && (
                  <span className="ml-1 opacity-75">
                    ({lastUpdated.toLocaleDateString(locale === "th" ? "th-TH" : locale === "de" ? "de-DE" : "en-US")})
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => void refreshRates()}
                disabled={isRateLoading}
                title="Refresh rates"
                className="hover:text-admin-foreground cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={11} className={isRateLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
