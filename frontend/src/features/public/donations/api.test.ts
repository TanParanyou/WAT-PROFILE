import assert from "node:assert/strict";
import test from "node:test";
import { createSelfReportedDonationFormData, type SelfReportedDonationPayload } from "./api";

test("omits an optional empty donation category from multipart data", () => {
  const payload: SelfReportedDonationPayload = {
    amount: 100,
    currency: "EUR",
    donation_date: "2026-08-11",
    donation_time: "09:15",
    donation_method: "bank_transfer",
    donor_name: "Donor",
    donor_email: "donor@example.com",
    category_id: null,
    locale: "th",
    receipt_requested: false,
    privacy_acknowledged: true,
    proof: new File([], "proof.png", { type: "image/png" }),
  };

  const form = createSelfReportedDonationFormData(payload);

  assert.equal(form.get("category_id"), null);
  assert.equal(form.get("donation_time"), "09:15");
});
