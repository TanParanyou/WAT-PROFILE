import assert from "node:assert/strict";
import test from "node:test";
import {
  convertCurrency,
  formatExchangeRateText,
  DEFAULT_FALLBACK_RATES,
  CURRENCY_PRESETS,
} from "./currencyExchange";

test("convertCurrency handles same currency conversion", () => {
  assert.equal(convertCurrency(100, "EUR", "EUR"), 100);
  assert.equal(convertCurrency(500, "THB", "THB"), 500);
});

test("convertCurrency converts THB to EUR using fallback rate (37.00)", () => {
  // 500 / 37.0 = 13.5135... -> 13.51
  assert.equal(convertCurrency(500, "THB", "EUR"), 13.51);
  // 1000 / 37.0 = 27.027... -> 27.03
  assert.equal(convertCurrency(1000, "THB", "EUR"), 27.03);
});

test("convertCurrency converts EUR to THB using custom rates", () => {
  const customRates = { EUR: 1, THB: 38.5, USD: 1.05, CHF: 0.95 };
  // 10 * 38.5 = 385
  assert.equal(convertCurrency(10, "EUR", "THB", customRates), 385);
  // 100 USD -> EUR -> THB: (100 / 1.05) * 38.5 = 3666.666... -> 3666.67
  assert.equal(convertCurrency(100, "USD", "THB", customRates), 3666.67);
});

test("convertCurrency handles zero, negative, and invalid inputs gracefully", () => {
  assert.equal(convertCurrency(0, "THB", "EUR"), 0);
  assert.equal(convertCurrency(-50, "THB", "EUR"), 0);
  assert.equal(convertCurrency(Number.NaN, "THB", "EUR"), 0);
});

test("formatExchangeRateText generates informative string", () => {
  assert.equal(formatExchangeRateText("EUR"), "1 EUR = 1 EUR");
  assert.equal(formatExchangeRateText("THB", DEFAULT_FALLBACK_RATES), "1 EUR ≈ 37.00 THB");
  assert.equal(formatExchangeRateText("USD", DEFAULT_FALLBACK_RATES), "1 EUR ≈ 1.08 USD");
});

test("CURRENCY_PRESETS contains valid donation amounts for all supported currencies", () => {
  assert.ok(CURRENCY_PRESETS.THB.includes(500));
  assert.ok(CURRENCY_PRESETS.EUR.includes(50));
  assert.ok(CURRENCY_PRESETS.CHF.includes(100));
  assert.ok(CURRENCY_PRESETS.USD.includes(100));
});
