import assert from "node:assert/strict";
import test from "node:test";
import { discoveryPreset } from "./discovery";
import { planningPreset } from "./planning";

test("Discovery uses readable agenda renderers for Week and Day", () => {
  assert.equal(discoveryPreset.defaultView, "month");
  assert.equal(discoveryPreset.viewModes.week, "agenda");
  assert.equal(discoveryPreset.viewModes.day, "agenda");
});

test("Planning keeps TimeGrid for Week and Day", () => {
  assert.equal(planningPreset.viewModes.week, "timeGrid");
  assert.equal(planningPreset.viewModes.day, "timeGrid");
});
