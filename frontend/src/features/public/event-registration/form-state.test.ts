import test from "node:test";
import assert from "node:assert/strict";
import { applyRegistrationAccountDefaults, createRegistrationDefaults, managementTokenFromHash, managementUrl } from "./form-state";

test("creates localized registration defaults without persisted data", () => {
  const defaults = createRegistrationDefaults("de");
  assert.equal(defaults.locale, "de");
  assert.equal(defaults.participants.length, 1);
  assert.equal(defaults.privacy_consent, false);
});

test("prefills only blank contact fields from the signed-in account", () => {
  const defaults = createRegistrationDefaults("th");
  const populated = applyRegistrationAccountDefaults(defaults, {
    display_name: " Ada Lovelace ",
    email: " ADA@EXAMPLE.COM ",
  });
  assert.equal(populated.contact.first_name, "Ada Lovelace");
  assert.equal(populated.contact.email, "ada@example.com");

  const edited = applyRegistrationAccountDefaults({
    ...defaults,
    contact: { first_name: "Edited", last_name: "Name", email: "edited@example.com", phone: "" },
  }, { display_name: "Account Name", email: "account@example.com" });
  assert.equal(edited.contact.first_name, "Edited");
  assert.equal(edited.contact.email, "edited@example.com");
});

test("reads management token only from hash parameters", () => {
  assert.equal(managementTokenFromHash("#token=abc123"), "abc123");
  assert.equal(managementTokenFromHash("#foo=bar"), null);
  assert.equal(managementTokenFromHash(""), null);
});

test("encodes management token in a fragment URL", () => {
  assert.match(managementUrl("a token"), /\/events\/registrations\/manage#token=a%20token$/);
});
