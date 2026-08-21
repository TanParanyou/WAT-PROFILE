export type AccountTab = "profile" | "registrations" | "preferences" | "security";

export type AccountDestination =
  | "/"
  | "/account"
  | "/account/login"
  | "/account/register"
  | "/account/forgot-password"
  | "/account/reset-password"
  | "/account/verify-email"
  | "/account/reopen-request"
  | "/account/reopen"
  | "/account/confirm-email-change"
  | "/account/link"
  | "/account/sessions"
  | "/account/registrations"
  | `/account?tab=${AccountTab}`;

const accountTabs: readonly AccountTab[] = [
  "profile",
  "registrations",
  "preferences",
  "security",
];

const allowedAccountPaths = new Set([
  "/account",
  "/account/login",
  "/account/register",
  "/account/forgot-password",
  "/account/verify-email",
  "/account/reopen-request",
  "/account/sessions",
]);

export function parseAccountTab(value: string | null): AccountTab {
  return accountTabs.includes(value as AccountTab) ? (value as AccountTab) : "profile";
}

export function buildAccountHref(tab: AccountTab): `/account?tab=${AccountTab}` {
  return `/account?tab=${tab}`;
}

export function isAccountPath(pathname: string): boolean {
  return pathname === "/account" || pathname.startsWith("/account/");
}

export function safeAccountReturnTo(
  value: string | null,
  fallback: AccountDestination,
): AccountDestination {
  if (!value || value.startsWith("//") || !value.startsWith("/")) return fallback;

  const [pathname, query = ""] = value.split("?", 2);
  if (!allowedAccountPaths.has(pathname)) return fallback;
  if (pathname !== "/account" || query === "") return pathname as AccountDestination;

  const tab = new URLSearchParams(query).get("tab");
  return buildAccountHref(parseAccountTab(tab));
}
