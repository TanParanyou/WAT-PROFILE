import assert from "node:assert/strict";
import test from "node:test";
import { formatDonationProofSize, validateDonationProofMetadata } from "./proof-upload";

const messages = { invalidType: "invalid type", tooLarge: "too large" };

test("proof validation accepts supported files and rejects invalid metadata", () => {
  assert.equal(validateDonationProofMetadata({ type: "image/png", size: 1024 }, messages), null);
  assert.equal(validateDonationProofMetadata({ type: "text/plain", size: 1024 }, messages), "invalid type");
  assert.equal(validateDonationProofMetadata({ type: "application/pdf", size: 10 * 1024 * 1024 + 1 }, messages), "too large");
});

test("proof size uses localized compact formatting", () => {
  assert.equal(formatDonationProofSize(1_572_864, "en"), "1.5 MB");
});
