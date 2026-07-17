# About Admin CMS RichText Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Admin About editor from localStorage mock data to the Website CMS API while preserving the shared localized RichText contract for objective, administration, and history content.

**Architecture:** `PAGE-ABOUT` becomes the API-backed source of truth. Pure adapter functions convert between `ContentPage` and the existing About form shape, keeping the editor UI independent of its persistence format. The backend creates the missing `PAGE-ABOUT` record when seeding and validates only the three approved RichText fields in its JSON body.

**Tech Stack:** Next.js App Router, TypeScript strict, TanStack Query, React Hook Form, Zod, Tiptap JSON, Go Fiber, GORM, PostgreSQL JSONB.

## Global Constraints

- This is Admin-only: do not change `PublicAboutPageLayout.tsx`, `about.json`, or public About rendering.
- Use `websiteCmsAdminService`; no direct Axios calls from components.
- Keep server data in TanStack Query and editor-only state in `useWebsiteCmsEditorStore`.
- Do not add libraries, `any`, or duplicate API/form types.
- Only `objective_content`, `administration_content`, and `history_content` are `LocalizedRichText`.
- Preserve dynamic locale handling; do not hard-code a locale union in shared RichText utilities.
- Do not add automated tests at the owner's request. Perform the listed manual checks and both build commands.

---

## File Structure

- `frontend/src/utils/websiteCms.ts` — pure About page/body ↔ form adapters and legacy detection.
- `frontend/src/hooks/website-page-master.ts` — API-backed About query/mutation; remove only the obsolete About localStorage helpers.
- `frontend/src/components/admin/website/about/AboutPageEditor.tsx` — adapt API data on reset, fire non-blocking migration, and submit CMS payloads with existing toast feedback.
- `backend/internal/richtext/validation.go` — validate the three About body fields for `PAGE-ABOUT`.
- `backend/internal/services/content_service.go` — seed the API-owned About page only when it does not already exist.
- `backend/cmd/seed/main.go` — call the About seed with the other CMS page seeds.

### Task 1: Add the persisted `PAGE-ABOUT` seed and its RichText validation

**Files:**

- Modify: `backend/internal/services/content_service.go:218-450`
- Modify: `backend/internal/richtext/validation.go:159-186`
- Modify: `backend/cmd/seed/main.go:239-248`

**Interfaces:**

- Produces: `func (s *ContentService) EnsureAboutPageSeed() error`
- Produces: `richtext.ValidateContentPageBody("PAGE-ABOUT", body)` validation for `objective_content`, `administration_content`, and `history_content`.
- Consumed by: seed command and the existing `ContentService.UpdatePageDraft` / rich-text migration service.

- [ ] **Step 1: Add `PAGE-ABOUT` body validation without widening other page contracts**

  Extend the existing page-key switch in `ValidateContentPageBody` with an explicit `PAGE-ABOUT` case. For each allowed key, call the existing `validateLocalizedUnknown`; do not validate titles, short descriptions, buildings, or Sangha fields as RichText.

  ```go
  case "PAGE-ABOUT":
      for _, field := range []string{
          "objective_content",
          "administration_content",
          "history_content",
      } {
          if err := validateLocalizedUnknown(body[field], "body."+field); err != nil {
              return err
          }
      }
  ```

- [ ] **Step 2: Add an idempotent About CMS seed**

  Add `EnsureAboutPageSeed` beside the Privacy/Impressum seed methods. It must query by `PAGE-ABOUT`, return unchanged when the page already exists, and create a `published` page otherwise. Map the former mock hero title/subtitle to `ContentPage.Title`/`Description`, preserve SEO metadata, and put the remaining form fields in `Body`.

  Seed the three long-form fields as localized legacy strings so the existing admin read flow can demonstrate its non-blocking conversion; all newly saved values must still be structured JSON documents. Initialize `PublishedTitle`, `PublishedDescription`, `PublishedSeo`, `PublishedBody`, `PublishedSettings`, and `PublishedAt` exactly as the Privacy and Impressum seed methods do.

  ```go
  page = models.ContentPage{
      PageKey: "PAGE-ABOUT",
      Slug: "about",
      Title: models.MultiLangText{"th": "เกี่ยวกับเรา", "en": "About Us", "de": "Über uns"},
      Description: models.MultiLangText{
          "th": "เรียนรู้ประวัติ ความเป็นมา และวิสัยทัศน์ของวัดโปรไฟล์",
          "en": "Learn the history, background, and vision of Wat Profile.",
          "de": "Lernen Sie die Geschichte, den Hintergrund und die Vision von Wat Profile kennen.",
      },
      Status: models.ContentStatusPublished,
      Body: models.JSONMap{
          "objective_content": models.MultiLangText{
              "th": "ตั้งใจสนับสนุนชุมชน เสริมสร้างสันติภาพและความสุขภายในจิตใจของทุกๆ คน",
              "en": "Dedicated to supporting the community and fostering inner peace and happiness for all.",
              "de": "Unterstützung der Gemeinschaft und Förderung des inneren Friedens und des Glücks für alle.",
          },
          "administration_content": models.MultiLangText{
              "th": "วัดดำเนินกิจกรรมต่างๆ ภายใต้สมาคมจดทะเบียนไม่แสวงหาผลกำไร",
              "en": "The temple operates under a registered non-profit association.",
              "de": "Der Tempel wird im Rahmen eines eingetragenen gemeinnützigen Vereins betrieben.",
          },
          "history_content": models.MultiLangText{
              "th": "วัดโปรไฟล์ก่อตั้งขึ้นเพื่อเป็นสถานที่ยึดเหนี่ยวจิตใจและเผยแผ่หลักธรรมคำสอนในพุทธศาสนา ผ่านกระบวนการและเครื่องมือสมัยใหม่",
              "en": "Wat Profile was founded to be a spiritual anchor and spread Buddhist teachings through modern tools.",
              "de": "Wat Profile wurde gegründet, um ein spiritueller Anker zu sein und buddhistische Lehren durch moderne Werkzeuge zu verbreiten.",
          },
      },
  }
  ```

  Copy the complete literal values for all existing About mock fields into the seed rather than introducing placeholder content.

- [ ] **Step 3: Register the seed command**

  After `EnsureContactPageSeed`, `EnsurePrivacyPageSeed`, and `EnsureImpressumPageSeed`, invoke `EnsureAboutPageSeed` and return/log its error using the command's current seed-error style.

  ```go
  if err := contentService.EnsureAboutPageSeed(); err != nil {
      log.Fatal().Err(err).Msg("failed to ensure about content page")
  }
  ```

- [ ] **Step 4: Verify backend compilation**

  Run: `cd backend && GOMODCACHE=/private/tmp/gomodcache GOCACHE=/private/tmp/go-build-cache GOPATH=/private/tmp/gopath go build ./...`

  Expected: exit code 0.

- [ ] **Step 5: Commit the backend page contract**

  ```bash
  git add backend/internal/richtext/validation.go backend/internal/services/content_service.go backend/cmd/seed/main.go
  git commit -m "feat(cms): add about page richtext contract"
  ```

### Task 2: Introduce pure CMS-to-About form adapters

**Files:**

- Modify: `frontend/src/utils/websiteCms.ts:1-120`

**Interfaces:**

- Consumes: `ContentPage`, `AboutPageMasterFormData`, `normalizeLocalizedRichText`, `hasLegacyLocalizedRichText`, and `WEBSITE_CMS_LOCALES`.
- Produces: `contentPageToAboutFormData(page: ContentPage): AboutPageMasterFormData`.
- Produces: `aboutFormDataToContentPagePayload(values: AboutPageMasterFormData): Partial<ContentPage>`.
- Produces: `hasLegacyAboutRichTextBody(body: unknown): boolean`.
- Consumed by: About hooks/editor in Task 3.

- [ ] **Step 1: Add typed body narrowing helpers**

  Add a private `asRecord(value: unknown): Record<string, unknown>` helper and a localized-text fallback helper that returns `{ th: "", en: "", de: "" }`. Use `unknown` plus narrowing; do not use `any` or unsafe `as` casts for API bodies.

- [ ] **Step 2: Map CMS page data into the current About form contract**

  Build `contentPageToAboutFormData` so `page.title` becomes `content.hero_title`, `page.description` becomes `content.hero_subtitle`, and the known keys in `page.body` populate the rest of `content`. Normalize only the three RichText fields with `normalizeLocalizedRichText(value, [...WEBSITE_CMS_LOCALES], "th")`. Preserve the page id, slug, SEO, and status.

  ```ts
  export function contentPageToAboutFormData(page: ContentPage): AboutPageMasterFormData {
    const body = asRecord(page.body);
    return {
      id: page.id,
      slug: page.slug,
      status: page.status,
      seo: normalizeSeoMetadata(page.seo),
      content: {
        hero_title: withAllLocales(page.title),
        hero_subtitle: withAllLocales(page.description),
        objective_content: normalizeLocalizedRichText(body.objective_content, [...WEBSITE_CMS_LOCALES], "th"),
        administration_content: normalizeLocalizedRichText(body.administration_content, [...WEBSITE_CMS_LOCALES], "th"),
        history_content: normalizeLocalizedRichText(body.history_content, [...WEBSITE_CMS_LOCALES], "th"),
      },
    };
  }
  ```

- [ ] **Step 3: Map form values back into a CMS update payload**

  Build `aboutFormDataToContentPagePayload` so hero fields go back to top-level `title`/`description`, and all other About data goes into `body`. Do not serialize `id`; do not introduce a second page key field. Include `seo`, `status`, and preserve the editor's current `slug`.

  ```ts
  export function aboutFormDataToContentPagePayload(values: AboutPageMasterFormData): Partial<ContentPage> {
    const { hero_title, hero_subtitle, ...body } = values.content;
    return {
      slug: values.slug,
      title: hero_title,
      description: hero_subtitle,
      seo: values.seo,
      body,
      status: values.status,
    };
  }
  ```

- [ ] **Step 4: Add targeted legacy detection**

  Implement `hasLegacyAboutRichTextBody` using `asRecord` and `hasLegacyLocalizedRichText` for exactly `objective_content`, `administration_content`, and `history_content`. Return false for missing fields and for all non-About data.

- [ ] **Step 5: Commit the adapter boundary**

  ```bash
  git add frontend/src/utils/websiteCms.ts
  git commit -m "refactor(cms): add about page form adapters"
  ```

### Task 3: Replace About localStorage hooks with Website CMS API hooks

**Files:**

- Modify: `frontend/src/hooks/website-page-master.ts:1-15,227-500`

**Interfaces:**

- Consumes: `websiteCmsAdminService.getPage("PAGE-ABOUT")`, `websiteCmsAdminService.updatePage(id, payload)`, and `Partial<ContentPage>`.
- Produces: `useAboutPageQuery(): UseQueryResult<ContentPage>`.
- Produces: `useUpdateAboutPageMutation()` accepting `{ id: string; payload: Partial<ContentPage> }`.
- Consumed by: `AboutPageEditor` in Task 4.

- [ ] **Step 1: Delete only obsolete About mock state**

  Remove `ABOUT_LOCAL_STORAGE_KEY`, `defaultAboutMockData`, `loadAboutMockData`, and `saveAboutMockData`. Keep the existing Home and Contact mock data/helpers untouched because they are outside this task.

- [ ] **Step 2: Query the API-backed About page**

  Replace the About query function with `websiteCmsAdminService.getPage("PAGE-ABOUT")`. Keep the cache key `['website-page-master', 'about']` so no unrelated editor state changes.

  ```ts
  export function useAboutPageQuery() {
    return useQuery({
      queryKey: ["website-page-master", "about"],
      queryFn: () => websiteCmsAdminService.getPage("PAGE-ABOUT"),
    });
  }
  ```

- [ ] **Step 3: Update through the common CMS service**

  Change the mutation argument to `{ id, payload }`, call `websiteCmsAdminService.updatePage(id, payload)`, set the returned page into the About cache, and invalidate `['website-cms']`, matching Privacy/Impressum behavior.

- [ ] **Step 4: Commit the API hook transition**

  ```bash
  git add frontend/src/hooks/website-page-master.ts
  git commit -m "feat(cms): load about admin data from api"
  ```

### Task 4: Wire the About editor to adapters, lazy migration, and save feedback

**Files:**

- Modify: `frontend/src/components/admin/website/about/AboutPageEditor.tsx:1-200`

**Interfaces:**

- Consumes: Task 2 adapters, Task 3 `ContentPage` query/mutation contract, `richTextMigrationService.migrate`, and existing `useToast`.
- Produces: API-backed About editor behavior without a localStorage dependency.

- [ ] **Step 1: Reset the form from a mapped CMS page**

  Replace `normalizeAboutPageData(pageData)` with `contentPageToAboutFormData(pageData)` in the focused reset effect. Retain the existing form defaults for loading/empty render only.

- [ ] **Step 2: Migrate legacy rich text without blocking editing**

  In the same data-load effect, call `hasLegacyAboutRichTextBody(pageData.body)`. When true, send the normalized body from `contentPageToAboutFormData(pageData).content` through the migration endpoint as a page body payload. Merge only the mapped About body into the API page body so unrelated backend keys survive.

  ```ts
  void richTextMigrationService.migrate({
    resource: "content_page",
    id: pageData.id,
    updated_at: pageData.updated_at,
    field: "body",
    value: aboutFormDataToContentPagePayload(formValues).body,
  }).catch(() => undefined);
  ```

  The catch is intentionally silent: migration conflicts/failures must not interrupt authoring, and a normal Save remains authoritative.

- [ ] **Step 3: Submit the CMS update payload with user feedback**

  Require `pageData.id`, call the mutation with the adapter payload, toast success/error, and reset from `contentPageToAboutFormData(updatedPage)` after success. Preserve the existing dirty-state store cleanup and disable the Save control while the mutation is pending.

  ```ts
  updateMutation.mutate(
    { id: pageData.id, payload: aboutFormDataToContentPagePayload(values) },
    {
      onSuccess: (updatedPage) => {
        toast.success("Saved successfully");
        reset(contentPageToAboutFormData(updatedPage));
      },
      onError: () => toast.error("Failed to save data"),
    },
  );
  ```

- [ ] **Step 4: Commit editor integration**

  ```bash
  git add frontend/src/components/admin/website/about/AboutPageEditor.tsx
  git commit -m "feat(about): save richtext through cms api"
  ```

### Task 5: Manual verification and build gates

**Files:**

- No source changes required unless a check exposes a defect within this plan's scope.

**Interfaces:**

- Verifies: Admin About API source, legacy conversion, backend validation, persistence, and unchanged public scope.

- [ ] **Step 1: Seed and open the API-backed editor**

  Run the existing backend seed command in the configured environment, then open Admin Website → About. Confirm the request targets `GET /admin/website/pages/PAGE-ABOUT`, not browser localStorage, and all current tabs/fields load.

- [ ] **Step 2: Verify one-time legacy conversion**

  With the seed's legacy long-form strings, load About and confirm each of the three editors receives readable paragraph content. Confirm the non-blocking migration request posts `resource: content_page`, `field: body`, the page id, and the original `updated_at`; a migration conflict must leave the editor usable.

- [ ] **Step 3: Verify save and refresh persistence**

  Edit a heading, a list, a link, and an image in each RichText field. Save, refresh the admin route, and confirm the API response/body contains valid Tiptap JSON for all three fields. Confirm hero title/subtitle remain top-level page title/description and ordinary About fields remain plain localized values in `body`.

- [ ] **Step 4: Verify server rejection**

  Submit or replay a page update with an unsupported RichText node/mark in `body.objective_content`. Expect HTTP 400 from the existing content handler. Then submit a valid document and expect success.

- [ ] **Step 5: Verify the intentionally unchanged public scope**

  Open the public About page and confirm it retains its pre-existing fallback/layout behavior; do not modify it as a response to this check.

- [ ] **Step 6: Run mandatory builds**

  Run:

  ```bash
  cd frontend && npm run build
  cd ../backend && GOMODCACHE=/private/tmp/gomodcache GOCACHE=/private/tmp/go-build-cache GOPATH=/private/tmp/gopath go build ./...
  ```

  Expected: both commands exit code 0.

## Plan Self-Review

- Spec coverage: Tasks 1-4 cover API source of truth, form adapters, dynamic localized RichText normalization, non-blocking version-checked migration, backend validation, and removal of the About localStorage path. Task 5 verifies the admin-only boundary and build gates.
- Scope: The plan does not touch public About rendering, `about.json`, Home/Contact mock flows, layout, or non-approved RichText fields.
- Type consistency: `ContentPage` is the query/update payload throughout; `AboutPageMasterFormData` remains the form-only shape; `Partial<ContentPage>` is the service update input.
- Automated tests: intentionally omitted per owner instruction; manual checks are concrete and the build commands remain mandatory.
