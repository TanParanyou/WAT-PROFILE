import type { LocalizedText } from "./common";

export type ContentStatus = "draft" | "published" | "archived";

export interface SeoMetadata {
  canonical_url?: string;
  noindex?: boolean;
  title?: LocalizedText;
  description?: LocalizedText;
  og_image?: string;
  [key: string]: unknown;
}

export interface ContentSection {
  id: string;
  page_id: string;
  section_key: string;
  section_type: string;
  title: LocalizedText;
  description: LocalizedText;
  body: Record<string, unknown>;
  settings: Record<string, unknown>;
  sort_order: number;
  status: ContentStatus;
  published_title?: LocalizedText;
  published_description?: LocalizedText;
  published_body?: Record<string, unknown>;
  published_settings?: Record<string, unknown>;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentPage {
  id: string;
  page_key: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  seo: SeoMetadata;
  body: Record<string, unknown>;
  settings: Record<string, unknown>;
  status: ContentStatus;
  published_title?: LocalizedText;
  published_description?: LocalizedText;
  published_seo?: SeoMetadata;
  published_body?: Record<string, unknown>;
  published_settings?: Record<string, unknown>;
  published_at?: string | null;
  sections: ContentSection[];
  created_at: string;
  updated_at: string;
}

export interface PublicContentPage {
  id: string;
  page_key: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  seo: SeoMetadata;
  body: Record<string, unknown>;
  settings: Record<string, unknown>;
  status: ContentStatus;
  sections: ContentSection[];
  published_at?: string | null;
}

export interface CreateContentSectionRequest {
  section_type: string;
  section_key?: string;
  sort_order?: number;
}

export interface ReorderContentSectionsRequest {
  section_ids: string[];
}

export interface ArchiveContentSectionRequest {
  archived: boolean;
}

export interface DuplicateContentSectionRequest {
  section_key?: string;
}
