import assert from "node:assert/strict";
import test from "node:test";
import { isValidRichTextLink } from "./RichTextLinkDialog";

test("isValidRichTextLink accepts http, https, mailto, tel, and internal paths", () => {
  for (const value of [
    "https://wat.example",
    "http://wat.example",
    "mailto:info@wat.example",
    "tel:+49123456789",
    "/events",
  ]) {
    assert.equal(isValidRichTextLink(value), true);
  }
});

test("isValidRichTextLink rejects unsafe and malformed values", () => {
  for (const value of ["", "javascript:alert(1)", "ftp://example.com", "not a url"]) {
    assert.equal(isValidRichTextLink(value), false);
  }
});
