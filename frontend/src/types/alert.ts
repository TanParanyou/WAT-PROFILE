import { MultiLangText } from './api';

export type SiteAlertSeverity = 'info' | 'warning' | 'critical';
export type SiteAlertDisplayType = 'top_banner' | 'modal_popup';
export type SiteAlertScope = 'all_pages' | 'home_only';

export interface SiteAlert {
  id: number;
  title: MultiLangText;
  message: MultiLangText;
  severity: SiteAlertSeverity;
  display_type: SiteAlertDisplayType;
  scope: SiteAlertScope;
  action_text?: MultiLangText;
  action_url?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
  display_order: number;
  is_dismissible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteAlertFormData {
  title: MultiLangText;
  message: MultiLangText;
  severity: SiteAlertSeverity;
  display_type: SiteAlertDisplayType;
  scope: SiteAlertScope;
  action_text: MultiLangText;
  action_url: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  display_order: number;
  is_dismissible: boolean;
}
