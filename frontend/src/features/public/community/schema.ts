import { z } from "zod";
import { isRichTextDocument, type RichTextDocument } from "@/lib/rich-text/document";

const richTextDocumentSchema = z.custom<RichTextDocument>(
  isRichTextDocument,
  "Expected a Tiptap document",
);

const localizedTextSchema = z.object({ th: z.string(), en: z.string(), de: z.string() }).strict();
const authorSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string(),
  avatar_url: z.string().optional(),
}).strict();
const categorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: localizedTextSchema,
  description: localizedTextSchema.optional(),
  sort_order: z.number().int(),
}).strict();

const questionListItemSchema = z.object({
  id: z.string().uuid(),
  category: categorySchema,
  locale: z.enum(["th", "en", "de"]),
  title: z.string(),
  slug: z.string(),
  lifecycle_status: z.enum(["open", "answered", "resolved", "locked", "archived"]),
  published_answer_count: z.number().int().nonnegative(),
  official_answer_count: z.number().int().nonnegative(),
  last_activity_at: z.string(),
  created_at: z.string(),
  author: authorSchema.optional(),
}).strict();

const answerSchema = z.object({
  id: z.string().uuid(),
  question_id: z.string().uuid(),
  body: richTextDocumentSchema,
  author: authorSchema.optional(),
  publication_status: z.literal("published"),
  is_official: z.boolean(),
  helpful_count: z.number().int().nonnegative(),
  created_at: z.string(),
  published_at: z.string().optional(),
  version: z.number().int().positive(),
}).strict();

const commentSchema = z.object({
  id: z.string().uuid(),
  question_id: z.string().uuid(),
  answer_id: z.string().uuid().optional(),
  body: richTextDocumentSchema,
  author: authorSchema.optional(),
  publication_status: z.literal("published"),
  created_at: z.string(),
  version: z.number().int().positive(),
}).strict();

export const communityCategoryListSchema = z.array(categorySchema);
export const communityQuestionListSchema = z.object({
  items: z.array(questionListItemSchema),
  next_cursor: z.string().optional(),
}).strict();
export const communityQuestionDetailSchema = z.object({
  question: questionListItemSchema,
  body: richTextDocumentSchema,
  answers: z.array(answerSchema),
  comments: z.array(commentSchema),
  accepted_answer_id: z.string().uuid().optional(),
  version: z.number().int().positive(),
  last_activity_at: z.string(),
}).strict();

export const communitySuccessEnvelopeSchema = <T extends z.ZodType>(data: T) =>
  z.object({ success: z.literal(true), data }).strict();

export type CommunityCategoryResponse = z.infer<typeof categorySchema>;
