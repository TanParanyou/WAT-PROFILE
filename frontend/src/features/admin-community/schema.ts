import { z } from "zod";
import { isRichTextDocument, type RichTextDocument } from "@/lib/rich-text/document";

const richTextSchema = z.custom<RichTextDocument>(isRichTextDocument);
const localizedSchema = z.object({ th: z.string(), en: z.string(), de: z.string() }).strict();
const categorySchema = z.object({
  id: z.string().uuid(), slug: z.string(), name: localizedSchema, description: localizedSchema.optional(), sort_order: z.number().int(), is_active: z.boolean(),
}).strict();
const reportSchema = z.object({
  id: z.string().uuid(), target_type: z.enum(["question", "answer", "comment"]), target_id: z.string().uuid(), reason: z.enum(["spam", "harassment", "misinformation", "privacy", "inappropriate", "other"]), details: z.string().optional(), state: z.enum(["open", "reviewing", "resolved", "dismissed"]), created_at: z.string(),
}).strict();
const queueItemSchema = z.object({
  target_type: z.enum(["question", "answer", "comment"]), target_id: z.string().uuid(), question_id: z.string().uuid().optional(), title: z.string().optional(), body: richTextSchema.optional(), publication_status: z.enum(["pending_review", "published", "hidden", "deleted"]), created_at: z.string(),
}).strict();
const revisionSchema = z.object({
  id: z.string().uuid(), target_type: z.enum(["question", "answer", "comment"]), target_id: z.string().uuid(), title_before: z.string().optional(), title_after: z.string().optional(), body_before: richTextSchema, body_after: richTextSchema, review_status: z.enum(["pending", "approved", "rejected", "not_required"]), editor_user_id: z.string().uuid().optional(), created_at: z.string(),
}).strict();

export const adminCommunityCategoryListSchema = z.array(categorySchema);
export const adminCommunityQueueSchema = z.object({ items: z.array(queueItemSchema), reports: z.array(reportSchema), revisions: z.array(revisionSchema) }).strict();
export const adminCommunityCategorySchema = categorySchema;
