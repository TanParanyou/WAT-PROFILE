import test from "node:test";
import assert from "node:assert/strict";
import { communityQuestionListSchema } from "./schema";

const category = {
  id: "10000000-0000-4000-8000-000000000001",
  slug: "general-questions",
  name: { th: "คำถามทั่วไป", en: "General Questions", de: "Allgemeine Fragen" },
  sort_order: 40,
};

test("community question list schema parses the public contract", () => {
  const parsed = communityQuestionListSchema.parse({
    items: [{
      id: "20000000-0000-4000-8000-000000000001",
      category,
      locale: "th",
      title: "คำถามเกี่ยวกับการมาวัด",
      slug: "visit-temple",
      lifecycle_status: "open",
      published_answer_count: 0,
      official_answer_count: 0,
      last_activity_at: "2026-08-16T08:00:00Z",
      created_at: "2026-08-16T08:00:00Z",
    }],
    next_cursor: "cursor",
  });
  assert.equal(parsed.items[0]?.category.slug, "general-questions");
});

test("community question list schema rejects unsupported lifecycle values", () => {
  assert.throws(() => communityQuestionListSchema.parse({ items: [{ lifecycle_status: "hidden" }] }));
});
