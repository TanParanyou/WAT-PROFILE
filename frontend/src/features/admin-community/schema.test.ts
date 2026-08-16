import test from "node:test";
import assert from "node:assert/strict";
import { adminCommunityQueueSchema } from "./schema";

test("admin Community queue parses moderation items, reports, and revisions", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const document = { type: "doc", content: [] };
  const parsed = adminCommunityQueueSchema.parse({
    items: [{ target_type: "question", target_id: id, title: "Question", body: document, publication_status: "pending_review", created_at: "2026-01-01T00:00:00Z" }],
    reports: [{ id, target_type: "question", target_id: id, reason: "spam", state: "open", created_at: "2026-01-01T00:00:00Z" }],
    revisions: [{ id, target_type: "question", target_id: id, body_before: document, body_after: document, review_status: "pending", created_at: "2026-01-01T00:00:00Z" }],
  });
  assert.equal(parsed.items[0]?.target_type, "question");
  assert.equal(parsed.revisions[0]?.review_status, "pending");
});

test("admin Community queue rejects private unknown fields", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  assert.throws(() => adminCommunityQueueSchema.parse({ items: [], reports: [], revisions: [], internal_note: "secret" }));
  assert.doesNotThrow(() => adminCommunityQueueSchema.parse({ items: [], reports: [], revisions: [] }));
  assert.ok(id);
});
