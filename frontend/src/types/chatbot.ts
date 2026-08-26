import type { MultiLangText } from "./api";

export interface ChatbotKnowledgeBaseItem {
  id: number;
  category: string;
  question: MultiLangText;
  answer: MultiLangText;
  keywords: string[];
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatbotKnowledgeBaseInput {
  category: string;
  question: MultiLangText;
  answer: MultiLangText;
  keywords?: string[];
  priority?: number;
  is_active?: boolean;
}

export interface ChatbotListOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  active_only?: boolean;
}
