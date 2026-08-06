import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AxiosError } from "axios";
import type { AxiosAdapter } from "axios";
import {
  accountApi,
  fetchAccount,
  fetchGoogleLinkStatus,
  getMemoryAccessToken,
  loginAccount,
  reauthenticateAccount,
  resetAccountClientForTests,
  startGoogleLink,
  toAccountApiError,
  unlinkGoogleAccount,
} from "./api";
import { accountSchema } from "./schema";

const validAccount = {
  id: "1b2e9d6a-8f3c-4a5b-9c2e-7d1f0a3b4c5d",
  email: "visitor@example.com",
  email_verified: true,
  account_status: "active",
  display_name: "Wanida",
  avatar_url: "",
  preferred_locale: "th",
  providers: ["password"],
};

interface MockAdapterOptions {
  refreshHandler: () => Promise<{ status: number; data: unknown }>;
}

function installMockAdapter(options: MockAdapterOptions): () => number {
  let refreshCalls = 0;
  const adapter: AxiosAdapter = async (config) => {
    const url = config.url ?? "";
    let result: { status: number; data: unknown };
    if (url.includes("/accounts/refresh")) {
      refreshCalls += 1;
      result = await options.refreshHandler();
    } else if (config.headers?.Authorization) {
      result = { status: 200, data: { success: true, data: validAccount } };
    } else {
      result = {
        status: 401,
        data: { success: false, error: "missing access token", code: "AUTH_TOKEN_INVALID_OR_EXPIRED" },
      };
    }
    // Mirror the real http adapter: non-2xx responses reject.
    if (result.status !== 200) {
      throw new AxiosError(
        `Request failed with status code ${result.status}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
        null,
        {
          data: result.data,
          status: result.status,
          statusText: result.status === 200 ? "OK" : "Error",
          headers: {},
          config,
        },
      );
    }
    return {
      data: result.data,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  accountApi.defaults.adapter = adapter;
  return () => refreshCalls;
}

beforeEach(() => {
  resetAccountClientForTests();
});

test("login stores the access token in memory only", async () => {
  const token = "memory-access-token-abc";
  accountApi.defaults.adapter = async (config) => ({
    data: { success: true, data: { access_token: token, expires_in: 900 } },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });

  const session = await loginAccount("visitor@example.com", "a-very-long-password-123");
  assert.equal(session.access_token, token);
  assert.equal(getMemoryAccessToken(), token);
});

test("reauthentication replaces the in-memory access token", async () => {
  const token = "fresh-reauthenticated-token";
  accountApi.defaults.adapter = async (config) => {
    assert.equal(config.url, "/accounts/reauthenticate");
    return {
      data: { success: true, data: { access_token: token, expires_in: 900 } },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };

  const session = await reauthenticateAccount("a-very-long-password-123");
  assert.equal(session.access_token, token);
  assert.equal(getMemoryAccessToken(), token);
});

test("two concurrent 401s trigger exactly one refresh", async () => {
  const refreshHandler = async () => {
    // Small delay so both 401 responses land before the first refresh resolves.
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { status: 200, data: { success: true, data: { access_token: "rotated-token", expires_in: 900 } } };
  };
  const getRefreshCalls = installMockAdapter({ refreshHandler });

  const [a, b] = await Promise.all([fetchAccount(), fetchAccount()]);

  assert.equal(a.email, "visitor@example.com");
  assert.equal(b.email, "visitor@example.com");
  assert.equal(getRefreshCalls(), 1);
  assert.equal(getMemoryAccessToken(), "rotated-token");
});

test("a failed refresh clears the in-memory token", async () => {
  const refreshHandler = async () => ({ status: 401, data: { success: false, error: "expired", code: "AUTH_TOKEN_INVALID_OR_EXPIRED" } });
  installMockAdapter({ refreshHandler });

  await assert.rejects(() => fetchAccount(), (error: unknown) => {
    // The interceptor converts the failure into an AccountApiError.
    const apiError = error as { code?: string };
    assert.equal(apiError.code, "AUTH_TOKEN_INVALID_OR_EXPIRED");
    assert.equal(getMemoryAccessToken(), null);
    return true;
  });
});

test("toAccountApiError maps validation field errors without any", () => {
  const body = {
    success: false,
    error: "Validation failed",
    code: "AUTH_VALIDATION",
    field_errors: [{ field: "email", message: "Invalid email" }],
  };
  const apiError = toAccountApiError({
    isAxiosError: true,
    response: { status: 400, data: body },
  });
  assert.equal(apiError.code, "AUTH_VALIDATION");
  assert.equal(apiError.status, 400);
  assert.deepEqual(apiError.fieldErrors, [{ field: "email", message: "Invalid email" }]);
});

test("toAccountApiError preserves an already-normalized invalid credentials error", () => {
  const apiError = toAccountApiError({
    isAxiosError: true,
    response: {
      status: 401,
      data: {
        success: false,
        code: "AUTH_INVALID_CREDENTIALS",
        error: "Incorrect email or password.",
        trace_id: "572534c4-4579-4f94-b5c4-9280ceb36430",
      },
    },
  });

  const normalizedAgain = toAccountApiError(apiError);
  assert.equal(normalizedAgain.code, "AUTH_INVALID_CREDENTIALS");
  assert.equal(normalizedAgain.message, "Incorrect email or password.");
  assert.equal(normalizedAgain.status, 401);
});

test("toAccountApiError falls back to AUTH_UNKNOWN for unparseable payloads", () => {
  const apiError = toAccountApiError(new Error("network down"));
  assert.equal(apiError.code, "AUTH_UNKNOWN");
  assert.equal(apiError.status, 0);
});

test("fetchAccount returns a schema-valid account", async () => {
  accountApi.defaults.adapter = async (config) => {
    void config;
    return {
      data: { success: true, data: validAccount },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };

  const account = await fetchAccount();
  assert.equal(accountSchema.safeParse(account).success, true);
});

test("startGoogleLink parses authorization URL", async () => {
  let capturedUrl = "";
  accountApi.defaults.adapter = async (config) => {
    capturedUrl = config.url ?? "";
    return {
      data: { success: true, data: { authorization_url: "https://accounts.google.com/o/oauth2/v2/auth?state=xyz" } },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };

  const url = await startGoogleLink("th", "/account");
  assert.equal(capturedUrl, "/accounts/google/link/start");
  assert.equal(url, "https://accounts.google.com/o/oauth2/v2/auth?state=xyz");
});

test("fetchGoogleLinkStatus parses cooldown seconds", async () => {
  accountApi.defaults.adapter = async (config) => {
    void config;
    return {
      data: { success: true, data: { connected: false, pending: true, retry_after_seconds: 42 } },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };

  const status = await fetchGoogleLinkStatus();
  assert.equal(status.connected, false);
  assert.equal(status.pending, true);
  assert.equal(status.retry_after_seconds, 42);
});

test("toAccountApiError preserves Google link retry hint", () => {
  const apiError = toAccountApiError({
    isAxiosError: true,
    response: {
      status: 429,
      data: {
        success: false,
        error: "A Google approval request is already pending.",
        code: "AUTH_GOOGLE_LINK_PENDING",
        retry_after_seconds: 42,
      },
    },
  });
  assert.equal(apiError.code, "AUTH_GOOGLE_LINK_PENDING");
  assert.equal(apiError.status, 429);
  assert.equal(apiError.retryAfterSeconds, 42);
});

test("unlinkGoogleAccount sends a DELETE with the password body", async () => {
  let capturedConfig: { url?: string; method?: string; data?: unknown } | null = null;
  accountApi.defaults.adapter = async (config) => {
    capturedConfig = { url: config.url, method: config.method, data: config.data };
    return {
      data: { success: true, message: "Google identity disconnected" },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };

  await unlinkGoogleAccount("correct horse battery staple");
  assert.equal(capturedConfig?.url, "/account/providers/google");
  assert.equal(capturedConfig?.method, "delete");
  assert.deepEqual(capturedConfig?.data, JSON.stringify({ password: "correct horse battery staple" }));
});
