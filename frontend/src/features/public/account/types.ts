export type AccountStatus = "pending_verification" | "active" | "disabled" | "closed";
export type AccountLocale = "th" | "en" | "de";
export type AccountProvider = "password" | "google";

export interface Account {
  id: string;
  email: string;
  email_verified: boolean;
  account_status: AccountStatus;
  display_name: string;
  avatar_url: string;
  preferred_locale: AccountLocale;
  providers: readonly AccountProvider[];
}

export interface AccountSession {
  id: string;
  current: boolean;
  user_agent_summary: string;
  ip_prefix: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
}

export interface AccountSessionResponse {
  access_token: string;
  expires_in: number;
}

export type AccountErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_EMAIL_VERIFICATION_REQUIRED"
  | "AUTH_TOKEN_INVALID_OR_EXPIRED"
  | "AUTH_RATE_LIMITED"
  | "AUTH_ACCOUNT_DISABLED"
  | "AUTH_REAUTH_REQUIRED"
  | "AUTH_EMAIL_ALREADY_REGISTERED"
  | "AUTH_VALIDATION"
  | "AUTH_GOOGLE_EMAIL_MISMATCH"
  | "AUTH_GOOGLE_IDENTITY_IN_USE"
  | "AUTH_GOOGLE_ALREADY_LINKED"
  | "AUTH_GOOGLE_LINK_PENDING"
  | "AUTH_INTERNAL"
  | "AUTH_UNKNOWN";

export interface AccountFieldError {
  field: string;
  message: string;
}

export interface AccountApiError {
  code: AccountErrorCode;
  message: string;
  status: number;
  fieldErrors: readonly AccountFieldError[];
  retryAfterSeconds: number;
}

export interface GoogleLinkStatus {
  connected: boolean;
  pending: boolean;
  retry_after_seconds: number;
}

export interface AccountProfileUpdateInput {
  display_name?: string;
  avatar_url?: string;
  preferred_locale?: AccountLocale;
}
