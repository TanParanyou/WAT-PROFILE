export type ReauthReason =
  | "change_password"
  | "change_email"
  | "close_account"
  | "unlink_google"
  | "link_google";

export interface ReauthResult {
  method: "password" | "google";
  authenticatedAt: string;
}

export class AccountReauthError extends Error {
  readonly code:
    | "AUTH_REAUTH_CANCELLED"
    | "AUTH_REAUTH_IN_PROGRESS"
    | "AUTH_REAUTH_POPUP_BLOCKED";

  constructor(code: AccountReauthError["code"], message: string) {
    super(message);
    this.name = "AccountReauthError";
    this.code = code;
  }
}
