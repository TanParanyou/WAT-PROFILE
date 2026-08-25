import { test } from "node:test";
import assert from "node:assert/strict";
import en from "./en.json" with { type: "json" };
import th from "./th.json" with { type: "json" };
import de from "./de.json" with { type: "json" };
import adminEn from "./admin/en.json" with { type: "json" };
import adminTh from "./admin/th.json" with { type: "json" };
import adminDe from "./admin/de.json" with { type: "json" };

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

function findMissingKeys(source: string[], target: string[]): string[] {
  const targetSet = new Set(target);
  return source.filter((k) => !targetSet.has(k));
}

test("public messages have 100% key parity across th, en, de", () => {
  const thKeys = flattenKeys(th).sort();
  const enKeys = flattenKeys(en).sort();
  const deKeys = flattenKeys(de).sort();

  const missingInEn = findMissingKeys(thKeys, enKeys);
  const missingInTh = findMissingKeys(enKeys, thKeys);
  const missingInDe = findMissingKeys(thKeys, deKeys);

  assert.deepEqual(
    missingInEn,
    [],
    `Keys in th.json but missing in en.json: ${missingInEn.join(", ")}`,
  );
  assert.deepEqual(
    missingInTh,
    [],
    `Keys in en.json but missing in th.json: ${missingInTh.join(", ")}`,
  );
  assert.deepEqual(
    missingInDe,
    [],
    `Keys in th.json but missing in de.json: ${missingInDe.join(", ")}`,
  );
});

test("admin messages have 100% key parity across th, en, de", () => {
  const thKeys = flattenKeys(adminTh).sort();
  const enKeys = flattenKeys(adminEn).sort();
  const deKeys = flattenKeys(adminDe).sort();

  const missingInEn = findMissingKeys(thKeys, enKeys);
  const missingInTh = findMissingKeys(enKeys, thKeys);
  const missingInDe = findMissingKeys(thKeys, deKeys);

  assert.deepEqual(
    missingInEn,
    [],
    `Keys in admin/th.json but missing in admin/en.json: ${missingInEn.join(", ")}`,
  );
  assert.deepEqual(
    missingInTh,
    [],
    `Keys in admin/en.json but missing in admin/th.json: ${missingInTh.join(", ")}`,
  );
  assert.deepEqual(
    missingInDe,
    [],
    `Keys in admin/th.json but missing in admin/de.json: ${missingInDe.join(", ")}`,
  );
});
