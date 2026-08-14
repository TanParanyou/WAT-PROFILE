import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const featureRoot = dirname(fileURLToPath(import.meta.url));
const genericRoots = ["core", "ui", "views"];
const genericFiles = ["Calendar.tsx", "config.ts", "useCalendar.ts"];

async function collectSourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await collectSourceFiles(path));
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx")) files.push(path);
  }
  return files;
}

test("generic calendar sources do not depend on Next or WAT integrations", async () => {
  const files = [
    ...genericFiles.map((file) => join(featureRoot, file)),
    ...(await Promise.all(genericRoots.map((root) => collectSourceFiles(join(featureRoot, root))))).flat(),
  ];
  const forbiddenImport = /from\s+["'][^"']*(?:next(?:\/|-)|integrations\/wat|adapters\/wat|services\/|messages\/|app\/)[^"']*["']/;
  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.equal(forbiddenImport.test(source), false, `${file} crosses the generic calendar dependency boundary`);
  }
});
