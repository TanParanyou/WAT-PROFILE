import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { subscribeToPageShow } from "./hooks/useGoogleRedirect";

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

test("page restore notifies external auth redirect state", () => {
  let restoreCount = 0;
  const unsubscribe = subscribeToPageShow(() => {
    restoreCount += 1;
  });

  window.dispatchEvent(new Event("pageshow"));
  assert.equal(restoreCount, 1);

  unsubscribe();
  window.dispatchEvent(new Event("pageshow"));
  assert.equal(restoreCount, 1);
});
