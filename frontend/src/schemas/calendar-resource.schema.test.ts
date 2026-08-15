import assert from "node:assert/strict";
import test from "node:test";
import { calendarResourceSchema } from "./calendar-resource.schema";

test("calendar resource schema rejects an incomplete localized title", () => {
  const result = calendarResourceSchema.safeParse({
    slug: "hall",
    resource_type: "location",
    title: { th: "", en: "Hall", de: "Halle" },
    metadata: {},
    is_active: true,
    is_public: true,
    display_order: 0,
  });
  assert.equal(result.success, false);
});

test("calendar resource schema accepts all production fields", () => {
  const result = calendarResourceSchema.safeParse({
    slug: "main-hall",
    resource_type: "location",
    title: { th: "ศาลาหลัก", en: "Main hall", de: "Haupthalle" },
    color: "#123456",
    capacity: 50,
    metadata: {},
    is_active: true,
    is_public: true,
    display_order: 0,
  });
  assert.equal(result.success, true);
});
