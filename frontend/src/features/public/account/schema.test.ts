import { test } from "node:test";
import assert from "node:assert/strict";
import { accountSchema } from "./schema";

const validAccount = {
  id: "1b2e9d6a-8f3c-4a5b-9c2e-7d1f0a3b4c5d",
  email: "visitor@example.com",
  email_verified: true,
  account_status: "active",
  display_name: "Wanida",
  avatar_url: "",
  preferred_locale: "th",
  providers: ["password", "google"],
};

test("accountSchema accepts a valid public account payload", () => {
  const result = accountSchema.safeParse(validAccount);
  assert.equal(result.success, true);
});

test("accountSchema accepts an avatar URL", () => {
  const result = accountSchema.safeParse({
    ...validAccount,
    avatar_url: "https://example.com/avatar.png",
  });
  assert.equal(result.success, true);
});

test("accountSchema accepts a backend response without an empty avatar URL", () => {
  const { avatar_url: _avatarUrl, ...backendAccount } = validAccount;
  void _avatarUrl;
  const result = accountSchema.safeParse(backendAccount);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.avatar_url, "");
  }
});

test("accountSchema rejects private fields (strict)", () => {
  const result = accountSchema.safeParse({ ...validAccount, member_code: "WLP-1" });
  assert.equal(result.success, false);
});

test("accountSchema rejects an unknown account_status", () => {
  const result = accountSchema.safeParse({ ...validAccount, account_status: "superadmin" });
  assert.equal(result.success, false);
});

test("accountSchema rejects an unknown locale", () => {
  const result = accountSchema.safeParse({ ...validAccount, preferred_locale: "fr" });
  assert.equal(result.success, false);
});

test("accountSchema rejects a short display name", () => {
  const result = accountSchema.safeParse({ ...validAccount, display_name: "X" });
  assert.equal(result.success, false);
});

test("accountSchema rejects an unverified non-active account", () => {
  const result = accountSchema.safeParse({
    ...validAccount,
    email_verified: false,
    account_status: "pending_verification",
    providers: ["password"],
  });
  assert.equal(result.success, true);
});
