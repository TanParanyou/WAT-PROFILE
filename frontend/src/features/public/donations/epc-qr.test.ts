import assert from "node:assert/strict";
import test from "node:test";
import { cleanIban, cleanBic, formatEpcAmount, generateEpcQrPayload } from "./epc-qr";

test("cleanIban removes whitespace and dashes, uppercasing result", () => {
  assert.equal(cleanIban("de12 3456-7890 12"), "DE123456789012");
});

test("cleanBic normalizes bic string", () => {
  assert.equal(cleanBic("by lad em1 xxx "), "BYLADEM1XXX");
});

test("formatEpcAmount formats valid positive amounts to EUR with 2 decimals", () => {
  assert.equal(formatEpcAmount(10), "EUR10.00");
  assert.equal(formatEpcAmount(25.5), "EUR25.50");
  assert.equal(formatEpcAmount(0), "");
  assert.equal(formatEpcAmount(-5), "");
});

test("generateEpcQrPayload builds valid EPC069-08 payload string", () => {
  const payload = generateEpcQrPayload({
    bic: "GENODEB1XXX",
    recipientName: "Wat Loung Por Sai e.V.",
    iban: "DE12345678901234567890",
    amount: 50,
    remittanceText: "Donation for temple",
  });

  const lines = payload.split("\n");
  assert.equal(lines[0], "BCD");
  assert.equal(lines[1], "002");
  assert.equal(lines[2], "1");
  assert.equal(lines[3], "SCT");
  assert.equal(lines[4], "GENODEB1XXX");
  assert.equal(lines[5], "Wat Loung Por Sai e.V.");
  assert.equal(lines[6], "DE12345678901234567890");
  assert.equal(lines[7], "EUR50.00");
  assert.equal(lines[8], "");
  assert.equal(lines[9], "");
  assert.equal(lines[10], "Donation for temple");
  assert.equal(lines[11], "");
});
