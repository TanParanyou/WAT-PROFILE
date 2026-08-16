import { test } from "node:test";
import assert from "node:assert/strict";
import en from "../../../messages/en.json";
import th from "../../../messages/th.json";
import de from "../../../messages/de.json";

function flattenKeys(value: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child !== null && typeof child === "object" && !Array.isArray(child)) {
      return flattenKeys(child as Record<string, unknown>, path);
    }
    return [path];
  });
}

function flattenValues(value: Record<string, unknown>): string[] {
  return Object.values(value).flatMap((child) =>
    child !== null && typeof child === "object" && !Array.isArray(child)
      ? flattenValues(child as Record<string, unknown>)
      : [String(child)],
  );
}

test("community message trees match in th en de", () => {
  assert.deepEqual(flattenKeys(th.Community), flattenKeys(en.Community));
  assert.deepEqual(flattenKeys(th.Community), flattenKeys(de.Community));
});

test("community messages are non-empty in th en de", () => {
  for (const messages of [th.Community, en.Community, de.Community]) {
    assert.equal(flattenValues(messages).every((value) => value.trim().length > 0), true);
  }
});
