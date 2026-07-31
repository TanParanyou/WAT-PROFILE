import assert from "node:assert/strict";
import test from "node:test";
import { PROTOTYPE_CONTENT, THEME_VARIANTS } from "./prototype-data.ts";

test("exposes seven unique theme directions in picker order", () => {
  assert.deepEqual(
    THEME_VARIANTS.map(({ key }) => key),
    ["forest", "community", "practice", "minimal", "monochrome", "apothecary", "journal"],
  );
  assert.equal(new Set(THEME_VARIANTS.map(({ key }) => key)).size, 7);
});

test("keeps the approved primary and secondary calls to action", () => {
  assert.equal(
    PROTOTYPE_CONTENT.primaryCta,
    "ดูกิจกรรมและเข้าร่วมปฏิบัติธรรม",
  );
  assert.equal(
    PROTOTYPE_CONTENT.secondaryCta,
    "วางแผนการเดินทางมาวัด",
  );
});

test("uses only approved real gallery images", () => {
  const imagePaths = [
    PROTOTYPE_CONTENT.heroImage,
    PROTOTYPE_CONTENT.storyImage,
    PROTOTYPE_CONTENT.visitImage,
    ...PROTOTYPE_CONTENT.events.map(({ image }) => image),
  ];

  for (const imagePath of imagePaths) {
    assert.match(
      imagePath,
      /^\/images\/gallery\/(common|before_buying_2018)\//,
    );
    assert.doesNotMatch(imagePath, /hero-bg|\/gallery\/[1-6]\.png/);
  }
});

test("provides exactly three realistic upcoming events", () => {
  assert.equal(PROTOTYPE_CONTENT.events.length, 3);
  for (const event of PROTOTYPE_CONTENT.events) {
    assert.ok(event.title.length > 5);
    assert.ok(event.dateLabel.length > 5);
    assert.ok(event.summary.length > 20);
  }
});
