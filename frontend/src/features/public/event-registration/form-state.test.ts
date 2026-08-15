import test from "node:test";
import assert from "node:assert/strict";
import { createRegistrationDefaults, managementTokenFromHash, managementUrl } from "./form-state";

test("creates localized registration defaults without persisted data", () => {
  const defaults = createRegistrationDefaults("de");
  assert.equal(defaults.locale, "de");
  assert.equal(defaults.participants.length, 1);
  assert.equal(defaults.privacy_consent, false);
});

test("reads management token only from hash parameters", () => {
  assert.equal(managementTokenFromHash("#token=abc123"), "abc123");
  assert.equal(managementTokenFromHash("#foo=bar"), null);
  assert.equal(managementTokenFromHash(""), null);
});

test("encodes management token in a fragment URL", () => {
  assert.match(managementUrl("a token"), /\/events\/registrations\/manage#token=a%20token$/);
});
