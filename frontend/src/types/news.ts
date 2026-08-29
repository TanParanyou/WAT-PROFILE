import { MultiLangText } from './api';
import type { RichTextDocument, LocalizedRichText } from '@/lib/rich-text/document';

export type NewsPublishStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface NewsCategory {
  id: number;
  slug: string;
  name: MultiLangText;
  description?: MultiLangText;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface NewsArticle {
  id: number;
  slug: string;
  title: MultiLangText;
  excerpt: MultiLangText;
  content: LocalizedRichText;
  cover_image_url: string;
  gallery_urls: string[];
  category_id?: number | null;
  category?: NewsCategory;
  author_name: string;
  publish_status: NewsPublishStatus;
  published_at?: string | null;
  scheduled_at?: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface NewsQueryParams {
  page?: number;
  limit?: number;
  category_id?: number | string;
  status?: NewsPublishStatus | 'all';
  search?: string;
  featured?: boolean;
}

export interface NewsCategoryFormData {
  slug: string;
  name: MultiLangText;
  description: MultiLangText;
  is_active: boolean;
  display_order: number;
}

export interface NewsArticleFormData {
  slug: string;
  title: MultiLangText;
  excerpt: MultiLangText;
  content: LocalizedRichText;
  cover_image_url: string;
  gallery_urls: string[];
  category_id: number | null;
  author_name: string;
  publish_status: NewsPublishStatus;
  published_at: string | null;
  scheduled_at: string | null;
  is_featured: boolean;
  is_pinned: boolean;
}
