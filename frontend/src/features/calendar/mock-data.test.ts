import assert from "node:assert/strict";
import test from "node:test";
import { fetchCalendarFeed } from "./api";

test("development mock feed covers every calendar presentation case", async () => {
  const feed = await fetchCalendarFeed({
    scope: "admin",
    locale: "th",
    range: { startDate: "2026-08-01", endDate: "2026-08-31" },
  });

  assert.ok(feed.entries.some((entry) => entry.allDay));
  assert.ok(feed.entries.some((entry) => !entry.allDay));
  assert.ok(feed.entries.some((entry) => entry.status === "inactive"));
  assert.ok(feed.entries.some((entry) => entry.detail.canEdit));
  assert.deepEqual(feed.resources.map((resource) => resource.id), ["default"]);
});

test("public mock feed hides inactive entries and edit targets", async () => {
  const feed = await fetchCalendarFeed({
    scope: "public",
    locale: "en",
    range: { startDate: "2026-08-01", endDate: "2026-08-31" },
  });

  assert.equal(feed.entries.some((entry) => entry.status === "inactive"), false);
  assert.equal(feed.entries.some((entry) => entry.detail.canEdit), false);
});
