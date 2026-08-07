import axios from "axios";
import { API_BASE } from "@/services/api";
import {
  accountErrorEnvelopeSchema,
  parseAccount,
  parseAccountEnvelope,
  parseAccountClosureResponse,
  parseAccountSessionResponse,
  parseGoogleLinkStatus,
  parseGoogleStartResponse,
  sessionsEnvelopeSchema,
} from "./schema";
import type {
  Account,
  AccountApiError,
  AccountErrorCode,
  AccountProfileUpdateInput,
  AccountSession,
  AccountSessionResponse,
  GoogleLinkStatus,
} from "./types";

// Public-account access tokens are held ONLY in module memory. They are never
// written to localStorage or any other persistent browser storage. The refresh
// token is managed entirely by the server via the HttpOnly cookie, which the
// browser sends automatically because withCredentials is enabled.
let memoryAccessToken: string | null = null;

// A single shared refresh promise: concurrent 401 responses must trigger at
// most one refresh request. Each caller awaits the same promise.
let pendingRefresh: Promise<string> | null = null;

const RETRIED = new WeakSet<object>();

type RetriableAccountConfig = {
  __accountAuthRetried?: boolean;
};

const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function getMemoryAccessToken(): string | null {
  return memoryAccessToken;
}

export function setMemoryAccessToken(token: string | null): void {
  memoryAccessToken = token;
}

export function resetAccountClientForTests(): void {
  memoryAccessToken = null;
  pendingRefresh = null;
}

function isExcludedFromRetry(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes("/accounts/login") || url.includes("/accounts/refresh");
}

interface AccountRetryConfig {
  url?: string;
  method?: string;
}

function shouldRefreshAfterUnauthorized(
  error: unknown,
  original: AccountRetryConfig,
): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 401)
    return false;
  if (isExcludedFromRetry(original.url)) return false;

  // Credential-changing and other mutating requests must never be replayed
  // automatically after a 401. A stale token can be recovered on the next
  // read, while an intentional credential error must reach the form exactly
  // once instead of entering a refresh loop.
  const method = (original.method ?? "GET").toUpperCase();
  if (!READ_ONLY_METHODS.has(method)) return false;

  const apiError = toAccountApiError(error);
  return (
    apiError.code === "AUTH_TOKEN_INVALID_OR_EXPIRED" ||
    apiError.code === "AUTH_UNKNOWN"
  );
}

export const accountApi = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

accountApi.interceptors.request.use((config) => {
  if (memoryAccessToken) {
    config.headers.Authorization = `Bearer ${memoryAccessToken}`;
  }
  return config;
});

async function performRefresh(): Promise<string> {
  // Route through accountApi so it shares the instance adapter (and, in tests,
  // the same mocked adapter). The refresh URL is excluded from the retry loop,
  // so a failed refresh cannot recurse.
  const response = await accountApi.post<unknown>("/accounts/refresh");
  const parsed = parseAccountSessionResponse(response.data);
  memoryAccessToken = parsed.access_token;
  return parsed.access_token;
}

function refreshAccessToken(): Promise<string> {
  if (!pendingRefresh) {
    pendingRefresh = performRefresh().finally(() => {
      pendingRefresh = null;
    });
  }
  return pendingRefresh;
}

accountApi.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(toAccountApiError(error));
    }
    const original = error.config;
    const retryConfig = original as typeof original & RetriableAccountConfig;
    if (
      !shouldRefreshAfterUnauthorized(error, original) ||
      RETRIED.has(original) ||
      retryConfig.__accountAuthRetried
    ) {
      return Promise.reject(toAccountApiError(error));
    }
    RETRIED.add(original);
    retryConfig.__accountAuthRetried = true;

    try {
      const token = await refreshAccessToken();
      retryConfig.headers.Authorization = `Bearer ${token}`;
      return accountApi(retryConfig);
    } catch {
      memoryAccessToken = null;
      return Promise.reject(toAccountApiError(error));
    }
  },
);

const KNOWN_CODES: readonly AccountErrorCode[] = [
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_EMAIL_VERIFICATION_REQUIRED",
  "AUTH_TOKEN_INVALID_OR_EXPIRED",
  "AUTH_RATE_LIMITED",
  "AUTH_ACCOUNT_DISABLED",
  "AUTH_REAUTH_REQUIRED",
  "AUTH_EMAIL_ALREADY_REGISTERED",
  "AUTH_VALIDATION",
  "AUTH_GOOGLE_EMAIL_MISMATCH",
  "AUTH_GOOGLE_IDENTITY_IN_USE",
  "AUTH_GOOGLE_ALREADY_LINKED",
  "AUTH_GOOGLE_LINK_PENDING",
  "AUTH_INTERNAL",
  "AUTH_UNKNOWN",
];

function isKnownCode(code: string): code is AccountErrorCode {
  return (KNOWN_CODES as readonly string[]).includes(code);
}

function isAccountApiError(error: unknown): error is AccountApiError {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as Record<string, unknown>;
  if (
    typeof candidate.code !== "string" ||
    !isKnownCode(candidate.code) ||
    typeof candidate.message !== "string" ||
    typeof candidate.status !== "number" ||
    !Array.isArray(candidate.fieldErrors)
  ) {
    return false;
  }

  return candidate.fieldErrors.every((fieldError) => {
    if (typeof fieldError !== "object" || fieldError === null) return false;
    const candidateFieldError = fieldError as Record<string, unknown>;
    return (
      typeof candidateFieldError.field === "string" &&
      typeof candidateFieldError.message === "string"
    );
  });
}

export function toAccountApiError(error: unknown): AccountApiError {
  if (isAccountApiError(error)) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data;
    const parsed = accountErrorEnvelopeSchema.safeParse(payload);
    if (parsed.success) {
      const {
        code,
        error: message,
        field_errors,
        retry_after_seconds,
      } = parsed.data;
      return {
        code: isKnownCode(code) ? code : "AUTH_UNKNOWN",
        message,
        status,
        fieldErrors: field_errors ?? [],
        retryAfterSeconds: retry_after_seconds ?? 0,
      };
    }
    return {
      code: "AUTH_UNKNOWN",
      message: error.message,
      status,
      fieldErrors: [],
      retryAfterSeconds: 0,
    };
  }
  return {
    code: "AUTH_UNKNOWN",
    message:
      error instanceof Error ? error.message : "Unknown account API error",
    status: 0,
    fieldErrors: [],
    retryAfterSeconds: 0,
  };
}

export async function loginAccount(
  email: string,
  password: string,
): Promise<AccountSessionResponse> {
  const response = await accountApi.post<unknown>("/accounts/login", {
    email,
    password,
  });
  const session = parseAccountSessionResponse(response.data);
  memoryAccessToken = session.access_token;
  return session;
}

/**
 * Registers a new public account. The backend responds generically; callers
 * must not surface account-existence details to the visitor.
 */
export async function registerAccount(input: {
  email: string;
  password: string;
  display_name: string;
  locale: string;
}): Promise<void> {
  await accountApi.post<unknown>("/accounts/register", input);
}

export async function verifyEmail(token: string): Promise<void> {
  await accountApi.post<unknown>("/accounts/verify-email", { token });
}

export async function resendVerification(
  email: string,
  locale: string,
): Promise<void> {
  await accountApi.post<unknown>("/accounts/resend-verification", {
    email,
    locale,
  });
}

export async function forgotPassword(
  email: string,
  locale: string,
): Promise<void> {
  await accountApi.post<unknown>("/accounts/forgot-password", {
    email,
    locale,
  });
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  await accountApi.post<unknown>("/accounts/reset-password", {
    token,
    new_password: newPassword,
  });
}

/**
 * Starts the Google OAuth flow. The backend sets the HttpOnly flow cookie and
 * returns the authorization URL; the browser must navigate to it directly.
 */
export async function startGoogle(
  locale: string,
  returnTo: string,
): Promise<string> {
  const response = await accountApi.get<unknown>("/accounts/google/start", {
    params: { locale, return_to: returnTo },
  });
  const parsed = parseGoogleStartResponse(response.data);
  return parsed.authorization_url;
}

/**
 * Starts the authenticated Google-link OAuth flow for the current account.
 * Uses the same signed flow cookie and authorization URL contract as the
 * anonymous start; the target account is bound server-side to the signed-in
 * user.
 */
export async function startGoogleLink(
  locale: string,
  returnTo: string,
): Promise<string> {
  const response = await accountApi.get<unknown>(
    "/accounts/google/link/start",
    {
      params: { locale, return_to: returnTo },
    },
  );
  const parsed = parseGoogleStartResponse(response.data);
  return parsed.authorization_url;
}

/**
 * Starts a Google re-authentication flow bound to the currently signed-in
 * account. The callback cannot switch the browser into another Google account.
 */
export async function startGoogleReauthentication(
  locale: string,
  returnTo: string,
): Promise<string> {
  const response = await accountApi.get<unknown>(
    "/accounts/google/reauth/start",
    {
      params: { locale, return_to: returnTo },
    },
  );
  const parsed = parseGoogleStartResponse(response.data);
  return parsed.authorization_url;
}

export async function fetchGoogleLinkStatus(): Promise<GoogleLinkStatus> {
  const response = await accountApi.get<unknown>(
    "/accounts/google/link/status",
  );
  return parseGoogleLinkStatus(response.data);
}

export async function unlinkGoogleAccount(): Promise<void> {
  await accountApi.delete<unknown>("/account/providers/google");
}

export async function confirmGoogleLink(
  token: string,
): Promise<AccountSessionResponse> {
  const response = await accountApi.post<unknown>(
    "/accounts/google/link/confirm",
    { token },
  );
  const session = parseAccountSessionResponse(response.data);
  memoryAccessToken = session.access_token;
  return session;
}

export async function logoutAccount(): Promise<void> {
  await accountApi.post<unknown>("/accounts/logout");
  memoryAccessToken = null;
}

export async function logoutAllAccounts(): Promise<void> {
  await accountApi.post<unknown>("/accounts/logout-all");
  memoryAccessToken = null;
}

/**
 * Attempts a silent session restore using the HttpOnly refresh cookie. Resolves
 * with the fresh access token (stored in module memory) on success, and rejects
 * when no valid session exists (e.g. first visit or expired cookie).
 */
export async function restoreSession(): Promise<string> {
  const token = await refreshAccessToken();
  return token;
}

export async function reauthenticateAccount(
  password: string,
): Promise<AccountSessionResponse> {
  let response: { data: unknown };
  try {
    response = await accountApi.post<unknown>("/accounts/reauthenticate", {
      password,
    });
  } catch (error: unknown) {
    const apiError = toAccountApiError(error);
    const canRestoreSession =
      apiError.status === 401 &&
      (apiError.code === "AUTH_TOKEN_INVALID_OR_EXPIRED" ||
        apiError.code === "AUTH_UNKNOWN");
    if (!canRestoreSession) throw error;

    // Re-authentication is an explicit user action. If only the in-memory
    // access token is stale, restore it from the HttpOnly refresh cookie and
    // submit the password once more. Credential failures never enter this
    // branch and are still returned to the form unchanged.
    await restoreSession();
    response = await accountApi.post<unknown>("/accounts/reauthenticate", {
      password,
    });
  }
  const session = parseAccountSessionResponse(response.data);
  memoryAccessToken = session.access_token;
  return session;
}

export async function changePasswordAccount(
  newPassword: string,
): Promise<AccountSessionResponse> {
  const response = await accountApi.post<unknown>("/account/password", {
    new_password: newPassword,
  });
  const session = parseAccountSessionResponse(response.data);
  memoryAccessToken = session.access_token;
  return session;
}

export async function requestEmailChange(
  newEmail: string,
  locale: string,
): Promise<void> {
  await accountApi.post<unknown>("/account/email-change", {
    new_email: newEmail,
    locale,
  });
}

export async function confirmEmailChange(token: string): Promise<void> {
  await accountApi.post<unknown>("/accounts/confirm-email-change", { token });
}

export async function requestAccountReopen(
  email: string,
  locale: string,
): Promise<void> {
  await accountApi.post<unknown>("/accounts/reopen-request", { email, locale });
}

export async function confirmAccountReopen(token: string): Promise<void> {
  await accountApi.post<unknown>("/accounts/reopen-confirm", { token });
}

export async function fetchAccount(): Promise<Account> {
  const response = await accountApi.get<unknown>("/account");
  return parseAccountEnvelope(response.data);
}

export async function fetchSessions(): Promise<readonly AccountSession[]> {
  const response = await accountApi.get<unknown>("/account/sessions");
  const parsed = sessionsEnvelopeSchema.parse(response.data);
  return parsed.data.sessions;
}

export async function revokeAccountSession(sessionId: string): Promise<void> {
  await accountApi.delete<unknown>(`/account/sessions/${sessionId}`);
}

export async function updateAccountProfile(
  input: AccountProfileUpdateInput,
): Promise<Account> {
  const response = await accountApi.patch<unknown>("/account/profile", input);
  return parseAccountEnvelope(response.data);
}

export async function uploadAccountAvatar(file: File): Promise<Account> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  const response = await accountApi.post<unknown>("/account/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return parseAccountEnvelope(response.data);
}

export async function closeAccount(): Promise<{ purge_after: string }> {
  const response = await accountApi.post<unknown>("/account/close", {});
  memoryAccessToken = null;
  return parseAccountClosureResponse(response.data);
}

export function parseAccountPayload(payload: unknown): Account {
  return parseAccount(payload);
}
