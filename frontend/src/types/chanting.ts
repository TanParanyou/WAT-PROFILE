import type { MultiLangText } from "./api";

export type ChantingCategory =
  | "all"
  | "general"
  | "morning_chant"
  | "evening_chant"
  | "paritta"
  | "blessing"
  | "funeral";

export interface Chanting {
  id: number;
  slug: string;
  title: MultiLangText;
  subtitle?: MultiLangText;
  category: ChantingCategory;
  pali_thai: string;
  pali_roman: string;
  translation: MultiLangText;
  audio_url?: string;
  duration_seconds: number;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PaliScript = "thai" | "roman";
