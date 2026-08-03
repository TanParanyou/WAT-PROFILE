import axios from "axios";
import { API_BASE } from "@/services/api";
import {
  accountErrorEnvelopeSchema,
  parseAccount,
  parseAccountEnvelope,
  parseAccountSessionResponse,
  sessionsEnvelopeSchema,
} from "./schema";
import type {
  Account,
  AccountApiError,
  AccountErrorCode,
  AccountProfileUpdateInput,
  AccountSession,
  AccountSessionResponse,
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
    if (error.response?.status !== 401 || isExcludedFromRetry(original.url) || RETRIED.has(original)) {
      return Promise.reject(toAccountApiError(error));
    }
    RETRIED.add(original);

    try {
      const token = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${token}`;
      return accountApi(original);
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
  "AUTH_INTERNAL",
];

function isKnownCode(code: string): code is AccountErrorCode {
  return (KNOWN_CODES as readonly string[]).includes(code);
}

export function toAccountApiError(error: unknown): AccountApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data;
    const parsed = accountErrorEnvelopeSchema.safeParse(payload);
    if (parsed.success) {
      const { code, error: message, field_errors } = parsed.data;
      return {
        code: isKnownCode(code) ? code : "AUTH_UNKNOWN",
        message,
        status,
        fieldErrors: field_errors ?? [],
      };
    }
    return {
      code: "AUTH_UNKNOWN",
      message: error.message,
      status,
      fieldErrors: [],
    };
  }
  return {
    code: "AUTH_UNKNOWN",
    message: error instanceof Error ? error.message : "Unknown account API error",
    status: 0,
    fieldErrors: [],
  };
}

export async function loginAccount(email: string, password: string): Promise<AccountSessionResponse> {
  const response = await accountApi.post<unknown>("/accounts/login", { email, password });
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

export async function closeAccount(password: string): Promise<void> {
  await accountApi.post<unknown>("/account/close", { password });
  memoryAccessToken = null;
}

export function parseAccountPayload(payload: unknown): Account {
  return parseAccount(payload);
}
