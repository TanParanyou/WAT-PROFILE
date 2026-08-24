import type { CommunityCategory, CommunityLocale, CommunityReportReason } from "@/features/public/community/types";
import type { RichTextDocument } from "@/lib/rich-text/document";

export interface AdminCommunityCategory extends CommunityCategory {
  is_active: boolean;
}

export interface AdminCommunityReport {
  id: string;
  target_type: "question" | "answer" | "comment";
  target_id: string;
  reason: CommunityReportReason;
  details?: string;
  state: "open" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
}

export interface AdminCommunityQueueItem {
  target_type: "question" | "answer" | "comment";
  target_id: string;
  question_id?: string;
  title?: string;
  body?: RichTextDocument;
  publication_status: "pending_review" | "published" | "hidden" | "deleted";
  created_at: string;
}

export interface AdminCommunityRevision {
  id: string;
  target_type: "question" | "answer" | "comment";
  target_id: string;
  title_before?: string;
  title_after?: string;
  body_before: RichTextDocument;
  body_after: RichTextDocument;
  review_status: "pending" | "approved" | "rejected" | "not_required";
  editor_user_id?: string;
  created_at: string;
}

export interface AdminCommunityQueue {
  items: AdminCommunityQueueItem[];
  reports: AdminCommunityReport[];
  revisions: AdminCommunityRevision[];
}

export interface AdminCategoryInput {
  slug: string;
  name: Record<CommunityLocale, string>;
  description?: Record<CommunityLocale, string>;
  sort_order: number;
  is_active: boolean;
}

export interface AdminUserOption {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  is_active: boolean;
  role?: {
    name: string;
  };
}
