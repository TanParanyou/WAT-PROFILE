import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatTime,
  formatTimeToHHmm,
  formatTimeRange,
  toCalendarDateTime,
  formatCurrency,
} from "./formatters";

describe("formatters utils", () => {
  describe("formatTimeToHHmm", () => {
    it("converts ISO strings with dummy dates to HH:mm", () => {
      assert.equal(formatTimeToHHmm("2000-01-01T09:00:00Z"), "09:00");
      assert.equal(formatTimeToHHmm("0000-01-01T15:30:00Z"), "15:30");
      assert.equal(formatTimeToHHmm("2026-08-14T07:15:00.000Z"), "07:15");
    });

    it("converts time-only strings to HH:mm", () => {
      assert.equal(formatTimeToHHmm("09:00"), "09:00");
      assert.equal(formatTimeToHHmm("09:00:00"), "09:00");
      assert.equal(formatTimeToHHmm("18:45:30"), "18:45");
    });

    it("handles null, undefined and empty strings", () => {
      assert.equal(formatTimeToHHmm(null), "");
      assert.equal(formatTimeToHHmm(undefined), "");
      assert.equal(formatTimeToHHmm(""), "");
    });
  });

  describe("formatTime", () => {
    it("formats ISO timestamps to time string in UTC", () => {
      assert.equal(formatTime("2000-01-01T09:00:00Z", "th"), "09:00");
      assert.equal(formatTime("2000-01-01T18:30:00Z", "en"), "06:30 PM");
    });

    it("formats time-only strings", () => {
      assert.equal(formatTime("09:00:00", "th"), "09:00");
      assert.equal(formatTime("18:30", "th"), "18:30");
    });

    it("returns dash for null or undefined", () => {
      assert.equal(formatTime(null), "-");
      assert.equal(formatTime(undefined), "-");
    });
  });

  describe("formatTimeRange", () => {
    it("formats time range correctly from ISO strings", () => {
      assert.equal(
        formatTimeRange("2000-01-01T09:00:00Z", "2000-01-01T10:30:00Z", "th"),
        "09:00 - 10:30"
      );
    });

    it("handles single time provided", () => {
      assert.equal(
        formatTimeRange("2000-01-01T09:00:00Z", null, "th"),
        "09:00"
      );
    });

    it("returns dash if both are null or invalid", () => {
      assert.equal(formatTimeRange(null, null, "th"), "-");
    });
  });

  describe("toCalendarDateTime", () => {
    it("formats calendar date and ISO time safely", () => {
      assert.equal(
        toCalendarDateTime("2026-08-14", "2000-01-01T09:00:00Z"),
        "20260814T090000"
      );
      assert.equal(
        toCalendarDateTime("2026-08-14", "09:00:00"),
        "20260814T090000"
      );
    });
  });

  describe("formatCurrency", () => {
    it("formats EUR and THB currency across locales", () => {
      assert.equal(formatCurrency(null), "-");
      assert.equal(formatCurrency(undefined), "-");
      assert.equal(formatCurrency("invalid"), "-");
      // German locale EUR formatting uses comma decimal
      const formattedDe = formatCurrency(50.5, "EUR", "de");
      assert.ok(formattedDe.includes("50,50") && formattedDe.includes("€"));

      // English locale EUR formatting
      const formattedEn = formatCurrency(50.5, "EUR", "en");
      assert.ok(formattedEn.includes("50.50") && formattedEn.includes("€"));
    });
  });
});
