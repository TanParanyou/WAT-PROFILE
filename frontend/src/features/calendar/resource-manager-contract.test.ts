import assert from "node:assert/strict";
import test from "node:test";
import { isResourceDeletionDisabled } from "./resource-manager-contract";

test("resource manager disables delete for an assigned resource", () => {
  assert.equal(isResourceDeletionDisabled({ assignment_count: 2 }), true);
  assert.equal(isResourceDeletionDisabled({ assignment_count: 0 }), false);
});
