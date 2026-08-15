import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { discoveryPreset } from "./discovery";
import { planningPreset } from "./planning";

const publicCalendarPath = fileURLToPath(
  new URL("../../../app/[locale]/(client)/calendar/CalendarPageContent.tsx", import.meta.url),
);
const publicCalendarSectionPath = fileURLToPath(
  new URL("../integrations/wat/PublicCalendarSection.tsx", import.meta.url),
);
const eventsPagePath = fileURLToPath(
  new URL("../../../app/[locale]/(client)/events/EventsContent.tsx", import.meta.url),
);
const adminCalendarPath = fileURLToPath(
  new URL("../../../app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx", import.meta.url),
);

test("Discovery uses TimeGrid for Week and Day", () => {
  assert.equal(discoveryPreset.defaultView, "month");
  assert.equal(discoveryPreset.viewModes.week, "timeGrid");
  assert.equal(discoveryPreset.viewModes.day, "timeGrid");
  assert.deepEqual(discoveryPreset.layouts?.mobile, {
    month: "monthAgenda",
    week: "dayStrip",
    day: "timeGrid",
  });
});

test("Planning keeps TimeGrid for Week and Day", () => {
  assert.equal(planningPreset.viewModes.week, "timeGrid");
  assert.equal(planningPreset.viewModes.day, "timeGrid");
});

test("Public calendar route composes the shared public calendar section", () => {
  const source = readFileSync(publicCalendarPath, "utf8");

  assert.match(source, /<PublicCalendarSection/);
  assert.doesNotMatch(source, /<Calendar(?:\s|>)/);
});

test("Public calendar section composes the reusable Calendar facade", () => {
  const source = readFileSync(publicCalendarSectionPath, "utf8");

  assert.match(source, /<Calendar/);
  assert.doesNotMatch(source, /features\/calendar\/views\/(MonthView|TimeGrid)/);
  assert.doesNotMatch(source, /<AgendaView/);
});

test("Public calendar uses the wide page surface for seven-day TimeGrid", () => {
  const source = readFileSync(publicCalendarPath, "utf8");

  assert.match(source, /<PageContainer width="wide">/);
});

test("Events page places the shared public calendar section between schedules and events", () => {
  const source = readFileSync(eventsPagePath, "utf8");
  const scheduleIndex = source.indexOf('aria-labelledby="schedule-heading"');
  const calendarIndex = source.indexOf('aria-labelledby="calendar-heading"');
  const eventsIndex = source.indexOf('aria-labelledby="events-heading"');

  assert.ok(scheduleIndex >= 0);
  assert.ok(calendarIndex > scheduleIndex);
  assert.ok(eventsIndex > calendarIndex);
  assert.match(source, /<PageContainer width="content">/);
  assert.match(source, /<PublicCalendarSection/);
  assert.doesNotMatch(source, /href="\/calendar"/);
  assert.match(source, /title=\{tPage\("calendarTitle"\)\}/);
  assert.match(source, /description=\{tPage\("calendarDescription"\)\}/);
});

test("Admin calendar composes the reusable Calendar facade", () => {
  const source = readFileSync(adminCalendarPath, "utf8");

  assert.match(source, /<Calendar/);
  assert.doesNotMatch(source, /features\/calendar\/views\/(MonthView|TimeGrid)/);
  assert.doesNotMatch(source, /<AgendaView/);
});
