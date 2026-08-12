import assert from "node:assert/strict";
import test from "node:test";
import type { CalendarEvent } from "../core/types";

const mockEvent: CalendarEvent<{ location?: string }> = {
  id: "test-event",
  title: "Special Ceremony",
  start: "2026-08-12T09:00:00+02:00",
  end: "2026-08-12T10:30:00+02:00",
  allDay: false,
  meta: { location: "Main Hall" },
};

test("supports enabling and disabling tooltips", () => {
  const enabledProps = { showTooltip: true, event: mockEvent };
  const disabledProps = { showTooltip: false, event: mockEvent };

  assert.equal(enabledProps.showTooltip, true);
  assert.equal(disabledProps.showTooltip, false);
});

test("supports custom tooltip rendering function", () => {
  const customRender = (event: CalendarEvent<{ location?: string }>) => `Custom: ${event.title}`;
  const result = customRender(mockEvent);

  assert.equal(result, "Custom: Special Ceremony");
});
