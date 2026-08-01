import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["src/app/[locale]/admin", "src/components/admin", "src/components/ui"];
const deferred = new Set([]);
const forbiddenPalette = /(?:bg|text|border|divide|outline|ring)-(?:white(?:\/[0-9]{1,3})?|black(?![\/])|(?:gray|zinc|slate|amber)-(?:[0-9]{2,3})(?:\/[0-9]{1,3})?)|#[0-9a-fA-F]{3,8}/g;
const forbiddenPublicTheme = /(?:bg|text|border|divide|outline|ring)-site-[a-z-]+(?:\/[0-9]{1,3})?/g;
const publicPreviewOwners = new Set([
  "src/components/admin/website/DevicePreviewFrame.tsx",
  "src/components/admin/website/WebsitePreviewPanel.tsx",
  "src/components/admin/rich-text/RichTextContent.tsx",
  "src/components/admin/preview/TestLinkButton.tsx",
  "src/components/admin/preview/UrlImageInputWithPreview.tsx",
  "src/components/admin/preview/MapEmbedPreview.tsx",
  "src/components/admin/preview/GoogleSearchPreview.tsx",
  "src/components/admin/preview/BankCardPreview.tsx",
  "src/components/admin/preview/SocialsPreview.tsx",
  "src/components/admin/preview/ContactDetailsPreview.tsx",
  "src/components/admin/preview/OpeningHoursPreview.tsx",
  "src/components/admin/preview/TravelGuidePreview.tsx",
  "src/components/admin/preview/ContactFormPreview.tsx",
  "src/components/admin/preview/EventCardPreview.tsx",
  "src/components/admin/preview/MonkCardPreview.tsx",
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
      if (publicPreviewOwners.has(child)) return;
      const matches = line.match(forbiddenPalette) ?? [];
      const publicMatches = line.match(forbiddenPublicTheme) ?? [];
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
