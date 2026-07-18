# Public Gallery, Donation, and Shell API State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace remaining public fixtures and compile-time site-shell content with typed, resilient public API data without changing the existing UI.

**Architecture:** Three independent work streams share the public TanStack Query conventions: Gallery owns its list/category queries, Donation reuses published Contact content, and the shell maps one raw public-settings record into a complete typed configuration with `siteConfig` fallback.

**Tech Stack:** Go/Fiber/GORM/PostgreSQL, Next.js App Router, React, TypeScript, TanStack Query, Axios, next-intl.

## Global Constraints

- Preserve Gallery grid/filter/lightbox, Home donation cards, and Nav/Footer/sidebar layouts.
- Use `publicApi`, `ApiSuccess<T>`, `unwrapApiData`, and `shouldRetryPublicQuery` for all new public reads.
- Do not use `any`, fixture data, hardcoded locale values, or hardcoded user-visible text.
- Do not block unrelated sections with `Promise.all`.
- Automated tests are intentionally out of scope at the user's request; use lint, type-check, production build, focused Go checks, and manual state verification.

---

### Task 1: Add Gallery public-query module

**Files:**
- Create: `frontend/src/features/public/gallery/types.ts`
- Create: `frontend/src/features/public/gallery/api.ts`
- Create: `frontend/src/features/public/gallery/queries.ts`

**Interfaces:**
- Produces `PublicGalleryDto`, `PublicGalleryCategoryDto`, `fetchPublicGallery()`, `fetchPublicGalleryCategories()`, `usePublicGalleryQuery()`, `usePublicGalleryCategoriesQuery()`.
- Consumes `GET /api/v1/public/gallery` and `GET /api/v1/public/gallery/categories`.

- [ ] Define DTOs from the current public backend response.

```ts
export interface PublicGalleryDto { id: number; image_url: string; thumbnail_url: string; caption: LocalizedTextDto; category_id: number | null; display_order: number; }
export interface PublicGalleryCategoryDto { id: number; slug: string; name: LocalizedTextDto; display_order: number; }
```

- [ ] Implement both API functions using `publicApi.get<ApiSuccess<T>>()` and `unwrapApiData(response.data)`.
- [ ] Implement `publicGalleryKeys.items()` and `publicGalleryKeys.categories()` with `staleTime: 60_000` and `retry: shouldRetryPublicQuery`.
- [ ] Run `npx eslint src/features/public/gallery && npx tsc --noEmit` from `frontend/`.
- [ ] Commit: `git add frontend/src/features/public/gallery && git commit -m "feat: add public gallery queries"`.

### Task 2: Bind the current Gallery UI to public data

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/gallery/GalleryContent.tsx`
- Create: `frontend/src/features/public/gallery/components/GalleryGridSkeleton.tsx`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- Consumes the hooks from Task 1.
- Produces the current filter/lightbox behavior with localized loading, error, empty, and image fallback states.

- [ ] Remove `gallery.json` and `categories.json` imports; retain only local `filter` and lightbox `index` state.
- [ ] Derive a valid selected filter without an effect chain:

```ts
const activeCategoryId = categories.some((category) => String(category.id) === filter) ? filter : "all";
const filteredImages = activeCategoryId === "all" ? images : images.filter((image) => String(image.category_id) === activeCategoryId);
```

- [ ] Derive lightbox slides from `filteredImages`, use `PublicImage` with a gallery fallback, and localize captions with `useLocale()`.
- [ ] Inside the existing card, render skeleton while data loads, `QueryErrorState` with retry when either required query fails, and `EmptyState` when images are successfully empty. Keep the header/card/filter layout mounted.
- [ ] Add translated Gallery keys: `loading`, `errorTitle`, `errorDescription`, `retry`, `emptyTitle`, `emptyDescription`, `imageUnavailable`.
- [ ] Run `npx eslint 'src/app/[locale]/(client)/gallery' src/features/public/gallery && npx tsc --noEmit && npm run build` from `frontend/`.
- [ ] Manually verify normal, empty, failed-request, filtering, lightbox, and broken-image states at `/th/gallery`.
- [ ] Commit: `git add frontend/src/app/'[locale]'/'(client)'/gallery frontend/src/features/public/gallery frontend/src/messages && git commit -m "feat: load public gallery from api"`.

### Task 3: Extend Contact content for an optional donation QR image

**Files:**
- Modify: `backend/internal/publiccontent/contracts.go`
- Modify: `backend/internal/publiccontent/mapper.go`
- Modify: `backend/internal/publiccontent/validation.go`
- Modify: `frontend/src/types/public-content.ts`
- Modify: `frontend/src/schemas/public-content.schema.ts`
- Modify: `frontend/src/components/admin/public-content/ContactContentForm.tsx`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- Extends the existing public/admin Contact payload with optional `body.bank.qr_image_url`.

- [ ] Add the field consistently:

```go
QRImageURL string `json:"qr_image_url"`
```

```ts
qr_image_url?: string;
```

- [ ] Normalize/map it in `ContactFromPage`, `ContactFromPublishedPage`, and `ApplyContact`; empty stays valid.
- [ ] Add `qr_image_url: z.string().url().or(z.string().length(0)).default("")` to `contactBankSchema` and Contact form defaults.
- [ ] Render one `body.bank.qr_image_url` input in the existing Bank tab with translated admin label/help copy.
- [ ] Run `go test ./internal/publiccontent/...` from `backend/` and `npx tsc --noEmit` from `frontend/`.
- [ ] Commit: `git add backend/internal/publiccontent frontend/src/types/public-content.ts frontend/src/schemas/public-content.schema.ts frontend/src/components/admin/public-content/ContactContentForm.tsx frontend/src/messages/admin && git commit -m "feat: add donation qr contact field"`.

### Task 4: Bind Home DonationSection to published Contact content

**Files:**
- Modify: `frontend/src/components/home/DonationSection.tsx`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- Consumes existing `usePublicContactQuery()` and `ContactBank` from Task 3.
- Produces truthful payment cards without `contact.json` or a fake QR placeholder.

- [ ] Replace `contactData` with `const contactQuery = usePublicContactQuery()` and `const bank = contactQuery.data?.body.bank`.
- [ ] Derive `hasBankTransfer` from bank name, account name, account number, IBAN, or BIC; derive `hasQr` from `qr_image_url`.
- [ ] Render the QR card/modal only when `hasQr`, using `PublicImage`; render transfer card only when `hasBankTransfer`; render `EmptyState` when the query succeeds with neither; render `QueryErrorState` with retry in the card area when it fails.
- [ ] Use `getLocalizedText` and `useLocale` for bank labels and add public Donation keys `loadErrorTitle`, `loadErrorDescription`, `emptyTitle`, `emptyDescription`, `retry`, `qrAlt` to all locale files.
- [ ] Run `npx eslint src/components/home/DonationSection.tsx && npx tsc --noEmit && npm run build` from `frontend/`.
- [ ] Manually verify full bank+QR, transfer-only, empty, and failed Contact request at `/th`.
- [ ] Commit: `git add frontend/src/components/home/DonationSection.tsx frontend/src/messages && git commit -m "feat: load home donation from contact api"`.

### Task 5: Seed and expose public-shell settings

**Files:**
- Create: `backend/migrations/000016_seed_public_shell_settings.up.sql`
- Create: `backend/migrations/000016_seed_public_shell_settings.down.sql`
- Modify: `frontend/src/app/[locale]/admin/settings/page.tsx`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- Public settings keys: `site_name_{th,en,de}`, `site_description_{th,en,de}`, `contact_address_{th,en,de}`, `contact_phone`, `contact_email`, `facebook_url`, `youtube_url`, `instagram_url`, `line_url`, `logo_url`, `social_sidebar_position`.

- [ ] Create an idempotent up migration using `INSERT ... ON CONFLICT (key) DO NOTHING`, `category = 'public-shell'`, `type = 'string'`, and `is_public = true`. Use existing safe values for phone/email/Facebook/YouTube when present; set absent keys to empty strings and default sidebar position to `left`.
- [ ] Create a down migration deleting only the explicit public-shell key list with `category = 'public-shell'`.
- [ ] Keep legacy `contact`, `social`, `donation` categories hidden in Admin Settings but include `public-shell`; map each known key to translated labels/descriptions rather than showing raw key names.
- [ ] Run `go test ./...` from `backend/` and `npx tsc --noEmit` from `frontend/`.
- [ ] Commit: `git add backend/migrations frontend/src/app/'[locale]'/admin/settings/page.tsx frontend/src/messages/admin && git commit -m "feat: expose public shell settings"`.

### Task 6: Add typed public settings query and provider

**Files:**
- Create: `frontend/src/features/public/settings/types.ts`
- Create: `frontend/src/features/public/settings/api.ts`
- Create: `frontend/src/features/public/settings/mapper.ts`
- Create: `frontend/src/features/public/settings/queries.ts`
- Create: `frontend/src/features/public/settings/PublicSiteSettingsProvider.tsx`

**Interfaces:**
- Produces `PublicSiteSettings`, `mapPublicSiteSettings(raw, fallback)`, `usePublicSiteSettingsQuery()`, `PublicSiteSettingsProvider`, `usePublicSiteSettings()`.

- [ ] Define the resolved UI model:

```ts
export interface PublicSiteSettings { siteName: LocalizedText; description: LocalizedText; address: LocalizedText; phone: string; email: string; social: Pick<SocialLinks, "facebook" | "youtube" | "instagram" | "line">; logoUrl: string; socialSidebarPosition: "left" | "right"; }
```

- [ ] Fetch `/settings` as `ApiSuccess<Record<string, string>>`; define `publicSiteSettingsKeys.current()` with `staleTime: 300_000` and `shouldRetryPublicQuery`.
- [ ] Implement a total mapper where empty/malformed values fall back to `siteConfig`; validate `social_sidebar_position` strictly to `left | right`.
- [ ] Provider calls the query once, resolves `query.data ?? {}`, and exposes a complete value via context. The hook throws only when the provider is missing, not on API failure.
- [ ] Run `npx eslint src/features/public/settings && npx tsc --noEmit` from `frontend/`.
- [ ] Commit: `git add frontend/src/features/public/settings && git commit -m "feat: add typed public site settings query"`.

### Task 7: Connect the public shell to resolved settings

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/layout.tsx`
- Modify: `frontend/src/components/layout/Navbar.tsx`
- Modify: `frontend/src/components/layout/Footer.tsx`
- Modify: `frontend/src/components/layout/StickySocials.tsx`
- Modify: `frontend/src/components/seo/JsonLd.tsx`

**Interfaces:**
- Consumes provider and hook from Task 6.
- Produces unchanged public shell markup with live API/fallback values.

- [ ] Wrap the existing public client shell exactly once:

```tsx
<PublicSiteSettingsProvider><Navbar /><main className="grow">{children}</main><Footer /><StickySocials /><CookieConsent /><JsonLd /></PublicSiteSettingsProvider>
```

- [ ] Replace presentation reads from `siteConfig`: Navbar name/logo; Footer localized description/address/contact/social; StickySocials links/position; JsonLd name/contact/description. Retain `siteConfig.domain`, static geo, and SEO defaults not in the public-shell contract.
- [ ] Do not render a shell-wide loading/error replacement. The provider must render `siteConfig` fallback immediately so desktop and mobile navigation remain available during settings failure.
- [ ] Run `npx eslint 'src/app/[locale]/(client)/layout.tsx' src/components/layout src/components/seo/JsonLd.tsx && npx tsc --noEmit && npm run build` from `frontend/`.
- [ ] Manually verify `/th`, `/en`, mobile navigation/sidebar, footer, socials, API values, empty settings, malformed sidebar setting, and failed settings request.
- [ ] Commit: `git add frontend/src/app/'[locale]'/'(client)'/layout.tsx frontend/src/components/layout frontend/src/components/seo/JsonLd.tsx && git commit -m "feat: load public shell from settings api"`.
