# Public Gallery, Donation, and Site Shell API Design

## Goal

Replace the remaining fixture and compile-time data on public client pages without changing the existing visual layout or interaction flow. All public reads use TanStack Query, render typed state boundaries, and retain a safe local fallback where global navigation or contact information must remain visible.

## Scope

The work covers three independent data domains:

1. Gallery grid and gallery category filters.
2. The Home donation block's bank/contact values.
3. Shared site-shell values consumed by Navbar, Footer, StickySocials, and JSON-LD.

The existing Home layout, gallery grid, filter controls, lightbox, donation layout, navigation layout, and footer layout are visual contracts and must not be redesigned.

## Public contracts

### Gallery

The backend already provides `GET /api/v1/public/gallery` and `GET /api/v1/public/gallery/categories`. The frontend will define public DTOs from the existing `Gallery` and `GalleryCategory` shape, including IDs, image URLs, localized captions/names, category IDs, display order, and active status.

`features/public/gallery/api.ts` owns request/response unwrapping. `features/public/gallery/queries.ts` owns `publicGalleryKeys.galleries()` and `publicGalleryKeys.categories()`. `GalleryContent` receives only these query results; it no longer imports `gallery.json` or `categories.json`.

Images are ordered exactly as returned by the public API. The selected category stays in local UI state. If a category disappears after a refresh, the component resets to `all` during render-derived selection rather than an effect chain. The lightbox slide list is derived from the same filtered gallery records, keeping its index aligned with the visible grid.

Loading displays grid-compatible skeletons. Error displays a translated inline retry boundary while preserving the page header. An empty result shows a translated empty state. Missing image URLs use the project public-image fallback.

### Donation

The donation block uses the existing `usePublicContactQuery()` result, specifically `body.bank` and any supported contact/social fields. It no longer imports `contact.json`.

The block preserves its two-card layout. A bank transfer card renders only fields supplied by the public contact payload. The Thai QR card renders a real configured QR/media URL only when the Contact content contract provides one; otherwise the QR action/card is omitted rather than displaying a fake QR placeholder. The remaining available donation method stays visible.

While Contact data is loading or errors, the donation copy/layout remains usable through localized copy and a clearly bounded unavailable state; it must not blank the whole Home page. The existing Contact page continues to own its own query and is not coupled to Home state.

### Site shell settings

`GET /api/v1/public/settings` currently returns `map[string]string`. The backend must make its public key contract explicit and stable. The following public settings are required when configured:

- `site_name_th`, `site_name_en`, `site_name_de`
- `site_description_th`, `site_description_en`, `site_description_de`
- `contact_address_th`, `contact_address_en`, `contact_address_de`
- `contact_phone`, `contact_email`
- `facebook_url`, `youtube_url`, `instagram_url`, `line_url`
- `logo_url`, `social_sidebar_position`

Values remain strings in transport. The frontend maps this record through one typed, total mapper into `PublicSiteSettings`; malformed, absent, or unsupported values fall back to `siteConfig`. No UI component reads raw setting keys.

The admin Settings screen currently hides the `contact`, `social`, and `donation` categories. Public-shell records use the separate `public-shell` category so they remain editable without reintroducing duplicate Contact-page bank/contact ownership into that screen.

`features/public/settings/api.ts` fetches the record. `features/public/settings/queries.ts` supplies one `usePublicSiteSettingsQuery()` query key. A `PublicSiteSettingsProvider` resolves API data plus the `siteConfig` fallback and exposes a typed `usePublicSiteSettings()` hook. Navbar, Footer, StickySocials, and JsonLd consume this resolved hook. The provider is mounted inside the existing public client shell so it does not change route ownership or duplicate navigation.

The shell never disappears while settings load or fail. It renders the fallback configuration, then updates in place when valid API data arrives. An optional small non-blocking error boundary may be used only where it does not alter the existing header/footer layout.

## State and cache policy

All new public queries use the shared `shouldRetryPublicQuery` predicate and the existing public-query stale-time convention. Gallery lists can use a longer stale time than contact content because they are read-only lists; settings should be shared via a single cache key across shell consumers. No component may call `Promise.all` to make unrelated public sections block one another.

Every user-visible error, empty state, retry label, image alt fallback, and unavailable label comes from `next-intl`; locale is obtained from `useLocale`, never hardcoded.

## Backend responsibilities

The gallery routes require no new endpoint. Backend work is limited to confirming the public gallery response includes the URLs and localized fields consumed by the public DTOs.

For settings, add an idempotent migration that seeds the public-shell keys above from safe existing configuration where available, marks only them `is_public = true`, and keeps them in the `public-shell` category. The admin Settings screen must render this category. A missing key is valid and triggers frontend fallback. The endpoint must continue returning a successful empty object when no public settings are configured, not a server error.

For donation QR rendering, add an explicit optional field to the public Contact content contract only if an admin-managed QR/media URL is required. The frontend must not infer it from a bank account string.

## Non-goals

- Redesigning any public page or the navigation/sidebar.
- Moving page-specific CMS content into global settings.
- Changing admin screens beyond exposing/configuring the agreed public setting keys or the optional QR field.
- Introducing `any`, unsafe casts, hardcoded locale values, or fixture data in the public runtime path.

## Verification

- Type-check and lint the new API mappers, queries, and consumers.
- Production build passes.
- Manual browser checks: Gallery loading/error/empty/filter/lightbox; Donation with full, partial, and absent bank data; shell rendered with API values, malformed/missing settings, and settings request failure.
- Confirm Home continues to render Navbar and mobile navigation through the single public shell.
