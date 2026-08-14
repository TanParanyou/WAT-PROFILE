import assert from "node:assert/strict";
import test from "node:test";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import adminApi from "@/services/adminApi";
import { getAdminAccessToken, setAdminAccessToken } from "@/services/adminAuthStore";
import { CALENDAR_MAX_RANGE_DAYS, fetchCalendarFeedFromApi, validateCalendarFeedRange } from "./api";

test("calendar feed accepts the maximum inclusive range", () => {
  assert.doesNotThrow(() => validateCalendarFeedRange({ startDate: "2026-01-01", endDate: "2026-04-03" }));
  assert.equal(CALENDAR_MAX_RANGE_DAYS, 93);
});

test("calendar feed rejects reversed, malformed, and unbounded ranges", () => {
  for (const range of [
    { startDate: "2026-04-03", endDate: "2026-01-01" },
    { startDate: "2026-02-30", endDate: "2026-03-01" },
    { startDate: "2026-01-01", endDate: "2026-04-04" },
  ]) {
    assert.throws(() => validateCalendarFeedRange(range), /calendar feed range/i);
  }
});

test("admin calendar feed uses the authenticated admin API client", async () => {
  const previousAdapter = adminApi.defaults.adapter;
  const previousToken = getAdminAccessToken();
  let capturedRequest: InternalAxiosRequestConfig | null = null;
  setAdminAccessToken("calendar-admin-test-token");
  adminApi.defaults.adapter = async (config): Promise<AxiosResponse> => {
    capturedRequest = config;
    return {
      data: {
        success: true,
        data: {
          scope: "admin",
          locale: "th",
          timezone: "Europe/Berlin",
          range: { startDate: "2026-08-10", endDate: "2026-08-16" },
          entries: [],
          resources: [],
        },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
      request: {},
    };
  };

  try {
    const feed = await fetchCalendarFeedFromApi({
      scope: "admin",
      locale: "th",
      range: { startDate: "2026-08-10", endDate: "2026-08-16" },
    });

    assert.equal(feed.scope, "admin");
    assert.equal(capturedRequest?.url, "/admin/calendar");
    assert.equal(capturedRequest?.headers.Authorization, "Bearer calendar-admin-test-token");
  } finally {
    adminApi.defaults.adapter = previousAdapter;
    setAdminAccessToken(previousToken);
  }
});
