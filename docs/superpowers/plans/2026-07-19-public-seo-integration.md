# Public SEO Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render typed, published API SEO for About, Contact, Gallery, Events, Monks, Privacy, and Impressum, while deriving Event and Monk detail metadata from their entity APIs.

**Architecture:** Introduce one typed SEO contract in Go and TypeScript, normalize JSONB at backend boundaries, and route all Next.js metadata construction through one pure converter. Page metadata prefers API SEO, then API content, existing translations, and finally technical site configuration; page rendering remains unchanged.

**Tech Stack:** Go 1.24, Fiber, GORM/PostgreSQL JSONB, Next.js 16 App Router, React 19, TypeScript 5, Zod 4, next-intl, Node test runner.

## Global Constraints

- Do not change Home CMS content or Home SEO.
- Do not add editable Navigation or Footer links.
- Do not add per-Event or per-Monk custom SEO database fields.
- Do not use TypeScript `any` or unsafe assertions that bypass type checking.
- Do not hardcode visitor-facing SEO content in components or metadata utilities.
- Public responses use published SEO only.
- Fallback order is API SEO, API content/entity, existing translations, then technical `siteConfig`.
- Admin input validation and backend validation must accept and reject the same SEO shapes.

---

## File Map

### Backend

- Create `backend/internal/seo/metadata.go`: typed SEO DTO, JSONMap conversion, normalization, and validation.
- Create `backend/internal/seo/metadata_test.go`: contract and URL validation tests.
- Modify `backend/internal/publiccontent/contracts.go`: replace untyped SEO maps with `seo.Metadata`.
- Modify `backend/internal/publiccontent/mapper.go`: convert typed SEO to and from persisted JSONMap.
- Modify `backend/internal/publiccontent/validation.go`: delegate SEO validation to the typed module.
- Modify `backend/internal/services/content_service.go`: expose typed published SEO and reject invalid Admin CMS SEO.
- Create `backend/internal/services/content_service_seo_test.go`: published/draft isolation and invalid-shape tests.

### Frontend shared SEO

- Modify `frontend/src/types/public-content.ts`: use one exact `SeoMetadata` contract.
- Modify `frontend/src/types/website-cms.ts`: remove the SEO index signature.
- Modify `frontend/src/schemas/website-page.schema.ts`: replace `any` preprocessors with safe unknown parsing and validate `noindex`/URLs.
- Create `frontend/src/features/public/seo/schema.ts`: runtime parser for public SEO payloads.
- Create `frontend/src/features/public/seo/metadata.ts`: pure Next.js Metadata converter and fallback resolution.
- Create `frontend/src/features/public/seo/api.ts`: server-safe published page SEO fetcher for Gallery, Events, and Monks.
- Create `frontend/src/features/public/seo/metadata.test.ts`: parser and fallback tests.

### Public routes

- Modify `frontend/src/app/[locale]/(client)/about/page.tsx`.
- Modify `frontend/src/app/[locale]/(client)/contact/page.tsx`.
- Modify `frontend/src/app/[locale]/(client)/gallery/page.tsx`.
- Modify `frontend/src/app/[locale]/(client)/events/page.tsx`.
- Modify `frontend/src/app/[locale]/(client)/monks/page.tsx`.
- Modify `frontend/src/app/[locale]/(client)/privacy/page.tsx`.
- Modify `frontend/src/app/[locale]/(client)/impressum/page.tsx`.
- Modify `frontend/src/app/[locale]/(client)/events/[slug]/page.tsx`.
- Modify `frontend/src/app/[locale]/(client)/monks/[slug]/page.tsx`.

---

### Task 1: Add the typed backend SEO contract

**Files:**
- Create: `backend/internal/seo/metadata.go`
- Create: `backend/internal/seo/metadata_test.go`

**Interfaces:**
- Consumes: `models.JSONMap`, `models.MultiLangText`.
- Produces: `seo.Metadata`, `seo.FromJSONMap(models.JSONMap) (Metadata, error)`, `Metadata.ToJSONMap() models.JSONMap`, and `Metadata.Validate() error`.

- [ ] **Step 1: Write failing contract tests**

```go
package seo

import (
    "testing"
    "github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestFromJSONMapRejectsWrongTypes(t *testing.T) {
    _, err := FromJSONMap(models.JSONMap{"noindex": "false"})
    if err == nil { t.Fatal("expected noindex type error") }
}

func TestMetadataValidateAcceptsURLOrRootRelativeCanonical(t *testing.T) {
    for _, canonical := range []string{"", "/th/about", "https://wat.example/th/about"} {
        value := Metadata{CanonicalURL: canonical}
        if err := value.Validate(); err != nil { t.Fatalf("%q: %v", canonical, err) }
    }
}

func TestMetadataValidateRejectsUnsafeURLs(t *testing.T) {
    value := Metadata{CanonicalURL: "javascript:alert(1)", OGImage: "ftp://example.test/image.jpg"}
    if err := value.Validate(); err == nil { t.Fatal("expected unsafe URL error") }
}

func TestMetadataRoundTripPreservesTypedFields(t *testing.T) {
    input := Metadata{
        Title: models.MultiLangText{"th": "เกี่ยวกับ", "en": "About", "de": "Über uns"},
        Description: models.MultiLangText{"th": "คำอธิบาย", "en": "Description", "de": "Beschreibung"},
        Keywords: models.MultiLangText{"th": "วัด", "en": "temple", "de": "Tempel"},
        OGImage: "/images/about.jpg", CanonicalURL: "/th/about", NoIndex: true,
    }
    output, err := FromJSONMap(input.ToJSONMap())
    if err != nil { t.Fatal(err) }
    if output.CanonicalURL != input.CanonicalURL || !output.NoIndex { t.Fatalf("unexpected output: %#v", output) }
}
```

- [ ] **Step 2: Run the tests and verify the missing package failure**

Run: `cd backend && go test ./internal/seo -run 'TestMetadata|TestFromJSONMap' -v`

Expected: FAIL because `internal/seo` and `Metadata` do not exist.

- [ ] **Step 3: Implement the typed contract and strict decoder**

```go
package seo

import (
    "encoding/json"
    "errors"
    "fmt"
    "net/url"
    "strings"

    "github.com/watloungporsai/wat-profile-backend/internal/models"
)

type Metadata struct {
    Title        models.MultiLangText `json:"title"`
    Description  models.MultiLangText `json:"description"`
    Keywords     models.MultiLangText `json:"keywords"`
    OGImage      string               `json:"og_image"`
    CanonicalURL string               `json:"canonical_url"`
    NoIndex      bool                 `json:"noindex"`
}

func FromJSONMap(source models.JSONMap) (Metadata, error) {
    if source == nil { return Metadata{}, nil }
    raw, err := json.Marshal(source)
    if err != nil { return Metadata{}, fmt.Errorf("encode SEO: %w", err) }
    var value Metadata
    decoder := json.NewDecoder(strings.NewReader(string(raw)))
    decoder.DisallowUnknownFields()
    if err := decoder.Decode(&value); err != nil { return Metadata{}, fmt.Errorf("decode SEO: %w", err) }
    if err := value.Validate(); err != nil { return Metadata{}, err }
    return value, nil
}

func (m Metadata) ToJSONMap() models.JSONMap {
    return models.JSONMap{
        "title": m.Title, "description": m.Description, "keywords": m.Keywords,
        "og_image": m.OGImage, "canonical_url": m.CanonicalURL, "noindex": m.NoIndex,
    }
}

func (m Metadata) Validate() error {
    if err := validateURLOrPath(m.CanonicalURL); err != nil { return fmt.Errorf("seo.canonical_url: %w", err) }
    if err := validateURLOrPath(m.OGImage); err != nil { return fmt.Errorf("seo.og_image: %w", err) }
    return nil
}

func validateURLOrPath(raw string) error {
    if strings.TrimSpace(raw) == "" || strings.HasPrefix(raw, "/") { return nil }
    parsed, err := url.Parse(raw)
    if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
        return errors.New("must be an http(s) URL or root-relative path")
    }
    return nil
}
```

- [ ] **Step 4: Run the focused tests**

Run: `cd backend && go test ./internal/seo -v`

Expected: PASS.

- [ ] **Step 5: Commit the backend contract**

```bash
git add backend/internal/seo
git commit -m "feat: add typed SEO contract"
```

### Task 2: Enforce typed SEO at backend content boundaries

**Files:**
- Modify: `backend/internal/publiccontent/contracts.go`
- Modify: `backend/internal/publiccontent/mapper.go`
- Modify: `backend/internal/publiccontent/validation.go`
- Modify: `backend/internal/services/content_service.go`
- Create: `backend/internal/services/content_service_seo_test.go`

**Interfaces:**
- Consumes: `seo.Metadata`, `seo.FromJSONMap`, `Metadata.ToJSONMap` from Task 1.
- Produces: typed `SEO seo.Metadata` on public-content DTOs and `Seo seo.Metadata` on `PublishedPagePayload`.

- [ ] **Step 1: Write failing service tests for draft validation and published isolation**

```go
func TestUpdatePageDraftRejectsInvalidSEOShape(t *testing.T) {
    db := contentTestDatabase(t)
    page := seedContentPage(t, db)
    _, err := NewContentService(db).UpdatePageDraft(uuid.MustParse(page.ID), models.ContentPage{
        PageKey: page.PageKey, Slug: page.Slug, Title: page.Title,
        Seo: models.JSONMap{"noindex": "not-a-boolean"}, Body: page.Body,
    })
    if !errors.Is(err, ErrInvalidSEO) { t.Fatalf("expected ErrInvalidSEO, got %v", err) }
}

func TestGetPublicPageUsesPublishedSEOOnly(t *testing.T) {
    db := contentTestDatabase(t)
    page := seedContentPage(t, db)
    page.Seo = models.JSONMap{"canonical_url": "/draft"}
    page.PublishedSeo = models.JSONMap{"canonical_url": "/published"}
    if err := db.Save(&page).Error; err != nil { t.Fatal(err) }
    payload, err := NewContentService(db).GetPublicPage(page.Slug)
    if err != nil { t.Fatal(err) }
    if payload.Seo.CanonicalURL != "/published" { t.Fatalf("unexpected SEO: %#v", payload.Seo) }
}
```

Use the repository's `DATABASE_URL_TEST` pattern from `media_service_test.go`; helpers must migrate only `ContentPage` and `ContentSection` and clean their tables.

Define the helpers in the same test file:

```go
func contentTestDatabase(t *testing.T) *gorm.DB {
    t.Helper()
    dsn := os.Getenv("DATABASE_URL_TEST")
    if dsn == "" { t.Skip("DATABASE_URL_TEST is not configured") }
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil { t.Fatal(err) }
    if err := db.AutoMigrate(&models.ContentPage{}, &models.ContentSection{}); err != nil { t.Fatal(err) }
    if err := db.Exec("DELETE FROM content_sections").Error; err != nil { t.Fatal(err) }
    if err := db.Exec("DELETE FROM content_pages").Error; err != nil { t.Fatal(err) }
    return db
}

func seedContentPage(t *testing.T, db *gorm.DB) models.ContentPage {
    t.Helper()
    id := uuid.New().String()
    now := time.Now()
    page := models.ContentPage{
        ID: id, PageKey: "PAGE-SEO-TEST", Slug: "seo-test",
        Title: models.MultiLangText{"th": "ทดสอบ", "en": "Test", "de": "Test"},
        Description: models.MultiLangText{"th": "คำอธิบาย", "en": "Description", "de": "Beschreibung"},
        Seo: models.JSONMap{}, Body: models.JSONMap{}, Settings: models.JSONMap{},
        Status: models.ContentStatusPublished,
        PublishedTitle: models.MultiLangText{"th": "เผยแพร่", "en": "Published", "de": "Veröffentlicht"},
        PublishedDescription: models.MultiLangText{"th": "เผยแพร่", "en": "Published", "de": "Veröffentlicht"},
        PublishedSeo: models.JSONMap{}, PublishedBody: models.JSONMap{}, PublishedSettings: models.JSONMap{}, PublishedAt: &now,
    }
    if err := db.Create(&page).Error; err != nil { t.Fatal(err) }
    return page
}
```

- [ ] **Step 2: Run the focused service tests**

Run: `cd backend && go test ./internal/services -run 'TestUpdatePageDraftRejectsInvalidSEOShape|TestGetPublicPageUsesPublishedSEOOnly' -v`

Expected: FAIL because `ErrInvalidSEO` and typed `PublishedPagePayload.Seo` do not exist.

- [ ] **Step 3: Change public content contracts and mappers to typed SEO**

In `contracts.go`, replace every `SEO models.JSONMap` with:

```go
SEO seo.Metadata `json:"seo"`
```

In each draft mapper use:

```go
metadata, _ := seo.FromJSONMap(page.Seo)
// assign metadata to the response DTO
```

In each published mapper use `page.PublishedSeo`. In each `Apply*` function persist:

```go
page.Seo = req.SEO.ToJSONMap()
```

Replace `validateSEO(req.SEO)` with:

```go
return req.SEO.Validate()
```

- [ ] **Step 4: Validate and normalize generic CMS page SEO**

Add the service sentinel and typed published field:

```go
var ErrInvalidSEO = errors.New("invalid SEO")

type PublishedPagePayload struct {
    // existing fields unchanged
    Seo seo.Metadata `json:"seo"`
}
```

At the start of `UpdatePageDraft`, before assigning `page.Seo`:

```go
metadata, err := seo.FromJSONMap(input.Seo)
if err != nil { return nil, errors.Join(ErrInvalidSEO, err) }
page.Seo = metadata.ToJSONMap()
```

When building `PublishedPagePayload`, decode `PublishedSeo` with `seo.FromJSONMap`; return the error instead of emitting malformed SEO.

- [ ] **Step 5: Run backend tests**

Run: `cd backend && go test ./internal/seo ./internal/publiccontent ./internal/services -v`

Expected: PASS, with DB-backed tests skipped only when `DATABASE_URL_TEST` is absent.

- [ ] **Step 6: Commit backend boundary enforcement**

```bash
git add backend/internal/publiccontent backend/internal/services/content_service.go backend/internal/services/content_service_seo_test.go
git commit -m "fix: enforce typed SEO boundaries"
```

### Task 3: Add the frontend SEO parser and metadata converter

**Files:**
- Modify: `frontend/src/types/public-content.ts`
- Modify: `frontend/src/types/website-cms.ts`
- Modify: `frontend/src/schemas/website-page.schema.ts`
- Create: `frontend/src/features/public/seo/schema.ts`
- Create: `frontend/src/features/public/seo/metadata.ts`
- Create: `frontend/src/features/public/seo/metadata.test.ts`

**Interfaces:**
- Produces: `seoMetadataSchema`, `SeoMetadata`, `buildPublicMetadata(input): Metadata`.

- [ ] **Step 1: Write failing parser and fallback tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { seoMetadataSchema } from "./schema";
import { buildPublicMetadata } from "./metadata";

test("SEO parser rejects a string noindex", () => {
  assert.equal(seoMetadataSchema.safeParse({ noindex: "false" }).success, false);
});

test("metadata prefers localized API SEO", () => {
  const result = buildPublicMetadata({
    locale: "en", pathname: "/en/about",
    seo: { title: { th: "", en: "API title", de: "" }, description: { th: "", en: "API description", de: "" }, keywords: { th: "", en: "temple", de: "" }, og_image: "/api.jpg", canonical_url: "/en/about", noindex: true },
    content: { title: "Content title", description: "Content description", image: "/content.jpg" },
    messages: { title: "Message title", description: "Message description" },
    site: { name: "Site", description: "Site description", image: "/site.jpg" },
  });
  assert.equal(result.title, "API title");
  assert.equal(result.description, "API description");
  assert.deepEqual(result.robots, { index: false, follow: false });
});
```

- [ ] **Step 2: Run and verify the missing-module failure**

Run: `cd frontend && npx tsx --test src/features/public/seo/metadata.test.ts`

Expected: FAIL because `schema.ts` and `metadata.ts` do not exist.

- [ ] **Step 3: Implement unknown-safe schemas and exact types**

Create localized and SEO schemas without preprocess `any`:

```ts
import { z } from "zod";

export const localizedTextSchema = z.object({ th: z.string(), en: z.string(), de: z.string() });
export const seoMetadataSchema = z.object({
  title: localizedTextSchema.default({ th: "", en: "", de: "" }),
  description: localizedTextSchema.default({ th: "", en: "", de: "" }),
  keywords: localizedTextSchema.default({ th: "", en: "", de: "" }),
  og_image: z.string().refine((value) => value === "" || value.startsWith("/") || URL.canParse(value), "Invalid image URL").default(""),
  canonical_url: z.string().refine((value) => value === "" || value.startsWith("/") || URL.canParse(value), "Invalid canonical URL").default(""),
  noindex: z.boolean().default(false),
});
export type SeoMetadata = z.infer<typeof seoMetadataSchema>;
export const emptySeoMetadata: SeoMetadata = seoMetadataSchema.parse({});
```

Update existing form preprocessors to accept `unknown`, narrow with `typeof value === "object" && value !== null`, and read properties only after narrowing. Remove the `[key: string]: unknown` SEO index signature from `types/website-cms.ts`.

- [ ] **Step 4: Implement the pure metadata converter**

```ts
import type { Metadata } from "next";
import type { LocalizedTextDto } from "../shared/api-types";
import type { SeoMetadata } from "./schema";

type Input = {
  locale: string; pathname: string; seo: SeoMetadata;
  content: { title: string; description: string; image?: string };
  messages: { title: string; description: string };
  site: { name: string; description: string; image: string };
};

const text = (value: LocalizedTextDto, locale: string) => {
  if (locale === "th" || locale === "en" || locale === "de") return value[locale] || value.en || value.th || value.de;
  return value.en || value.th || value.de;
};

export function buildPublicMetadata(input: Input): Metadata {
  const title = text(input.seo.title, input.locale) || input.content.title || input.messages.title || input.site.name;
  const description = text(input.seo.description, input.locale) || input.content.description || input.messages.description || input.site.description;
  const image = input.seo.og_image || input.content.image || input.site.image;
  return {
    title, description,
    keywords: text(input.seo.keywords, input.locale) || undefined,
    robots: input.seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: { title, description, images: image ? [image] : undefined },
    alternates: { canonical: input.seo.canonical_url || input.pathname },
  };
}
```

- [ ] **Step 5: Run tests, typecheck, and lint focused files**

Run: `cd frontend && npx tsx --test src/features/public/seo/metadata.test.ts && npx tsc --noEmit && npx eslint src/features/public/seo src/schemas/website-page.schema.ts src/types/public-content.ts src/types/website-cms.ts`

Expected: PASS with no explicit-`any` suppressions in the modified SEO path.

- [ ] **Step 6: Commit the frontend SEO foundation**

```bash
git add frontend/src/features/public/seo frontend/src/schemas/website-page.schema.ts frontend/src/types/public-content.ts frontend/src/types/website-cms.ts
git commit -m "feat: add typed public SEO metadata"
```

### Task 4: Wire API SEO into page-content routes

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/about/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/contact/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/privacy/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/impressum/page.tsx`

**Interfaces:**
- Consumes: `buildPublicMetadata`, existing `publicContentService` methods, route translations, and `siteConfig`.

- [ ] **Step 1: Add a failing source-level route test**

Add to `metadata.test.ts` a table test that reads the four route files and requires `buildPublicMetadata` plus the corresponding `getPublic*` service call. This guards against leaving static `metadata` exports behind.

```ts
for (const [route, method] of [["about", "getPublicAbout"], ["contact", "getPublicContact"], ["privacy", "getPublicPrivacy"], ["impressum", "getPublicImpressum"]] as const) {
  test(`${route} metadata uses public API SEO`, async () => {
    const source = await readFile(new URL(`../../../app/[locale]/(client)/${route}/page.tsx`, import.meta.url), "utf8");
    assert.match(source, /buildPublicMetadata/);
    assert.match(source, new RegExp(method));
  });
}
```

- [ ] **Step 2: Run the route source test**

Run: `cd frontend && npx tsx --test src/features/public/seo/metadata.test.ts`

Expected: FAIL for the four routes.

- [ ] **Step 3: Replace each static metadata path with the shared flow**

Each route must follow this complete pattern, substituting its service method and translation namespace:

```ts
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AboutPage" });
  const page = await publicContentService.getPublicAbout().catch(() => null);
  return buildPublicMetadata({
    locale, pathname: `/${locale}/about`, seo: page?.seo ?? emptySeoMetadata,
    content: {
      title: page ? getLocalizedText(page.title, locale) : "",
      description: page ? getLocalizedText(page.description, locale) : "",
      image: page?.seo.og_image,
    },
    messages: { title: t("title"), description: t("missionDesc") },
    site: { name: siteConfig.siteName.th, description: siteConfig.seo.defaultDescription, image: siteConfig.seo.defaultOgImage },
  });
}
```

For Privacy, which has no page description, pass an empty content description and use its existing translation. Do not add new copy keys. For Contact and Impressum, add `generateMetadata` rather than static metadata.

- [ ] **Step 4: Run tests and route lint**

Run: `cd frontend && npx tsx --test src/features/public/seo/metadata.test.ts && npx eslint 'src/app/[locale]/(client)/about/page.tsx' 'src/app/[locale]/(client)/contact/page.tsx' 'src/app/[locale]/(client)/privacy/page.tsx' 'src/app/[locale]/(client)/impressum/page.tsx'`

Expected: PASS.

- [ ] **Step 5: Commit page-content metadata wiring**

```bash
git add 'frontend/src/app/[locale]/(client)/about/page.tsx' 'frontend/src/app/[locale]/(client)/contact/page.tsx' 'frontend/src/app/[locale]/(client)/privacy/page.tsx' 'frontend/src/app/[locale]/(client)/impressum/page.tsx' frontend/src/features/public/seo/metadata.test.ts
git commit -m "feat: render public content SEO metadata"
```

### Task 5: Wire published page SEO into Gallery, Events, and Monks indexes

**Files:**
- Create: `frontend/src/features/public/seo/api.ts`
- Modify: `frontend/src/app/[locale]/(client)/gallery/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/events/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/monks/page.tsx`
- Modify: `frontend/src/features/public/seo/metadata.test.ts`

**Interfaces:**
- Produces: `fetchPublishedPageMetadata(slug: "gallery" | "events" | "monks"): Promise<PublicSeoPage>`.

- [ ] **Step 1: Write failing API parser and route source tests**

```ts
test("published page parser rejects untyped SEO", () => {
  const result = publicSeoPageSchema.safeParse({ title: { th: "", en: "", de: "" }, description: { th: "", en: "", de: "" }, seo: { noindex: "false" } });
  assert.equal(result.success, false);
});
```

Extend the route table test for Gallery, Events, and Monks to require `fetchPublishedPageMetadata`.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend && npx tsx --test src/features/public/seo/metadata.test.ts`

Expected: FAIL because the published-page API module is absent.

- [ ] **Step 3: Add the server-safe published page fetcher**

```ts
import { publicApi } from "@/services/publicService";
import { z } from "zod";
import { localizedTextSchema, seoMetadataSchema } from "./schema";
import type { ApiSuccess } from "../shared/api-types";

export const publicSeoPageSchema = z.object({ title: localizedTextSchema, description: localizedTextSchema, seo: seoMetadataSchema });
export type PublicSeoPage = z.infer<typeof publicSeoPageSchema>;
type PublicSeoSlug = "gallery" | "events" | "monks";

export async function fetchPublishedPageMetadata(slug: PublicSeoSlug): Promise<PublicSeoPage> {
  const response = await publicApi.get<ApiSuccess<unknown>>(`/pages/${slug}`);
  return publicSeoPageSchema.parse(response.data.data);
}
```

This fetcher deliberately bypasses the mock/API CMS source switch; metadata in this scope is API-backed.

- [ ] **Step 4: Update all three index metadata functions**

Use the same `buildPublicMetadata` input shape as Task 4. Fetch `gallery`, `events`, or `monks`, localize its title/description, and retain each route's existing translations and `siteConfig` only as fallback. Do not change Gallery grid, Events list, or Monks grid data fetching.

- [ ] **Step 5: Run tests, typecheck, and lint**

Run: `cd frontend && npx tsx --test src/features/public/seo/metadata.test.ts && npx tsc --noEmit && npx eslint src/features/public/seo 'src/app/[locale]/(client)/gallery/page.tsx' 'src/app/[locale]/(client)/events/page.tsx' 'src/app/[locale]/(client)/monks/page.tsx'`

Expected: PASS.

- [ ] **Step 6: Commit index metadata wiring**

```bash
git add frontend/src/features/public/seo 'frontend/src/app/[locale]/(client)/gallery/page.tsx' 'frontend/src/app/[locale]/(client)/events/page.tsx' 'frontend/src/app/[locale]/(client)/monks/page.tsx'
git commit -m "feat: load public index SEO from API"
```

### Task 6: Route Event and Monk detail metadata through the shared converter

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/events/[slug]/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/monks/[slug]/page.tsx`
- Modify: `frontend/src/features/public/seo/metadata.test.ts`

**Interfaces:**
- Consumes: entity DTOs and `buildPublicMetadata`; does not introduce entity SEO fields.

- [ ] **Step 1: Add failing detail-route source tests**

Require both detail routes to import `buildPublicMetadata`, preserve their existing entity fetchers, and contain no literal `Wat Loung Por Sai`, `Monk Not Found`, or `Monk` metadata titles.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend && npx tsx --test src/features/public/seo/metadata.test.ts`

Expected: FAIL for both detail routes.

- [ ] **Step 3: Refactor Event detail metadata**

Keep `fetchPublicEventBySlug`. Pass localized Event title, plain-text description, and `image_url` as `content`; pass existing `EventsPage` translations as `messages`; pass `emptySeoMetadata` because entity SEO is out of scope. Preserve canonical locale alternatives after merging the converter result.

- [ ] **Step 4: Refactor Monk detail metadata**

Keep `fetchPublicMonkBySlug`. Pass localized name, localized title or plain-text bio, and `image_url` as `content`; use existing `MonksPage` translations for fallback. Remove English literal metadata titles.

- [ ] **Step 5: Run tests and typecheck**

Run: `cd frontend && npx tsx --test src/features/public/seo/metadata.test.ts && npx tsc --noEmit && npx eslint 'src/app/[locale]/(client)/events/[slug]/page.tsx' 'src/app/[locale]/(client)/monks/[slug]/page.tsx'`

Expected: PASS.

- [ ] **Step 6: Commit detail metadata wiring**

```bash
git add 'frontend/src/app/[locale]/(client)/events/[slug]/page.tsx' 'frontend/src/app/[locale]/(client)/monks/[slug]/page.tsx' frontend/src/features/public/seo/metadata.test.ts
git commit -m "refactor: centralize entity metadata fallbacks"
```

### Task 7: Full SEO verification

**Files:**
- Modify only files required to correct verification failures introduced by Tasks 1-6.

- [ ] **Step 1: Run backend verification**

Run: `cd backend && go test ./...`

Expected: PASS; tests requiring `DATABASE_URL_TEST` may explicitly SKIP when absent.

- [ ] **Step 2: Run frontend unit tests**

Run: `cd frontend && npx tsx --test src/features/public/seo/metadata.test.ts src/schemas/event.schema.test.ts src/components/admin/rich-text/RichTextLinkDialog.test.ts src/lib/rich-text/editor-commands.test.ts`

Expected: PASS.

- [ ] **Step 3: Run static checks**

Run: `cd frontend && npx tsc --noEmit && npm run lint`

Expected: PASS with no new explicit-`any` suppressions.

- [ ] **Step 4: Build production frontend**

Run: `cd frontend && npm run build`

Expected: Next.js production build succeeds and all supported metadata routes compile.

- [ ] **Step 5: Inspect the final diff for scope and hardcoding**

Run: `git diff --check && rg -n "Monk Not Found|title: \"Monk\"|query\.data\?\.\[0\]" 'frontend/src/app/[locale]/(client)' frontend/src/features/public/seo`

Expected: `git diff --check` is silent; the search returns no SEO hardcoded literals and does not report Event Alert code in this plan's diff.

- [ ] **Step 6: Commit verification-only corrections if needed**

```bash
git add backend frontend
git commit -m "test: verify public SEO integration"
```

Skip this commit when verification required no changes.
