import { test } from "node:test";
import assert from "node:assert/strict";
import { communityQuestionDetailSchema } from "./schema";

const richText = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] };
const author = {
  user_id: "10000000-0000-4000-8000-000000000001",
  display_name: "Visitor",
};
const category = {
  id: "10000000-0000-4000-8000-000000000002",
  slug: "general-questions",
  name: { th: "คำถามทั่วไป", en: "General Questions", de: "Allgemeine Fragen" },
  sort_order: 40,
};

function detailWithAuthor(extraAuthor: Record<string, unknown> = {}) {
  return {
    question: {
      id: "20000000-0000-4000-8000-000000000001",
      category,
      locale: "en",
      title: "How do I visit?",
      slug: "how-do-i-visit",
      lifecycle_status: "open",
      published_answer_count: 0,
      official_answer_count: 0,
      last_activity_at: "2026-08-16T08:00:00Z",
      created_at: "2026-08-16T08:00:00Z",
      author: { ...author, ...extraAuthor },
    },
    body: richText,
    answers: [],
    comments: [],
    version: 1,
    last_activity_at: "2026-08-16T08:00:00Z",
  };
}

test("public question detail accepts only public author fields", () => {
  assert.equal(communityQuestionDetailSchema.safeParse(detailWithAuthor()).success, true);
  assert.equal(
    communityQuestionDetailSchema.safeParse(detailWithAuthor({ email: "private@example.com" })).success,
    false,
  );
});

test("public question detail rejects internal projections", () => {
  assert.equal(
    communityQuestionDetailSchema.safeParse({ ...detailWithAuthor(), body_text: "internal search text" }).success,
    false,
  );
});
