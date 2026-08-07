import type {
  AdminFilterRecord,
  AdminListParams,
} from "@/features/admin-list/types";

export type AdminAccountStatus =
  | "pending_verification"
  | "active"
  | "disabled"
  | "closed";

export type AdminAccountProvider = "password" | "google";

export type AccountOperationReason =
  | "security_review"
  | "policy_violation"
  | "user_request"
  | "support_request";

export interface AdminAccountSummary {
  id: string;
  email: string;
  display_name: string;
  account_status: AdminAccountStatus;
  email_verified: boolean;
  providers: AdminAccountProvider[];
  last_login_at: string | null;
  closed_at: string | null;
  purge_after: string | null;
  created_at: string;
}

export interface AdminAccountSecurityEvent {
  id: string;
  event_type: string;
  outcome: string;
  provider?: string;
  created_at: string;
}

export interface AccountFilters extends AdminFilterRecord {
  status: string[];
  provider: string[];
}

export type AccountListParams = AdminListParams<AccountFilters>;
export type AccountEventParams = AdminListParams<AdminFilterRecord>;
