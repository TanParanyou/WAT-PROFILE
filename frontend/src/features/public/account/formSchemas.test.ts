import { test } from "node:test";
import assert from "node:assert/strict";
import { createAccountFormSchemas } from "./formSchemas";

const schemas = createAccountFormSchemas({
  emailRequired: "EMAIL_REQUIRED",
  emailInvalid: "EMAIL_INVALID",
  displayNameRequired: "NAME_REQUIRED",
  displayNameMin: "NAME_MIN",
  displayNameMax: "NAME_MAX",
  passwordRequired: "PASSWORD_REQUIRED",
  passwordMin: "PASSWORD_MIN",
  passwordMax: "PASSWORD_MAX",
  passwordComplexity: "PASSWORD_COMPLEXITY",
});

test("login schema normalizes email without changing password", () => {
  const result = schemas.login.parse({
    email: " Visitor@Example.com ",
    password: "  Keep spaces 1!A",
  });
  assert.deepEqual(result, {
    email: "visitor@example.com",
    password: "  Keep spaces 1!A",
  });
});

test("register schema counts display names as Unicode code points", () => {
  assert.equal(
    schemas.register.safeParse({
      displayName: "ก".repeat(80),
      email: "visitor@example.com",
      password: "abcdefghij1!",
      locale: "th",
    }).success,
    true,
  );
  const rejected = schemas.register.safeParse({
    displayName: "🙂".repeat(81),
    email: "visitor@example.com",
    password: "abcdefghij1!",
    locale: "th",
  });
  assert.equal(rejected.success, false);
  assert.equal(rejected.error?.issues[0]?.message, "NAME_MAX");
});

test("password schemas preserve the existing account password policy", () => {
  assert.equal(schemas.resetPassword.safeParse({ password: "short" }).success, false);
  assert.equal(
    schemas.resetPassword.safeParse({ password: "abcdefghij1!" }).success,
    true,
  );
});
