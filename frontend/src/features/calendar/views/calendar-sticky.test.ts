import assert from "node:assert/strict";
import test from "node:test";

test("supports stickyHeader and stickyTimeAxis configurations", () => {
  const options = {
    stickyHeader: true,
    stickyTimeAxis: true,
  };

  assert.equal(options.stickyHeader, true);
  assert.equal(options.stickyTimeAxis, true);
});
