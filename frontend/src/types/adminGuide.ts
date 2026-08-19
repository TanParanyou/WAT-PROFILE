import type { PermissionResource } from "@/types/auth";

export interface MultiLangContent {
  th: string;
  en: string;
  de: string;
}

export type GuideCategory =
  | "getting-started"
  | "website"
  | "operations"
  | "finance"
  | "system";

export interface GuideStep {
  stepNumber: number;
  title: MultiLangContent;
  description: MultiLangContent;
  tip?: MultiLangContent;
  warning?: MultiLangContent;
  codeOrPath?: string;
}

export interface GuideFaqItem {
  question: MultiLangContent;
  answer: MultiLangContent;
}

export type GuideStatusBadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "default";

export interface GuideStatusLegend {
  badgeVariant: GuideStatusBadgeVariant;
  label: MultiLangContent;
  meaning: MultiLangContent;
}

export interface GuideArticle {
  id: string;
  slug: string;
  category: GuideCategory;
  title: MultiLangContent;
  summary: MultiLangContent;
  iconName: string;
  resource?: PermissionResource;
  routePath?: string;
  quickSteps: MultiLangContent[];
  statusLegends?: GuideStatusLegend[];
  steps: GuideStep[];
  faqs?: GuideFaqItem[];
  relatedSlugs?: string[];
  updatedAt: string;
}

export interface GuideCategoryMeta {
  id: GuideCategory;
  title: MultiLangContent;
  description: MultiLangContent;
  iconName: string;
}
