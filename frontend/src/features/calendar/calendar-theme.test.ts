import assert from "node:assert/strict";
import test from "node:test";
import { calendarEntryToneClass, calendarFocusClass } from "./calendar-theme";

test("public entry tones use only public theme tokens", () => {
  assert.match(calendarEntryToneClass("public", "default"), /site-/);
  assert.doesNotMatch(calendarEntryToneClass("public", "warning"), /admin-/);
  assert.doesNotMatch(calendarEntryToneClass("public", "muted"), /admin-/);
});

test("admin entry tones and focus use admin theme tokens", () => {
  assert.match(calendarEntryToneClass("admin", "warning"), /admin-/);
  assert.match(calendarFocusClass("admin"), /admin-/);
});

test("public focus uses the public focus token", () => {
  assert.match(calendarFocusClass("public"), /site-/);
  assert.doesNotMatch(calendarFocusClass("public"), /admin-/);
});
