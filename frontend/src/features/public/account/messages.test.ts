import { test } from "node:test";
import assert from "node:assert/strict";
import en from "../../../messages/en.json";
import th from "../../../messages/th.json";
import de from "../../../messages/de.json";
import {
  inspectPassword,
  normalizeAccountEmail,
  validateDisplayName,
  validatePassword,
  validateReturnTo,
} from "./validation";
import {
  buildAccountHref,
  isAccountPath,
  parseAccountTab,
} from "./accountNavigation";

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

function flattenValues(obj: Record<string, unknown>): string[] {
  return Object.values(obj).flatMap((value) =>
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? flattenValues(value as Record<string, unknown>)
      : [String(value)],
  );
}

test("account message trees match in th en de", () => {
  assert.ok(en.Account, "en.json must define an Account namespace");
  assert.ok(th.Account, "th.json must define an Account namespace");
  assert.ok(de.Account, "de.json must define an Account namespace");
  assert.deepEqual(flattenKeys(th.Account), flattenKeys(en.Account));
  assert.deepEqual(flattenKeys(th.Account), flattenKeys(de.Account));
});

test("account messages are non-empty in th en de", () => {
  for (const messages of [th.Account, en.Account, de.Account]) {
    assert.equal(
      flattenValues(messages).every((value) => value.trim().length > 0),
      true,
    );
  }
});

test("preferred locale navigation preserves the active account tab", () => {
  assert.equal(buildAccountHref(parseAccountTab("security")), "/account?tab=security");
  assert.equal(
    buildAccountHref(parseAccountTab("registrations")),
    "/account?tab=registrations",
  );
  assert.equal(
    buildAccountHref(parseAccountTab("preferences")),
    "/account?tab=preferences",
  );
});

test("isAccountPath matches only the account route family", () => {
  assert.equal(isAccountPath("/account"), true);
  assert.equal(isAccountPath("/account/login"), true);
  assert.equal(isAccountPath("/account/sessions"), true);
  assert.equal(isAccountPath("/accountant"), false);
  assert.equal(isAccountPath("/events"), false);
});

test("normalizeAccountEmail trims and lowercases", () => {
  assert.equal(normalizeAccountEmail("  Visitor@Example.com "), "visitor@example.com");
  assert.equal(normalizeAccountEmail("WANIDA@EXAMPLE.CO"), "wanida@example.co");
  assert.equal(normalizeAccountEmail(""), "");
});

test("validatePassword enforces length and three of four character groups", () => {
  assert.equal(validatePassword(""), "passwordRequired");
  assert.equal(validatePassword("short"), "passwordMin");
  assert.equal(validatePassword("a".repeat(11)), "passwordMin");
  assert.equal(validatePassword("abcdefghij1!"), null);
  assert.equal(validatePassword("abcdefghijkl!"), "passwordComplexity");
  assert.equal(validatePassword("a".repeat(128) + "1!"), "passwordMax");
  assert.equal(validatePassword("a".repeat(129)), "passwordMax");
  assert.equal(validatePassword("Abcdefghij 1!"), null);
  assert.equal(validatePassword("Abcdefghijk "), "passwordComplexity");
});

test("inspectPassword counts Unicode characters and exposes requirement state", () => {
  const requirements = inspectPassword("ก".repeat(9) + "A1!");

  assert.equal(requirements.length, 12);
  assert.equal(requirements.hasLowercase, false);
  assert.equal(requirements.hasUppercase, true);
  assert.equal(requirements.hasNumber, true);
  assert.equal(requirements.hasSpecial, true);
  assert.equal(requirements.characterGroups, 3);
  assert.equal(requirements.valid, true);
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
