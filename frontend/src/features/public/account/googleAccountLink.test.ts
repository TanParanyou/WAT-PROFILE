import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { subscribeToPageShow } from "./hooks/useGoogleRedirect";
import { runGoogleLinkStart, runReauthThenLinkStart } from "./hooks/useGoogleAccountLink";
import type { AccountApiError, GoogleLinkStatus } from "./types";

const originalWindow = globalThis.window;

beforeEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: new EventTarget() as unknown as Window,
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

test("pageshow clears redirecting after Google cancellation", () => {
  let redirecting = true;
  const unsubscribe = subscribeToPageShow(() => {
    redirecting = false;
  });
  window.dispatchEvent(new Event("pageshow"));
  assert.equal(redirecting, false);
  unsubscribe();
  window.dispatchEvent(new Event("pageshow"));
  assert.equal(redirecting, false);
});

test("cooldown prevents a second start before retry_after_seconds expires", async () => {
  const status: GoogleLinkStatus = {
    connected: false,
    pending: true,
    retry_after_seconds: 42,
  };
  let calls = 0;
  const outcome = await runGoogleLinkStart({
    status,
    locale: "en",
    start: async () => {
      calls += 1;
      return "https://accounts.google.com/authorize";
    },
  });
  assert.equal(outcome.kind, "cooldown");
  assert.equal(calls, 0);
});

test("AUTH_REAUTH_REQUIRED reauthenticates then retries link start", async () => {
  const reauthError: AccountApiError = {
    code: "AUTH_REAUTH_REQUIRED",
    message: "Please re-authenticate to continue.",
    status: 403,
    fieldErrors: [],
    retryAfterSeconds: 0,
  };
  let calls = 0;
  const start = async () => {
    calls += 1;
    if (calls === 1) {
      throw reauthError;
    }
    return "https://accounts.google.com/authorize";
  };

  const first = await runGoogleLinkStart({
    status: undefined,
    locale: "en",
    start,
  });
  assert.equal(first.kind, "error");
  if (first.kind === "error") {
    assert.equal(first.error.code, "AUTH_REAUTH_REQUIRED");
  }

  const retried = await runReauthThenLinkStart({
    password: "correct horse battery staple",
    reauthenticate: async () => undefined,
    status: undefined,
    locale: "en",
    start,
  });
  assert.equal(retried.kind, "redirect");
  assert.equal(calls, 2);
});
