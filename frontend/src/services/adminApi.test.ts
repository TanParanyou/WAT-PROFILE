import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import adminApi from "./adminApi.ts";
import {
  getAdminAccessToken,
  setAdminAccessToken,
  setAdminAuthLostHandler,
} from "./adminAuthStore.ts";

interface MockRoute {
  method: string;
  url: string;
  status: number | ((callCount: number) => number);
  data?: unknown;
}

function createMockAdapter(routes: MockRoute[]) {
  const hits = new Map<string, number>();
  const adapter = async (
    config: InternalAxiosRequestConfig,
  ): Promise<AxiosResponse> => {
    const method = (config.method ?? "get").toUpperCase();
    const key = `${method} ${config.url}`;
    const count = (hits.get(key) ?? 0) + 1;
    hits.set(key, count);

    const route = routes.find((r) => r.method === method && r.url === config.url);
    if (!route) {
      throw new AxiosError(`No mock route for ${key}`, "ERR_NETWORK", config);
    }

    const status = typeof route.status === "function" ? route.status(count) : route.status;
    const response: AxiosResponse = {
      data: route.data,
      status,
      statusText: status === 200 ? "OK" : "Error",
      headers: {},
      config,
      request: {},
    };

    if (status >= 200 && status < 300) {
      return response;
    }

    throw new AxiosError(
      `Request failed with status code ${status}`,
      status === 401 ? "ERR_BAD_REQUEST" : "ERR_BAD_RESPONSE",
      config,
      {},
      response,
    );
  };
  return { adapter, hits };
}

function resetAdminApiForTest() {
  adminApi.defaults.adapter = undefined;
  setAdminAccessToken(null);
  setAdminAuthLostHandler(null);
}

test("concurrent 401s trigger a single refresh and replay each request once", async () => {
  resetAdminApiForTest();
  const routes: MockRoute[] = [
    {
      method: "POST",
      url: "/auth/admin/refresh",
      status: 200,
      data: {
        success: true,
        data: { access_token: "refreshed-token", user: { id: "u1" } },
      },
    },
    {
      method: "GET",
      url: "/admin/events",
      status: (call: number) => (call === 1 ? 401 : 200),
      data: { success: true, data: [] },
    },
  ];
  const { adapter, hits } = createMockAdapter(routes);
  adminApi.defaults.adapter = adapter;

  const results = await Promise.all([
    adminApi.get("/admin/events"),
    adminApi.get("/admin/events"),
    adminApi.get("/admin/events"),
  ]);

  assert.equal(hits.get("POST /auth/admin/refresh"), 1);
  assert.equal(hits.get("GET /admin/events"), 3);
  assert.equal(getAdminAccessToken(), "refreshed-token");
  for (const res of results) {
    assert.equal(res.status, 200);
  }
});

test("403 responses never trigger a refresh", async () => {
  resetAdminApiForTest();
  setAdminAccessToken("existing-token");
  const routes: MockRoute[] = [
    {
      method: "GET",
      url: "/admin/events",
      status: 403,
      data: { success: false, error: "Insufficient permissions" },
    },
    {
      method: "POST",
      url: "/auth/admin/refresh",
      status: 200,
      data: {
        success: true,
        data: { access_token: "refreshed-token", user: { id: "u1" } },
      },
    },
  ];
  const { adapter, hits } = createMockAdapter(routes);
  adminApi.defaults.adapter = adapter;

  await assert.rejects(adminApi.get("/admin/events"), (err: unknown) => {
    const axiosError = err as AxiosError;
    assert.ok(axiosError instanceof AxiosError);
    assert.equal(axiosError.response?.status, 403);
    return true;
  });
  assert.equal(hits.has("POST /auth/admin/refresh"), false);
  assert.equal(getAdminAccessToken(), "existing-token");
});

test("failed admin login never triggers a refresh", async () => {
  resetAdminApiForTest();
  const routes: MockRoute[] = [
    {
      method: "POST",
      url: "/auth/admin/login",
      status: 401,
      data: {
        success: false,
        error: "Invalid email or password",
        code: "ADMIN_INVALID_CREDENTIALS",
      },
    },
    {
      method: "POST",
      url: "/auth/admin/refresh",
      status: 200,
      data: {
        success: true,
        data: { access_token: "refreshed-token", user: { id: "u1" } },
      },
    },
  ];
  const { adapter, hits } = createMockAdapter(routes);
  adminApi.defaults.adapter = adapter;

  await assert.rejects(
    adminApi.post("/auth/admin/login", { email: "a@b.c", password: "wrong" }),
    (err: unknown) => {
      const axiosError = err as AxiosError;
      assert.ok(axiosError instanceof AxiosError);
      assert.equal(axiosError.response?.status, 401);
      const body = axiosError.response?.data as { code?: string };
      assert.equal(body.code, "ADMIN_INVALID_CREDENTIALS");
      return true;
    },
  );
  assert.equal(hits.has("POST /auth/admin/refresh"), false);
});

test("failed refresh notifies the auth-loss handler", async () => {
  resetAdminApiForTest();
  let lostCalls = 0;
  setAdminAuthLostHandler(() => {
    lostCalls += 1;
  });
  const routes: MockRoute[] = [
    {
      method: "GET",
      url: "/admin/events",
      status: 401,
      data: { success: false, error: "Invalid or expired admin token" },
    },
    {
      method: "POST",
      url: "/auth/admin/refresh",
      status: 401,
      data: {
        success: false,
        error: "Admin session is invalid or expired",
        code: "ADMIN_SESSION_INVALID",
      },
    },
  ];
  const { adapter, hits } = createMockAdapter(routes);
  adminApi.defaults.adapter = adapter;

  await assert.rejects(adminApi.get("/admin/events"));
  assert.equal(hits.get("POST /auth/admin/refresh"), 1);
  assert.equal(lostCalls, 1);
});
