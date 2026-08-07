import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildPublicMetadata, normalizeSeo } from "../seo/metadata";

test("account layout declares noindex and nofollow", () => {
  const path = fileURLToPath(
    new URL("../../../app/[locale]/(client)/account/layout.tsx", import.meta.url),
  );
  const source = readFileSync(path, "utf8");
  assert.match(
    source,
    /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/s,
  );
});

test("public metadata does not erase a parent robots policy when noindex is unset", () => {
  const metadata = buildPublicMetadata({
    locale: "en",
    pathname: "/en/account/login",
    seo: normalizeSeo({}),
    content: { title: "Sign in", description: "Sign in" },
    messages: { title: "Sign in", description: "Sign in" },
    site: { name: "Wat", description: "Wat", image: "/image.jpg" },
  });

  assert.equal(Object.hasOwn(metadata, "robots"), false);
});

test("public metadata keeps explicit noindex policies", () => {
  const metadata = buildPublicMetadata({
    locale: "en",
    pathname: "/en/private-preview",
    seo: normalizeSeo({ noindex: true }),
    content: { title: "Preview", description: "Preview" },
    messages: { title: "Preview", description: "Preview" },
    site: { name: "Wat", description: "Wat", image: "/image.jpg" },
  });

  assert.deepEqual(metadata.robots, { index: false, follow: false });
});
