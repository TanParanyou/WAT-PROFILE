import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["src/app/[locale]/admin", "src/components/admin", "src/components/ui"];
const deferred = new Set([
  "src/app/[locale]/admin/website",
  "src/components/admin/website",
]);
const forbiddenPalette = /(?:bg|text|border|divide|outline|ring)-(?:(?:white|black)(?:\/[0-9]{1,3})?|(?:gray|zinc|slate|amber)-(?:[0-9]{2,3})(?:\/[0-9]{1,3})?)|#[0-9a-fA-F]{3,8}/g;
const forbiddenPublicTheme = /(?:bg|text|border|divide|outline|ring)-site-[a-z-]+(?:\/[0-9]{1,3})?/g;
const publicPreviewOwners = new Set([
  "src/components/admin/website/DevicePreviewFrame.tsx",
  "src/components/admin/website/WebsitePreviewPanel.tsx",
]);
const findings = [];

async function visit(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (deferred.has(child)) continue;
    if (entry.isDirectory()) await visit(child);
    if (!entry.isFile() || ![".ts", ".tsx"].includes(extname(entry.name))) continue;
    const source = await readFile(child, "utf8");
    source.split("\n").forEach((line, index) => {
      const matches = line.match(forbiddenPalette) ?? [];
      const publicMatches = publicPreviewOwners.has(child)
        ? []
        : (line.match(forbiddenPublicTheme) ?? []);
      const violations = [...matches, ...publicMatches];
      if (violations.length > 0) {
        findings.push(`${child}:${index + 1}: ${violations.join(", ")}`);
      }
    });
  }
}

for (const root of roots) await visit(root);
if (findings.length > 0) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Admin theme token check passed");
}
