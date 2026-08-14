# Managed Media Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove arbitrary server-side image fetching while keeping managed R2/CDN selection, crop, upload, legacy external-image rendering, and clear Admin replacement UX.

**Architecture:** A pure frontend origin-policy module classifies local, managed, external, and invalid image sources. Crop code fetches only managed HTTPS assets directly in the browser; the Next.js proxy is deleted. `MediaPickerDialog` keeps complete `Media` records so it can expose crop only for managed assets and a replacement upload for external assets.

**Tech Stack:** Next.js 16 App Router, React 19, strict TypeScript, next-intl, Tailwind CSS 4, react-easy-crop, Node test runner through `tsx`.

## Global Constraints

- Production managed-media origins come from comma-separated `NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS`.
- Production origins are explicit HTTPS origins; wildcards, paths, query strings, fragments, credentials, and HTTP are rejected.
- Local development may explicitly allow HTTP origins.
- `blob:` and `data:` are crop-eligible only for local upload flows.
- External stored URLs continue rendering and remain selectable, but cannot invoke crop or automatic import.
- No Next.js or Go route fetches an administrator-supplied media URL.
- Preserve Thai, English, and German Admin copy.
- Do not introduce TypeScript `any`, `as any`, or `@ts-ignore`.
- Keep Admin controls square, keyboard-operable, visibly focused, and at least 44px where they are primary touch actions.

---

## File Map

- Create `frontend/src/lib/mediaOrigins.ts`: parse the allowlist and classify image sources.
- Create `frontend/src/lib/mediaOrigins.test.ts`: pure allowlist and classification contract tests.
- Modify `frontend/next.config.ts`: fail production builds with missing or unsafe media origins.
- Modify `frontend/src/components/admin/media/cropUtils.ts`: direct browser fetch for managed assets only.
- Modify `frontend/src/components/admin/media/ImageCropDialog.tsx`: localized actionable crop-load failure.
- Delete `frontend/src/app/api/media-proxy/route.ts`: remove the server-side external fetch surface.
- Modify `frontend/src/components/admin/media/MediaPickerDialog.tsx`: retain `Media` objects and distinguish managed/external actions.
- Modify `frontend/src/components/admin/media/MediaImagePicker.tsx`: show unmanaged status for existing external values.
- Modify `frontend/src/components/admin/website/MediaUrlField.tsx`: make Media Library primary and manual URL an Advanced action.
- Modify `frontend/src/components/admin/website/sections/MapSectionEditor.tsx`: use a normal input for the non-media map embed URL.
- Modify `frontend/src/messages/admin/{th,en,de}.json`: complete picker, source-status, replacement, and crop-error copy.
- Modify `frontend/.env.example`: document the public managed-origin setting.
- Modify `docs/DEPLOYMENT.md`: document R2/CDN CORS and release checks.

### Task 1: Managed-media origin policy

**Files:**
- Create: `frontend/src/lib/mediaOrigins.ts`
- Create: `frontend/src/lib/mediaOrigins.test.ts`
- Modify: `frontend/next.config.ts`

**Interfaces:**
- Produces: `MediaSourceKind = "local" | "managed" | "external" | "invalid"`.
- Produces: `parseManagedMediaOrigins(raw, options): readonly string[]`.
- Produces: `getConfiguredManagedMediaOrigins(): readonly string[]`.
- Produces: `classifyMediaSource(source, managedOrigins?): MediaSourceKind`.
- Consumed by: crop utilities, Media Picker, Media URL fields, production build validation.

- [ ] **Step 1: Write failing origin-policy tests**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyMediaSource, parseManagedMediaOrigins } from "./mediaOrigins";

test("normalizes and deduplicates explicit HTTPS origins", () => {
  assert.deepEqual(
    parseManagedMediaOrigins(" https://media.example.org,https://media.example.org ", {
      allowHttp: false,
      requireAtLeastOne: true,
    }),
    ["https://media.example.org"],
  );
});

test("rejects wildcards and production HTTP origins", () => {
  assert.throws(() => parseManagedMediaOrigins("*", { allowHttp: false, requireAtLeastOne: true }));
  assert.throws(() => parseManagedMediaOrigins("http://media.example.org", { allowHttp: false, requireAtLeastOne: true }));
});

test("classifies local, managed, external, and invalid sources", () => {
  const origins = ["https://media.example.org"];
  assert.equal(classifyMediaSource("data:image/png;base64,AA==", origins), "local");
  assert.equal(classifyMediaSource("blob:https://admin.example.org/id", origins), "local");
  assert.equal(classifyMediaSource("https://media.example.org/a.jpg", origins), "managed");
  assert.equal(classifyMediaSource("https://images.example.net/a.jpg", origins), "external");
  assert.equal(classifyMediaSource("javascript:alert(1)", origins), "invalid");
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/lib/mediaOrigins.test.ts`

Expected: FAIL because `mediaOrigins.ts` does not exist.

- [ ] **Step 3: Implement the pure policy module**

```ts
export type MediaSourceKind = "local" | "managed" | "external" | "invalid";

export interface ManagedMediaOriginOptions {
  allowHttp: boolean;
  requireAtLeastOne: boolean;
}

export function parseManagedMediaOrigins(
  raw: string | undefined,
  options: ManagedMediaOriginOptions,
): readonly string[] {
  const origins = new Set<string>();
  for (const entry of (raw ?? "").split(",").map((value) => value.trim()).filter(Boolean)) {
    if (entry.includes("*")) throw new Error("Managed media origins cannot contain wildcards");
    const url = new URL(entry);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      throw new Error(`Managed media entry must be an origin: ${entry}`);
    }
    if (url.protocol !== "https:" && !(options.allowHttp && url.protocol === "http:")) {
      throw new Error(`Managed media origin has an unsafe protocol: ${entry}`);
    }
    origins.add(url.origin);
  }
  if (options.requireAtLeastOne && origins.size === 0) {
    throw new Error("NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS must contain at least one origin");
  }
  return [...origins];
}

export function getConfiguredManagedMediaOrigins(): readonly string[] {
  const production = process.env.NODE_ENV === "production";
  return parseManagedMediaOrigins(process.env.NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS, {
    allowHttp: !production,
    requireAtLeastOne: production,
  });
}

export function classifyMediaSource(
  source: string,
  managedOrigins = getConfiguredManagedMediaOrigins(),
): MediaSourceKind {
  if (source.startsWith("data:") || source.startsWith("blob:")) return "local";
  let url: URL;
  try { url = new URL(source); } catch { return "invalid"; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "invalid";
  return managedOrigins.includes(url.origin) ? "managed" : "external";
}
```

In `next.config.ts`, call `parseManagedMediaOrigins` during production configuration with `allowHttp: false` and `requireAtLeastOne: true`. Keep the current API URL validation intact.

- [ ] **Step 4: Run tests, lint, and type-check**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/lib/mediaOrigins.test.ts`

Expected: PASS for normalization, rejection, and classification.

Run: `cd frontend && ./node_modules/.bin/eslint src/lib/mediaOrigins.ts src/lib/mediaOrigins.test.ts next.config.ts && ./node_modules/.bin/tsc --noEmit`

Expected: exit 0.

- [ ] **Step 5: Commit the policy boundary**

```bash
git add frontend/src/lib/mediaOrigins.ts frontend/src/lib/mediaOrigins.test.ts frontend/next.config.ts
git commit -m "feat(media): enforce managed image origins"
```

### Task 2: Browser-only managed cropping

**Files:**
- Modify: `frontend/src/components/admin/media/cropUtils.ts`
- Modify: `frontend/src/components/admin/media/ImageCropDialog.tsx`
- Delete: `frontend/src/app/api/media-proxy/route.ts`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- Consumes: `classifyMediaSource()` and `getConfiguredManagedMediaOrigins()` from Task 1.
- Produces: `MediaCropLoadError` with code `unmanaged_source | load_failed | invalid_image`.
- Preserves: `getCroppedImg(imageSrc, pixelCrop, rotation, fileName): Promise<File>`.

- [ ] **Step 1: Extend the policy test with the crop eligibility contract**

```ts
test("relative and non-HTTP values are never managed remote media", () => {
  const origins = ["https://media.example.org"];
  assert.equal(classifyMediaSource("/uploads/a.jpg", origins), "invalid");
  assert.equal(classifyMediaSource("ftp://media.example.org/a.jpg", origins), "invalid");
});
```

- [ ] **Step 2: Run the test and confirm the new assertion fails before policy correction**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/lib/mediaOrigins.test.ts`

Expected: FAIL if relative or non-HTTP sources are classified as crop-eligible.

- [ ] **Step 3: Replace proxy fallback with a fail-closed direct fetch**

```ts
export type MediaCropLoadCode = "unmanaged_source" | "load_failed" | "invalid_image";

export class MediaCropLoadError extends Error {
  constructor(readonly code: MediaCropLoadCode) {
    super(code);
    this.name = "MediaCropLoadError";
  }
}

async function browserImageSource(url: string): Promise<{ src: string; cleanup: () => void }> {
  const kind = classifyMediaSource(url);
  if (kind === "local") return { src: url, cleanup: () => undefined };
  if (kind !== "managed") throw new MediaCropLoadError("unmanaged_source");

  let response: Response;
  try { response = await fetch(url, { mode: "cors", credentials: "omit" }); }
  catch { throw new MediaCropLoadError("load_failed"); }
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.toLowerCase().startsWith("image/")) {
    throw new MediaCropLoadError("invalid_image");
  }
  const objectUrl = URL.createObjectURL(await response.blob());
  return { src: objectUrl, cleanup: () => URL.revokeObjectURL(objectUrl) };
}
```

Use `browserImageSource()` inside `createImage()`. Remove every reference to `/api/media-proxy`. In `ImageCropDialog`, map any `MediaCropLoadError` to `t("loadActionError")`; map canvas failures to `t("defaultError")`. Delete `frontend/src/app/api/media-proxy/route.ts`.

Add exact localized meaning for `Admin.cropDialog.loadActionError`:

```json
{
  "th": "ไม่สามารถโหลดรูปนี้เพื่อแก้ไขได้ กรุณาอัปโหลดไฟล์อีกครั้ง",
  "en": "This image cannot be loaded for editing. Upload the file again.",
  "de": "Dieses Bild kann nicht bearbeitet werden. Laden Sie die Datei erneut hoch."
}
```

- [ ] **Step 4: Verify proxy removal and compilation**

Run: `rg -n "media-proxy" frontend/src`

Expected: no matches.

Run: `cd frontend && ./node_modules/.bin/eslint src/components/admin/media/cropUtils.ts src/components/admin/media/ImageCropDialog.tsx && ./node_modules/.bin/tsc --noEmit`

Expected: exit 0.

- [ ] **Step 5: Commit browser-only crop loading**

```bash
git add frontend/src/components/admin/media/cropUtils.ts frontend/src/components/admin/media/ImageCropDialog.tsx frontend/src/messages/admin/th.json frontend/src/messages/admin/en.json frontend/src/messages/admin/de.json frontend/src/app/api/media-proxy/route.ts
git commit -m "fix(media): remove server-side image proxy"
```

### Task 3: Managed and external Media Library UX

**Files:**
- Modify: `frontend/src/components/admin/media/MediaPickerDialog.tsx`
- Modify: `frontend/src/components/admin/media/MediaImagePicker.tsx`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- Consumes: `Media` from `@/types/entities` and `classifyMediaSource()` from Task 1.
- Preserves: `MediaPickerDialogProps.onSelect(url: string): void` so Event, Monk, Settings, CMS, and rich-text callers remain compatible.
- Produces: managed cards with Select + Crop and external cards with Select + Upload replacement.

- [ ] **Step 1: Add source-status copy to all Admin locale files**

Add these keys under `Admin.mediaPicker` with equivalent Thai, English, and German text:

```json
{
  "searchPlaceholder": "Search images",
  "managedBadge": "Managed",
  "externalBadge": "External",
  "externalDescription": "External images can be selected but not cropped.",
  "replaceExternal": "Upload replacement",
  "selectImage": "Select image",
  "cropUnavailable": "Crop is available only for managed images"
}
```

- [ ] **Step 2: Run locale JSON validation before component changes**

Run: `cd frontend && node -e 'for (const f of ["th","en","de"]) JSON.parse(require("node:fs").readFileSync(`src/messages/admin/${f}.json`, "utf8"))'`

Expected: exit 0.

- [ ] **Step 3: Retain complete records and render explicit actions**

Replace `galleryImages: string[]` with `mediaItems: Media[]`. Deduplicate by non-empty URL while retaining the first complete record:

```ts
const uniqueMedia = Array.from(
  new Map(media.filter((item) => item.url.trim()).map((item) => [item.url, item])).values(),
);
setMediaItems(uniqueMedia);
```

Search `original_filename`, `filename`, and `url`. For every card:

```ts
const kind = classifyMediaSource(item.url);
const canCrop = kind === "managed";
```

Keep card selection available for managed and external records. Render Crop only when `canCrop`; render `replaceExternal` for external records and route it to the existing hidden file input. Make card selection a real `<button type="button">` with an accessible name. Keep actions visible on keyboard focus, not hover alone. Use `item.id || item.url` as the React key.

In `MediaImagePicker`, classify an existing `value`; show the external badge and replacement guidance when it is external. Do not alter the stored value until the administrator selects or uploads a replacement.

- [ ] **Step 4: Verify every existing picker consumer compiles**

Run: `cd frontend && ./node_modules/.bin/eslint src/components/admin/media/MediaPickerDialog.tsx src/components/admin/media/MediaImagePicker.tsx && ./node_modules/.bin/tsc --noEmit`

Expected: EventEditor, MonkEditor, RichTextToolbar, Settings, and Website CMS compile without prop changes.

- [ ] **Step 5: Commit source-aware picker UX**

```bash
git add frontend/src/components/admin/media/MediaPickerDialog.tsx frontend/src/components/admin/media/MediaImagePicker.tsx frontend/src/messages/admin/th.json frontend/src/messages/admin/en.json frontend/src/messages/admin/de.json
git commit -m "feat(media): distinguish managed and external assets"
```

### Task 4: Media-first URL fields and Map correction

**Files:**
- Modify: `frontend/src/components/admin/website/MediaUrlField.tsx`
- Modify: `frontend/src/components/admin/website/sections/MapSectionEditor.tsx`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- Consumes: `classifyMediaSource()` from Task 1.
- Preserves: `MediaUrlField` props and React Hook Form `inputProps` wiring.
- Removes: Media Library behavior from `body.embed_url`, which is a map URL rather than an image URL.

- [ ] **Step 1: Add URL-field copy in all three Admin locales**

Add `Admin.mediaUrlField` keys with localized values:

```json
{
  "chooseManaged": "Choose from Media Library",
  "advanced": "Advanced: manual URL",
  "managed": "Managed image",
  "external": "External image",
  "externalWarning": "This image can render, but crop is disabled. Upload a managed replacement to edit it.",
  "empty": "Choose or upload an image"
}
```

- [ ] **Step 2: Confirm locale files remain valid JSON**

Run: `cd frontend && node -e 'for (const f of ["th","en","de"]) JSON.parse(require("node:fs").readFileSync(`src/messages/admin/${f}.json`, "utf8"))'`

Expected: exit 0.

- [ ] **Step 3: Reshape the image URL field without breaking form registration**

In `MediaUrlField`, render preview/status and the Media Library button first. Put the existing `<Input {...inputProps}>` inside a native `<details>` whose `<summary>` uses `t("advanced")`. Classify non-empty values and render the external warning with `role="status"`. Keep `onUrlChange` as the picker callback.

In `MapSectionEditor`, replace `MediaUrlField` with the existing `Input`:

```tsx
<Input
  label="Map embed URL"
  type="url"
  {...form.register("body.embed_url" as never)}
  disabled={props.isSaving}
/>
```

This prevents map URLs from opening image selection or crop UX.

- [ ] **Step 4: Type-check all affected page surfaces**

Run: `cd frontend && ./node_modules/.bin/eslint src/components/admin/website/MediaUrlField.tsx src/components/admin/website/sections/MapSectionEditor.tsx && ./node_modules/.bin/tsc --noEmit`

Expected: exit 0.

- [ ] **Step 5: Commit the media-first field flow**

```bash
git add frontend/src/components/admin/website/MediaUrlField.tsx frontend/src/components/admin/website/sections/MapSectionEditor.tsx frontend/src/messages/admin/th.json frontend/src/messages/admin/en.json frontend/src/messages/admin/de.json
git commit -m "feat(media): make library the primary image flow"
```

### Task 5: Production configuration and acceptance

**Files:**
- Modify: `frontend/.env.example`
- Modify: `docs/DEPLOYMENT.md`

**Interfaces:**
- Documents: exact frontend origin configuration and external R2/CDN CORS prerequisite.
- Verifies: all affected Admin surfaces plus route removal.

- [ ] **Step 1: Add safe example configuration**

Add to `frontend/.env.example`:

```dotenv
# Comma-separated public origins whose images may be edited in Admin.
# Production entries must be HTTPS origins with no wildcard or path.
NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS=https://media.example.com
```

- [ ] **Step 2: Document production CORS and rollout order**

Add to `docs/DEPLOYMENT.md`:

```markdown
Managed media:
- Set `NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS` to the exact R2/CDN HTTPS origins.
- Allow `GET` and `HEAD` from the deployed frontend origin in R2/CDN CORS.
- Configure CORS first, then build/deploy the frontend.
- `/api/media-proxy` must return `404`; do not restore it during rollback.
```

- [ ] **Step 3: Run repository verification**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/lib/mediaOrigins.test.ts`

Expected: PASS.

Run: `cd frontend && npm run lint`

Expected: touched files have no errors; record the existing repository baseline separately if unrelated failures remain.

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`

Expected: exit 0.

Run: `cd frontend && NEXT_PUBLIC_API_URL=https://api.example.invalid NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS=https://media.example.invalid npm run build`

Expected: production build exits 0.

- [ ] **Step 4: Run browser smoke at mobile and desktop widths**

Verify these routes and controls:

```text
/th/admin/events/new              image select, managed crop, external replacement
/th/admin/monks/new               image select, managed crop, external replacement
/th/admin/settings                logo and hero image fields
/th/admin/website                 Hero and rich-text image selection
/th/admin/website                 Map embed remains a normal URL field
/api/media-proxy?url=https://...  404
```

Repeat locale copy checks under `/en/admin/...` and `/de/admin/...`. Confirm keyboard focus reaches Select, Crop, Upload replacement, Advanced URL, and Close controls.

- [ ] **Step 5: Commit deployment guidance**

```bash
git add frontend/.env.example docs/DEPLOYMENT.md
git commit -m "docs(media): define production origin and CORS setup"
```
