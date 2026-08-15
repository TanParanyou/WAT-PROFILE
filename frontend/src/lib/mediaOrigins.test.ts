import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyMediaSource, parseManagedMediaOrigins } from "./mediaOrigins";

test("normalizes and deduplicates explicit HTTPS origins", () => {
  assert.deepEqual(
    parseManagedMediaOrigins(" https://media.example.org,https://media.example.org ", {
      allowHttp: false,
      requireAtLeastOne: true,
    }),
    ["https://media.example.org"],
  );
});

test("rejects wildcards and production HTTP origins", () => {
  assert.throws(() => parseManagedMediaOrigins("*", { allowHttp: false, requireAtLeastOne: true }));
  assert.throws(() => parseManagedMediaOrigins("http://media.example.org", { allowHttp: false, requireAtLeastOne: true }));
});

test("classifies local, managed, external, and invalid sources", () => {
  const origins = ["https://media.example.org"];

  assert.equal(classifyMediaSource("data:image/png;base64,AA==", origins), "local");
  assert.equal(classifyMediaSource("blob:https://admin.example.org/id", origins), "local");
  assert.equal(classifyMediaSource("https://media.example.org/a.jpg", origins), "managed");
  assert.equal(classifyMediaSource("https://images.example.net/a.jpg", origins), "external");
  assert.equal(classifyMediaSource("javascript:alert(1)", origins), "invalid");
  assert.equal(classifyMediaSource("/uploads/a.jpg", origins), "invalid");
});
