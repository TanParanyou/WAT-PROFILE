import assert from "node:assert/strict";
import test from "node:test";
import { canShowCalendarEditor } from "./CalendarEntryDrawer";
import type { CalendarEntry } from "@/features/calendar/types";

const entry = (canEdit: boolean): CalendarEntry => ({
  id: "42",
  source: "event",
  title: "Merit gathering",
  start: "2026-08-10",
  end: "2026-08-11",
  allDay: true,
  status: "active",
  display: { tone: "default" },
  detail: { canEdit, editorHref: "/admin/events/42" },
});

test("drawer hides editor action when canEdit is false", () => {
  assert.equal(canShowCalendarEditor(entry(false)), false);
});

test("drawer exposes editor action only for permitted entries", () => {
  assert.equal(canShowCalendarEditor(entry(true)), true);
});
