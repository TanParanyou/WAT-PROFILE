import assert from "node:assert/strict";
import test from "node:test";
import { lockScroll, unlockScroll } from "./useScrollLock";

test("lockScroll and unlockScroll manage body overflow correctly", () => {
  // Mock global document
  const mockBody = { style: { overflow: "" } };
  (globalThis as unknown as { document: { body: typeof mockBody } }).document = {
    body: mockBody,
  };

  mockBody.style.overflow = "auto";
  lockScroll();
  assert.equal(mockBody.style.overflow, "hidden");

  // Nested lock
  lockScroll();
  assert.equal(mockBody.style.overflow, "hidden");

  // First unlock (still locked due to nested)
  unlockScroll();
  assert.equal(mockBody.style.overflow, "hidden");

  // Second unlock (restores original overflow)
  unlockScroll();
  assert.equal(mockBody.style.overflow, "auto");
});
