import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { AxiosError, type AxiosAdapter } from "axios";
import { publicApi } from "@/services/publicService";
import { accountApi, resetAccountClientForTests, setMemoryAccessToken } from "../account/api";
import { createEventRegistration } from "./api";
import type { RegistrationCreateInput } from "./types";

const input: RegistrationCreateInput = {
  locale: "th",
  contact: { first_name: "Tan", last_name: "Paranyou", email: "tan@example.com", phone: "" },
  participants: [{ first_name: "Tan", last_name: "Paranyou", dietary_restrictions: "", special_needs: "", additional_notes: "" }],
  privacy_notice_version: "2026-08",
  privacy_consent: true,
};

const detail = { id: 32, confirmation_code: "REG-TEST", participants: [] };

afterEach(() => {
  publicApi.defaults.adapter = undefined;
  accountApi.defaults.adapter = undefined;
  resetAccountClientForTests();
});

test("refreshes an expired account token before retrying public registration", async () => {
  let publicCalls = 0;
  let refreshCalls = 0;
  const authorizationHeaders: string[] = [];

  accountApi.defaults.adapter = async (config) => {
    refreshCalls += 1;
    assert.equal(config.url, "/accounts/refresh");
    return {
      data: { success: true, data: { access_token: "fresh-token", expires_in: 900 } },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };

  const publicAdapter: AxiosAdapter = async (config) => {
    publicCalls += 1;
    authorizationHeaders.push(String(config.headers?.Authorization ?? ""));
    if (publicCalls === 1) {
      throw new AxiosError("Invalid or expired access token", AxiosError.ERR_BAD_REQUEST, config, null, {
        data: { success: false, error: "Invalid or expired access token" },
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
      });
    }
    return { data: { success: true, data: detail }, status: 201, statusText: "Created", headers: {}, config };
  };
  publicApi.defaults.adapter = publicAdapter;
  setMemoryAccessToken("stale-token");

  const result = await createEventRegistration(32, input);

  assert.equal(result.id, 32);
  assert.equal(publicCalls, 2);
  assert.equal(refreshCalls, 1);
  assert.deepEqual(authorizationHeaders, ["Bearer stale-token", "Bearer fresh-token"]);
});
