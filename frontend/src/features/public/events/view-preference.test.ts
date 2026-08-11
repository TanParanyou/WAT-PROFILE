import assert from "node:assert/strict";
import test from "node:test";
import { resolveEventsView } from "./view-preference";

test("saved list view overrides the site calendar default", () => {
  assert.equal(resolveEventsView("list", "calendar"), "list");
});

test("unknown persisted values use the valid global default", () => {
  assert.equal(resolveEventsView("week", "list"), "list");
});

test("invalid saved and global values fall back to calendar", () => {
  assert.equal(resolveEventsView(null, "invalid"), "calendar");
});
