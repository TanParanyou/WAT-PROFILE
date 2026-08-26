"use client";

import { useTranslations } from "next-intl";
import { useState, useId, useTransition } from "react";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_PRESETS,
  convertCurrency,
  formatExchangeRateText,
  type SupportedCurrency,
} from "../utils/currencyExchange";
import { useCurrencyRates } from "../hooks/useCurrencyRates";

interface DonationCurrencyConverterProps {
  locale: "th" | "en" | "de";
  onApplyAmount: (amountInEur: number) => void;
}

export function DonationCurrencyConverter({
  locale,
  onApplyAmount,
}: DonationCurrencyConverterProps) {
  const t = useTranslations("DonationReportPage");
  const inputId = useId();
  const { rates, lastUpdated, refreshRates, isLoading: isRateLoading } = useCurrencyRates();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>("THB");
  const [inputAmount, setInputAmount] = useState<string>("500");
  const [justApplied, setJustApplied] = useState(false);
  const [, startTransition] = useTransition();

  const numericAmount = parseFloat(inputAmount) || 0;
  const convertedEur = convertCurrency(numericAmount, selectedCurrency, "EUR", rates);
  const presets = CURRENCY_PRESETS[selectedCurrency] || [];

  function handleSelectCurrency(code: SupportedCurrency) {
    setSelectedCurrency(code);
    setJustApplied(false);
    // Set sensible default amount when switching currency
    const defaultPreset = CURRENCY_PRESETS[code]?.[2] ?? 50;
    setInputAmount(String(defaultPreset));
  }

  function handlePresetClick(amount: number) {
    setInputAmount(String(amount));
    setJustApplied(false);
  }

  function handleApply() {
    if (convertedEur <= 0) return;
    onApplyAmount(convertedEur);
    setJustApplied(true);
    setTimeout(() => {
      startTransition(() => {
        setJustApplied(false);
      });
    }, 3000);
  }

  return (
    <div className="rounded-none border border-site-border bg-site-surface text-site-foreground">
      {/* Accordion / Toggle Header */}
      <div className="flex items-center justify-between p-3 sm:px-4">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="donation-currency-assistant-panel"
          className="flex min-h-10 flex-1 items-center justify-between text-left text-sm font-semibold text-site-accent hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="text-base">💡</span>
            <span>{isOpen ? t("toggleConverterClose") : t("toggleConverterOpen")}</span>
          </span>
          <span className="text-xs font-mono text-site-muted">
            {isOpen ? "▲" : "▼"}
          </span>
        </button>
      </div>

      {isOpen && (
        <div
          id="donation-currency-assistant-panel"
          className="border-t border-site-border bg-site-canvas p-4 sm:p-5"
        >
          <div className="grid gap-4">
            {/* Title & Hint */}
            <div>
              <h4 className="text-sm font-bold text-site-foreground">{t("converterTitle")}</h4>
              <p className="mt-0.5 text-xs text-site-muted">{t("converterSubtitle")}</p>
            </div>

            {/* Currency Selector Chips */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-site-muted">
                {t("transferCurrencyLabel")}
              </span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("transferCurrencyLabel")}>
                {SUPPORTED_CURRENCIES.map((c) => {
                  const isSelected = selectedCurrency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleSelectCurrency(c.code)}
                      className={`inline-flex min-h-10 items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus ${
                        isSelected
                          ? "border-site-action bg-site-action text-site-on-action"
                          : "border-site-border bg-site-surface text-site-foreground hover:bg-site-canvas"
                      }`}
                    >
                      <span>{c.symbol}</span>
                      <span>{c.name[locale] || c.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transferred Amount Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={inputId} className="text-xs font-semibold text-site-foreground">
                {t("transferAmountLabel")} ({selectedCurrency})
              </label>
              <div className="relative flex items-center">
                <input
                  id={inputId}
                  type="number"
                  min="0.01"
                  step="any"
                  inputMode="decimal"
                  placeholder={t("transferAmountPlaceholder")}
                  value={inputAmount}
                  onChange={(e) => {
                    setInputAmount(e.target.value);
                    setJustApplied(false);
                  }}
                  className="box-border h-11 w-full border border-site-border bg-site-surface px-3 py-2 text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
                />
                <span className="pointer-events-none absolute right-3 text-xs font-mono font-bold text-site-muted">
                  {selectedCurrency}
                </span>
              </div>
            </div>

            {/* Quick Amount Presets */}
            {presets.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-site-muted">
                  {t("quickPresetsLabel")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((preset) => {
                    const isCurrent = Number(inputAmount) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className={`min-h-9 border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus ${
                          isCurrent
                            ? "border-site-accent bg-site-accent/15 font-bold text-site-accent"
                            : "border-site-border bg-site-surface text-site-body hover:bg-site-border/30"
                        }`}
                      >
                        {preset.toLocaleString()} {selectedCurrency === "THB" ? "฿" : selectedCurrency}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Converted Result Box */}
            <div className="border border-site-border bg-site-surface p-3.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs text-site-muted">{t("convertedResultLabel")}:</span>
                  <div className="mt-0.5 flex items-baseline gap-2 font-mono">
                    <span className="text-xl font-bold text-site-foreground">
                      {convertedEur.toFixed(2)} EUR
                    </span>
                    <span className="text-xs text-site-muted">
                      ({numericAmount > 0 ? `${numericAmount.toLocaleString()} ${selectedCurrency}` : "-"})
                    </span>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  disabled={convertedEur <= 0}
                  onClick={handleApply}
                  className={`inline-flex min-h-11 items-center justify-center border px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-50 ${
                    justApplied
                      ? "border-green-600 bg-green-700 text-white"
                      : "border-site-action bg-site-action text-site-on-action hover:bg-site-action-hover"
                  }`}
                >
                  {justApplied ? (
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden="true">✓</span>
                      <span>{t("appliedSuccess")}</span>
                    </span>
                  ) : (
                    <span>
                      {t("applyConvertedAmount", { amount: convertedEur.toFixed(2) })}
                    </span>
                  )}
                </button>
              </div>

              {/* Exchange Rate Text & Refresh */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-site-border/60 pt-2 text-[11px] text-site-muted">
                <span>
                  {t("exchangeRateReference", {
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
                  className="underline hover:text-site-foreground focus-visible:outline-2"
                >
                  {isRateLoading ? "..." : "↻"}
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] leading-relaxed text-site-muted">
              {t("exchangeRateDisclaimer")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
