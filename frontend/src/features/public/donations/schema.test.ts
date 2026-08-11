import assert from "node:assert/strict";
import test from "node:test";
import { createSelfReportedDonationSchema } from "./schema";

const messages = {
  amountPositive: "amount required",
  amountDecimals: "amount decimals",
  currency: "currency invalid",
  dateRequired: "date required",
  dateInvalid: "date invalid",
  timeRequired: "time required",
  timeInvalid: "time invalid",
  method: "method invalid",
  nameRequired: "name required",
  emailRequired: "email required",
  emailInvalid: "email invalid",
  phoneInvalid: "phone invalid",
  categoryInvalid: "category invalid",
  receiptEmail: "receipt email required",
  privacyRequired: "privacy required",
  proofRequired: "proof required",
  proofType: "proof type invalid",
  proofSize: "proof size invalid",
};

test("accepts the general donation category option as empty", () => {
  const schema = createSelfReportedDonationSchema(messages);
  const result = schema.safeParse({
    amount: "100",
    currency: "EUR",
    donation_date: "2026-08-11",
    donation_time: "09:15",
    donation_method: "bank_transfer",
    donor_name: "Donor",
    donor_email: "donor@example.com",
    donor_phone: "",
    category_id: "",
    locale: "th",
    receipt_requested: false,
    privacy_acknowledged: true,
    proof: new File([new Uint8Array([1])], "proof.png", { type: "image/png" }),
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.category_id, null);
});
