import test from "node:test";
import assert from "node:assert/strict";
import { createRegistrationFormSchema, toRegistrationApiError } from "./schema";

const schema = createRegistrationFormSchema({ required: "required", emailInvalid: "invalid", maxParticipants: "too many", privacyRequired: "privacy" });

test("requires explicit privacy consent and supports multiple participants", () => {
  const result = schema.safeParse({ locale: "th", contact: { first_name: "A", last_name: "B", email: "a@example.com", phone: "1" }, participants: [{ first_name: "A", last_name: "B", dietary_restrictions: "", special_needs: "", additional_notes: "" }], privacy_notice_version: "v1", privacy_consent: false });
  assert.equal(result.success, false);
  const accepted = schema.safeParse({ locale: "th", contact: { first_name: "A", last_name: "B", email: "a@example.com", phone: "1" }, participants: [{ first_name: "A", last_name: "B", dietary_restrictions: "", special_needs: "", additional_notes: "" }, { first_name: "C", last_name: "D", dietary_restrictions: "", special_needs: "", additional_notes: "" }], privacy_notice_version: "v1", privacy_consent: true });
  assert.equal(accepted.success, true);
});

test("normalizes backend field maps into typed registration errors", () => {
  const error = toRegistrationApiError({ response: { status: 422, data: { code: "VALIDATION_ERROR", error: "Invalid", fields: { "contact.email": "Bad email" }, trace_id: "trace-1" } } });
  assert.equal(error.code, "VALIDATION_ERROR");
  assert.deepEqual(error.fieldErrors, [{ field: "contact.email", message: "Bad email" }]);
  assert.equal(error.traceId, "trace-1");
});
