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

test("Discovery uses Agenda for Week and Day", () => {
  assert.equal(discoveryPreset.defaultView, "month");
  assert.equal(discoveryPreset.viewModes.week, "agenda");
  assert.equal(discoveryPreset.viewModes.day, "agenda");
});

test("Planning keeps TimeGrid for Week and Day", () => {
  assert.equal(planningPreset.viewModes.week, "timeGrid");
  assert.equal(planningPreset.viewModes.day, "timeGrid");
});

test("Public calendar composes AgendaView but not TimeGrid", () => {
  const source = readFileSync(publicCalendarPath, "utf8");

  assert.match(source, /<AgendaView/);
  assert.doesNotMatch(source, /<TimeGrid/);
});

test("Admin calendar composes TimeGrid but not AgendaView", () => {
  const source = readFileSync(adminCalendarPath, "utf8");

  assert.match(source, /<TimeGrid/);
  assert.doesNotMatch(source, /<AgendaView/);
});
