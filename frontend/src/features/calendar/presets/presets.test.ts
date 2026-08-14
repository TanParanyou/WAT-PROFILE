import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { discoveryPreset } from "./discovery";
import { planningPreset } from "./planning";

const publicCalendarPath = fileURLToPath(
  new URL("../../../app/[locale]/(client)/calendar/CalendarPageContent.tsx", import.meta.url),
);
const adminCalendarPath = fileURLToPath(
  new URL("../../../app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx", import.meta.url),
);

test("Discovery uses TimeGrid for Week and Day", () => {
  assert.equal(discoveryPreset.defaultView, "month");
  assert.equal(discoveryPreset.viewModes.week, "timeGrid");
  assert.equal(discoveryPreset.viewModes.day, "timeGrid");
});

test("Planning keeps TimeGrid for Week and Day", () => {
  assert.equal(planningPreset.viewModes.week, "timeGrid");
  assert.equal(planningPreset.viewModes.day, "timeGrid");
});

test("Public calendar composes TimeGrid but not AgendaView", () => {
  const source = readFileSync(publicCalendarPath, "utf8");

  assert.match(source, /<TimeGrid/);
  assert.doesNotMatch(source, /<AgendaView/);
});

test("Public calendar uses the wide page surface for seven-day TimeGrid", () => {
  const source = readFileSync(publicCalendarPath, "utf8");

  assert.match(source, /<PageContainer width="wide">/);
});

test("Admin calendar composes TimeGrid but not AgendaView", () => {
  const source = readFileSync(adminCalendarPath, "utf8");

  assert.match(source, /<TimeGrid/);
  assert.doesNotMatch(source, /<AgendaView/);
});
