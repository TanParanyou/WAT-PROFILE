import type { RichTextDocument } from "@/lib/rich-text/document";

export type CommunityLocale = "th" | "en" | "de";
export type CommunityLifecycle = "open" | "answered" | "resolved" | "locked" | "archived";

export interface CommunityCategory {
  id: string;
  slug: string;
  name: Record<CommunityLocale, string>;
  description?: Record<CommunityLocale, string>;
  sort_order: number;
}

export interface CommunityAuthor {
  user_id: string;
  display_name: string;
  avatar_url?: string;
}

export interface CommunityQuestionListItem {
  id: string;
  category: CommunityCategory;
  locale: CommunityLocale;
  title: string;
  slug: string;
  lifecycle_status: CommunityLifecycle;
  published_answer_count: number;
  official_answer_count: number;
  last_activity_at: string;
  created_at: string;
  author?: CommunityAuthor;
}

export interface CommunityQuestionList {
  items: CommunityQuestionListItem[];
  next_cursor?: string;
}

export interface CommunityAnswer {
  id: string;
  question_id: string;
  body: RichTextDocument;
  author?: CommunityAuthor;
  publication_status: "published";
  is_official: boolean;
  helpful_count: number;
  created_at: string;
  published_at?: string;
  version: number;
}

export interface CommunityComment {
  id: string;
  question_id: string;
  answer_id?: string;
  body: RichTextDocument;
  author?: CommunityAuthor;
  publication_status: "published";
  created_at: string;
  version: number;
}

export interface CommunityQuestionDetail {
  question: CommunityQuestionListItem;
  body: RichTextDocument;
  answers: CommunityAnswer[];
  comments: CommunityComment[];
  accepted_answer_id?: string;
  version: number;
  last_activity_at: string;
}

export interface CommunityQuestionMutation {
  question: CommunityQuestionListItem;
  body: RichTextDocument;
  publication_status: "pending_review" | "published" | "hidden" | "deleted";
  lifecycle_status: CommunityLifecycle;
  version: number;
  review_required: boolean;
}

export interface CommunityMemberQuestion {
  id: string;
  category: CommunityCategory;
  locale: CommunityLocale;
  title: string;
  slug: string;
  publication_status: "pending_review" | "published" | "hidden" | "deleted";
  lifecycle_status: CommunityLifecycle;
  version: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface CommunityMemberActivity {
  questions: CommunityMemberQuestion[];
}

export interface CommunityViewerState {
  is_authenticated: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_accept: boolean;
  has_voted: boolean;
  is_pending_owner: boolean;
}

export interface CommunityAnswerMutation {
  answer: CommunityAnswer;
  review_required: boolean;
}

export interface CommunityCommentMutation {
  comment: CommunityComment;
  review_required: boolean;
}

export interface CommunityAcceptanceResult {
  question_id: string;
  accepted_answer_id: string;
  version: number;
}

export interface CommunityHelpfulResult {
  answer_id: string;
  has_voted: boolean;
  helpful_count: number;
}

export type CommunityReportReason = "spam" | "harassment" | "misinformation" | "privacy" | "inappropriate" | "other";

export interface CommunityReport {
  id: string;
  target_type: "question" | "answer" | "comment";
  target_id: string;
  reason: CommunityReportReason;
  details?: string;
  state: "open" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
}

export interface CommunityNotification {
  id: string;
  event_type: "community.answer.created" | "community.comment.created" | "community.accepted" | "community.helpful" | "community.official" | "community.approval" | "community.revision" | "community.moderation";
  target_type: string;
  target_id?: string;
  read_at?: string;
  created_at: string;
}

export interface CommunityNotificationPage {
  items: CommunityNotification[];
  next_cursor?: string;
  unread_count: number;
}

export type CommunityNotificationPreferenceKey = "answer_created" | "comment_created" | "accepted_answer" | "helpful_vote" | "official_answer" | "first_contribution" | "revision_decision" | "moderation_decision";

export interface CommunityNotificationPreferences {
  email_preferences: Record<CommunityNotificationPreferenceKey, boolean>;
}

export interface CommunityQuestionListOptions {
  category_id?: string;
  locale?: CommunityLocale | "all";
  lifecycle?: CommunityLifecycle;
  search?: string;
  cursor?: string;
  limit?: number;
}
