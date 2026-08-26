import test from "node:test";
import assert from "node:assert/strict";
import { toAdminRegistrationTableRow } from "./mappers";

test("maps typed registration item to admin table row", () => {
  const row = toAdminRegistrationTableRow({
    id: 7,
    registration_type: "guest",
    registration_status: "pending",
    confirmation_code: "ABC",
    contact: { first_name: "Ada", last_name: "Lovelace", email: "ada@example.com", phone: "123" },
    participants: [],
    participant_count: 2,
    event: { id: 1, slug: "vesak", title: { th: "วิสาขบูชา", en: "Vesak", de: "Vesak" }, start_date: "2026-05-01T00:00:00Z", end_date: "2026-05-01T00:00:00Z" },
    created_at: "2026-01-01T00:00:00Z",
  }, "en");
  assert.deepEqual(row, { id: 7, name: "Ada Lovelace", email: "ada@example.com", phone: "123", event_title: "Vesak", status: "pending", created_at: "2026-01-01T00:00:00Z", participant_count: 2, confirmation_code: "ABC", dietary_restrictions: "" });
});
