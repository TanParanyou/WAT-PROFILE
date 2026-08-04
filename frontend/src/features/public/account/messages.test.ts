import { test } from "node:test";
import assert from "node:assert/strict";
import en from "../../../messages/en.json";
import th from "../../../messages/th.json";
import de from "../../../messages/de.json";
import {
  normalizeAccountEmail,
  validateDisplayName,
  validatePassword,
  validateReturnTo,
} from "./validation";

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

test("account message trees match in th en de", () => {
  assert.ok(en.Account, "en.json must define an Account namespace");
  assert.ok(th.Account, "th.json must define an Account namespace");
  assert.ok(de.Account, "de.json must define an Account namespace");
  assert.deepEqual(flattenKeys(th.Account), flattenKeys(en.Account));
  assert.deepEqual(flattenKeys(th.Account), flattenKeys(de.Account));
});

test("normalizeAccountEmail trims and lowercases", () => {
  assert.equal(normalizeAccountEmail("  Visitor@Example.com "), "visitor@example.com");
  assert.equal(normalizeAccountEmail("WANIDA@EXAMPLE.CO"), "wanida@example.co");
  assert.equal(normalizeAccountEmail(""), "");
});

test("validatePassword enforces required and 12-128 characters", () => {
  assert.equal(validatePassword(""), "passwordRequired");
  assert.equal(validatePassword("short"), "passwordMin");
  assert.equal(validatePassword("a".repeat(11)), "passwordMin");
  assert.equal(validatePassword("a".repeat(12)), null);
  assert.equal(validatePassword("a".repeat(128)), null);
  assert.equal(validatePassword("a".repeat(129)), "passwordMax");
});

test("validateDisplayName trims and enforces required and 2-80 characters", () => {
  assert.equal(validateDisplayName("  "), "displayNameRequired");
  assert.equal(validateDisplayName("x"), "displayNameMin");
  assert.equal(validateDisplayName("  xy  "), null);
  assert.equal(validateDisplayName("a".repeat(80)), null);
  assert.equal(validateDisplayName("a".repeat(81)), "displayNameMax");
});

test("validateReturnTo allows only empty or safe same-site paths", () => {
  assert.equal(validateReturnTo(""), true);
  assert.equal(validateReturnTo("/account"), true);
  assert.equal(validateReturnTo("/account/sessions"), true);
  assert.equal(validateReturnTo("https://evil.example.com/steal"), false);
  assert.equal(validateReturnTo("//evil.example.com"), false);
  assert.equal(validateReturnTo("javascript:alert(1)"), false);
  assert.equal(validateReturnTo("account"), false);
});
