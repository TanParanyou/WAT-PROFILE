# Public Client UX/UI Unification Implementation Plan

> **For agentic workers:** Execute one task at a time and review the rendered result at each checkpoint. Do not change API or CMS contracts while implementing this plan.

**Written against:** `eec5e866a145524d37662cf536ea11aa7c208cc2`

**Goal:** Bring every public route under `frontend/src/app/[locale]/(client)` into the same calm, image-led visual language as the restored homepage while preserving each page’s task, content ownership, CMS/API data flow, and multilingual behavior.

**Architecture:** Evolve the existing `PageHeader` and `PageContainer` owners into a small public-page shell with listing, detail/story, and reading variants. Page-specific components keep their existing queries and DTOs, then compose shared spacing, heading, metadata, action, and state patterns. Contact remains a purpose-built layout but adopts the same tokens and hierarchy; Privacy and Impressum share a narrow reading presentation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, next-intl, TanStack Query, Framer Motion, `PublicImage`.

## Global Constraints

- Preserve the approved homepage appearance; this plan changes the remaining public routes and shared owners only where needed by those routes.
- Keep `th`, `en`, and `de` complete and semantically equivalent.
- Preserve current API, query, DTO, CMS service, SEO, and fallback-data contracts.
- Components must not import mock JSON, Axios, or construct API URLs.
- Reuse `Faith Gold`, `Forest Calm`, clear white surfaces, and existing `font-heading`/`font-sans` tokens.
- Gold indicates navigation, selection, or action; it is not repeated decoration.
- Do not use the Thai-pattern background, gradient text, decorative glass, large soft shadows, or cards with radius above `16px`.
- Body copy remains within `65–75ch`.
- Focus indicators are at least `2px`; interactive targets are at least `44px`.
- Motion must preserve visible default content and respect `prefers-reduced-motion`.
- Verify Thai, English, and German at `375px`, `768px`, and `1440px`.
- Do not add dependencies.

---

## Evidence Chain

- **Surface:** All routes under `frontend/src/app/[locale]/(client)`.
- **Problem:** The restored homepage is image-led and warm, while interior routes currently split into three unrelated visual dialects: gold patterned `PageHeader` plus overlapping rounded cards, black/mono Contact, and heavy reading cards for legal pages.
- **Design evidence:** `PRODUCT.md`, `DESIGN.md`, the approved homepage composition in `frontend/src/components/home/*`, and the user’s explicit choice to preserve the homepage direction.
- **Owners:** `frontend/src/components/layout/PageHeader.tsx`, `PageContainer.tsx`, page-specific layouts under `frontend/src/components/public/website`, and public feature components under `frontend/src/features/public`.
- **Scope:** About, Events list/detail, Monks list/detail, Gallery, Contact, Privacy, and Impressum.
- **Uncertainty:** Actual CMS image coverage may differ by environment. Every image variant therefore requires a color fallback that keeps the same hierarchy.

## Design Decision

Use one public-page system with three content shapes:

1. **Listing:** Events, Monks, Gallery.
2. **Detail/Story:** Event detail, Monk detail, About.
3. **Reading:** Privacy, Impressum.

Contact uses the shared hero, container, type, color, action, and state rules but retains a dedicated information/form layout. Shared structure creates coherence; page-specific composition preserves task clarity.

## Reuse

- `PageHeader` and `PageContainer` remain the public shell owners.
- `PublicImage` owns remote image fallback behavior.
- `QueryErrorState`, `EmptyState`, and `PublicContentStateBoundary` remain state owners.
- `DetailNavigation` and `PageNavigation` remain navigation owners.
- `RichTextContent` remains the rich-text renderer.
- Existing query hooks, mappers, DTOs, metadata builders, and services remain unchanged.
- Visual exemplar: restored homepage components in `frontend/src/components/home`.

---

### Task 1: Establish the shared public-page shell

**Files:**

- Modify: `frontend/src/components/layout/PageHeader.tsx`
- Modify: `frontend/src/components/layout/PageContainer.tsx`
- Create: `frontend/src/components/public/layout/PublicSectionHeading.tsx`
- Modify: `frontend/src/app/globals.css` only if a reduced-motion utility is not already available

**Interfaces:**

- `PageHeader` consumes localized strings and an optional image.
- `PageHeader` produces `image`, `color`, and `reading` variants without fetching data.
- `PageContainer` produces `wide`, `content`, and `reading` widths with explicit opt-in overlap.
- `PublicSectionHeading` standardizes section title, description, and optional action.

- [ ] **Step 1: Add the explicit shell contracts**

Use these interfaces:

```tsx
type PageHeaderVariant = "image" | "color" | "reading";
type PageHeaderAlign = "left" | "center";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  variant?: PageHeaderVariant;
  align?: PageHeaderAlign;
  imageSrc?: string | null;
  imageAlt?: string;
}

type PageContainerWidth = "wide" | "content" | "reading";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  width?: PageContainerWidth;
  overlap?: boolean;
}
```

- [ ] **Step 2: Replace the patterned header with three deterministic variants**

Implement these rules:

```tsx
const heightClass = variant === "reading"
  ? "pb-12 pt-32 md:pb-16 md:pt-36"
  : "pb-16 pt-36 md:pb-20 md:pt-44";

const alignmentClass = align === "center"
  ? "mx-auto text-center"
  : "text-left";

const titleClass =
  "max-w-4xl font-heading text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.12] tracking-[-0.03em] text-balance";
```

- `image`: render `PublicImage` full bleed with `bg-black/55`; fall back to `bg-secondary-800`.
- `color`: render `bg-secondary-800` without pattern or gradient.
- `reading`: render a white surface, primary text, and a single top/bottom rule.
- Remove `/images/thai-pattern.png`, `drop-shadow`, and decorative overlay layers.
- Keep `children` visible below the subtitle without requiring motion.

- [ ] **Step 3: Make container overlap explicit**

Use this exact mapping:

```tsx
const widths: Record<PageContainerWidth, string> = {
  wide: "max-w-7xl",
  content: "max-w-6xl",
  reading: "max-w-3xl",
};

const overlapClass = overlap ? "-mt-10 md:-mt-12" : "";
```

Default to `width="wide"` and `overlap={false}`. Use `px-4 sm:px-6 lg:px-8` and `pb-20 pt-12 md:pb-28 md:pt-16`.

- [ ] **Step 4: Add the shared section-heading owner**

Create:

```tsx
interface PublicSectionHeadingProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
}
```

Render one semantic heading, optional description capped at `max-w-[65ch]`, and optional action. Do not add an eyebrow prop; repeated uppercase kickers are not part of this system.

- [ ] **Step 5: Verify the shared owner in isolation**

Run:

```bash
cd frontend
npx eslint src/components/layout/PageHeader.tsx src/components/layout/PageContainer.tsx src/components/public/layout/PublicSectionHeading.tsx
./node_modules/.bin/tsc --noEmit
```

Expected: no errors in the three touched components and TypeScript exits `0`.

- [ ] **Step 6: Commit the shell**

```bash
git add frontend/src/components/layout/PageHeader.tsx frontend/src/components/layout/PageContainer.tsx frontend/src/components/public/layout/PublicSectionHeading.tsx frontend/src/app/globals.css
git commit -m "feat(public): unify interior page shell"
```

---

### Task 2: Align listing pages—Events, Monks, and Gallery

**Files:**

- Modify: `frontend/src/app/[locale]/(client)/events/EventsContent.tsx`
- Modify: `frontend/src/features/public/events/components/EventsList.tsx`
- Modify: `frontend/src/features/public/events/components/SchedulesSection.tsx`
- Modify: `frontend/src/features/public/events/components/EventsListSkeleton.tsx`
- Modify: `frontend/src/app/[locale]/(client)/monks/MonksContent.tsx`
- Modify: `frontend/src/features/public/monks/components/MonksGrid.tsx`
- Modify: `frontend/src/features/public/monks/components/MonksGridSkeleton.tsx`
- Modify: `frontend/src/app/[locale]/(client)/gallery/GalleryContent.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**

- Consumes the Task 1 shell and existing public queries.
- Preserves `EventsList`, `SchedulesSection`, and `MonksGrid` props.
- Produces coherent listing layouts without introducing a generic card component.

- [ ] **Step 1: Restructure Events around visitor decisions**

- Use `PageHeader variant="color" align="left"`.
- Put the recurring schedule first under a shared section heading.
- Put upcoming events second with the refreshing status adjacent to its heading.
- Remove outer `rounded-3xl` wrapper cards. Sections use spacing and a top rule; nested schedule groups may use `rounded-2xl` only when they represent distinct schedule types.
- Preserve independent loading, error, and empty states for schedules and events.

The page composition should follow:

```tsx
<PageHeader variant="color" align="left" title={...} subtitle={...} />
<PageContainer width="content">
  <section aria-labelledby="schedule-heading">...</section>
  <section className="mt-20" aria-labelledby="events-heading">...</section>
</PageContainer>
```

- [ ] **Step 2: Make event rows faster to scan**

For `EventsList`, use a responsive horizontal composition at `md`:

```tsx
<article className="grid overflow-hidden rounded-2xl border border-primary/10 bg-white md:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]">
```

- Image remains first and uses `PublicImage`.
- Date, time, and location form one metadata group.
- Title and description remain the primary reading group.
- One Faith Gold action links to the detail route.
- No large hover shadow; use border-color and image scale only.

- [ ] **Step 3: Simplify recurring schedules**

- Keep daily, weekly, and online as meaningful groups.
- Use the same typography and border treatment across all three.
- Keep blue only for the functional online state; do not let it become a separate visual system.
- Empty groups do not render a blank card.
- Time values remain tabular/mono only where the characters need alignment.

- [ ] **Step 4: Make Monks calm and portrait-led**

- Use `PageHeader variant="color" align="left"`.
- Keep the three-column portrait grid.
- Change resting cards to `rounded-2xl border border-primary/10 bg-white` with no large shadow.
- Place role above name only when role exists.
- Make the entire card keyboard-focusable with a visible `focus-visible` ring.
- Preserve API image fallbacks and existing list-item DTOs.

- [ ] **Step 5: Make Gallery image-first and touch-safe**

- Use `PageHeader variant="image"` when a CMS/first-gallery image is available; otherwise use `color`.
- Remove the outer white `rounded-3xl shadow-xl` container.
- Render category controls in a horizontally scrollable `aria-label` group on narrow screens.
- Selected filter: Faith Gold background, white text, `aria-pressed="true"`.
- Unselected filter: transparent/white surface with a visible border.
- Every filter target is at least `44px`.
- Captions render below images on touch/small screens and may overlay on pointer-hover at `lg`.
- Lightbox buttons retain focus and Escape behavior from the existing library.
- Animation uses opacity/transform only and becomes instant under reduced motion.

- [ ] **Step 6: Keep translated labels complete**

Add only labels needed by the new section hierarchy or accessible filter group. Add identical keys to `th`, `en`, and `de`; do not move data-owned text into message files.

- [ ] **Step 7: Verify listing routes**

Run:

```bash
cd frontend
npx eslint \
  'src/app/[locale]/(client)/events/EventsContent.tsx' \
  'src/app/[locale]/(client)/monks/MonksContent.tsx' \
  'src/app/[locale]/(client)/gallery/GalleryContent.tsx' \
  src/features/public/events/components/EventsList.tsx \
  src/features/public/events/components/SchedulesSection.tsx \
  src/features/public/monks/components/MonksGrid.tsx
./node_modules/.bin/tsc --noEmit
```

Manual matrix:

- `/th/events`, `/en/events`, `/de/events`
- `/th/monks`, `/en/monks`, `/de/monks`
- `/th/gallery`, `/en/gallery`, `/de/gallery`
- Widths: `375`, `768`, `1440`
- States: loading, data, empty, error, active gallery filter, open lightbox

- [ ] **Step 8: Commit listing pages**

```bash
git add frontend/src/app/'[locale]'/'(client)'/events frontend/src/app/'[locale]'/'(client)'/monks frontend/src/app/'[locale]'/'(client)'/gallery frontend/src/features/public/events/components frontend/src/features/public/monks/components frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json
git commit -m "feat(public): align listing page experience"
```

---

### Task 3: Align Event and Monk detail journeys

**Files:**

- Modify: `frontend/src/app/[locale]/(client)/events/[slug]/page.tsx`
- Modify: `frontend/src/features/public/events/components/EventDetailContent.tsx`
- Modify: `frontend/src/features/public/events/components/EventDetailSkeleton.tsx`
- Modify: `frontend/src/app/[locale]/(client)/monks/[slug]/page.tsx`
- Modify: `frontend/src/features/public/monks/components/MonkDetailContent.tsx`
- Modify: `frontend/src/features/public/monks/components/MonkDetailSkeleton.tsx`
- Modify: `frontend/src/components/common/DetailNavigation.tsx`
- Modify: `frontend/src/components/common/PageBreadcrumbs.tsx`

**Interfaces:**

- Consumes existing SSR initial data and query hydration.
- Uses `PageHeader imageSrc` when detail data contains an image.
- Preserves printer, share, map, calendar, breadcrumbs, rich text, JSON-LD, and not-found behavior.

- [ ] **Step 1: Put detail identity in the hero**

- Event detail: use the event image, title, location, and date in `PageHeader variant="image"`.
- Monk detail: use `variant="color"` so the portrait remains a deliberate content object rather than a cropped hero background.
- Replace glass metadata pills with plain high-contrast inline metadata separated by rules or spacing.
- Do not repeat the detail title as another large heading immediately below the hero.

- [ ] **Step 2: Reduce DetailNavigation to navigation**

Use:

```tsx
<div className="mb-8 flex flex-col gap-3 border-b border-primary/15 pb-5 md:flex-row md:items-end md:justify-between">
```

- Remove backdrop blur, rounded card, and shadow.
- Keep locale-aware links.
- Add visible focus state to breadcrumb and back links.
- Keep optional actions on the right without changing their owner.

- [ ] **Step 3: Reorder Event detail around action**

Use this reading order:

1. Hero: title, date, location.
2. Primary facts: date range, time, location.
3. Actions: map, add to calendar, print, share.
4. Description.
5. Schedule.

Buttons share a `44px` minimum height. Map is the primary action only when `map_url` exists; calendar, print, and share remain secondary. Schedule rows use a two-column time/activity layout at `md` and one column on mobile.

- [ ] **Step 4: Simplify Monk detail**

- Portrait column remains sticky only on `lg`.
- Use a `rounded-2xl` portrait surface with a thin border and resting shadow at most.
- Remove the decorative Quote icon and thick colored divider from biography.
- Use one biography heading and continuous rich text capped at `75ch`.
- Role remains adjacent to the portrait and is hidden when absent rather than showing `-`.

- [ ] **Step 5: Verify detail routes**

Run:

```bash
cd frontend
npx eslint \
  'src/app/[locale]/(client)/events/[slug]/page.tsx' \
  'src/app/[locale]/(client)/monks/[slug]/page.tsx' \
  src/features/public/events/components/EventDetailContent.tsx \
  src/features/public/monks/components/MonkDetailContent.tsx \
  src/components/common/DetailNavigation.tsx \
  src/components/common/PageBreadcrumbs.tsx
./node_modules/.bin/tsc --noEmit
```

Manual checks:

- One valid and one missing slug for Events and Monks.
- Long German title, multi-line Thai title, missing image, missing role, missing schedule, and missing map URL.
- Keyboard order: breadcrumbs → back → actions → main content.

- [ ] **Step 6: Commit detail journeys**

```bash
git add frontend/src/app/'[locale]'/'(client)'/events/'[slug]' frontend/src/app/'[locale]'/'(client)'/monks/'[slug]' frontend/src/features/public/events/components frontend/src/features/public/monks/components frontend/src/components/common/DetailNavigation.tsx frontend/src/components/common/PageBreadcrumbs.tsx
git commit -m "feat(public): align detail page journeys"
```

---

### Task 4: Turn About into a paced narrative page

**Files:**

- Modify: `frontend/src/components/public/website/PublicAboutPageLayout.tsx`
- Modify: `frontend/src/app/[locale]/(client)/about/AboutContent.tsx`
- Modify: `frontend/src/components/layout/PageNavigation.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**

- Preserves `AboutContentFormData`, `RichTextContent`, `usePublicMonksQuery`, and `MonksGrid`.
- `PageNavigation` keeps the current `items: { id; label }[]` contract.

- [ ] **Step 1: Use one story flow instead of six matching cards**

- Use `PageHeader variant="color" align="left"` unless a reliable About image is exposed by the existing typed model.
- Use `PageContainer width="wide"`.
- Keep the section order: intro → objective → administration → history → buildings → sangha.
- Alternate plain white, soft gold wash, and image/content sections through background and spacing, not repeated card wrappers.
- Remove the thick left stripe from Objective and the oversized decorative Quote.
- Use one section heading scale and body width across narrative sections.

- [ ] **Step 2: Make section navigation adaptive**

- Desktop: a simple sticky contents list with an active Faith Gold text/rule treatment.
- Mobile/tablet: horizontal scroll controls with `44px` targets.
- Remove the hard-coded English “Contents”; add `AboutPage.contents` in all three locales.
- Use native `element.scrollIntoView({ behavior: "smooth", block: "start" })`.
- Under reduced motion, use `behavior: "auto"`.
- Each section keeps `scroll-mt-28`.

- [ ] **Step 3: Give Buildings and Sangha their own evidence**

- Buildings remain an ordered list because the order is content data, but use compact numeric markers rather than large icon-like tiles.
- Sangha mission reads as prose first; monk portraits follow under a clear section heading.
- Keep `MonksGrid` as the shared monk listing owner.
- Do not render an empty section when a whole CMS group has no content.

- [ ] **Step 4: Verify About**

Run:

```bash
cd frontend
npx eslint 'src/app/[locale]/(client)/about/AboutContent.tsx' src/components/public/website/PublicAboutPageLayout.tsx src/components/layout/PageNavigation.tsx
./node_modules/.bin/tsc --noEmit
```

Manual checks:

- `/th/about`, `/en/about`, `/de/about`.
- Section navigation active state while scrolling.
- Keyboard activation and focus visibility.
- Long content, empty building items, no monks, and 200% zoom.

- [ ] **Step 5: Commit About**

```bash
git add frontend/src/app/'[locale]'/'(client)'/about frontend/src/components/public/website/PublicAboutPageLayout.tsx frontend/src/components/layout/PageNavigation.tsx frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json
git commit -m "feat(public): reshape about page narrative"
```

---

### Task 5: Reframe Contact as visit planning plus communication

**Files:**

- Modify: `frontend/src/components/public/website/PublicContactPageLayout.tsx`
- Modify: `frontend/src/app/[locale]/(client)/contact/ContactContent.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**

- Preserve `PublicContactPageLayoutProps`, `ContactContentFormData`, `formSlot`, `sendContactEmail`, CMS fallback construction, and contact query.
- Page layout stays presentation-only; form behavior remains in `ContactContent`.

- [ ] **Step 1: Replace the black/mono visual dialect**

- Use `PageHeader variant="color" align="left"` with localized title and description.
- Remove default `font-mono` from eyebrows, contact values, bank labels, and the hero.
- Mono remains only for IBAN/BIC where character recognition benefits.
- Use the shared primary, secondary, surface, and text tokens.
- Remove repeated uppercase tracked labels.

- [ ] **Step 2: Order information by the visitor’s likely task**

Desktop:

```text
Visit essentials (address, hours, transport) | Contact form
Map + directions (full width)
Social and bank details (secondary)
```

Mobile:

```text
Visit essentials
Map + directions
Contact form
Social and bank details
```

- Address, phone, and email become actionable links where values exist.
- Directions is the primary action in the visit block.
- Bank details remain present but visually secondary to visiting and contacting.
- Hide empty groups; do not leave blank bordered rows.

- [ ] **Step 3: Align the form and its status feedback**

Use this field contract:

```tsx
const fieldClass =
  "mt-2 min-h-11 w-full rounded-lg border border-primary/20 bg-white px-3 py-2.5 text-base text-text-900 outline-none transition-colors placeholder:text-text-600 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";
```

- Add `required` to all four fields.
- Give the error block `id="contact-form-error"` and `role="alert"`.
- Set `aria-describedby={status === "error" ? "contact-form-error" : undefined}` on the form.
- Error feedback uses `role="alert"`.
- Success feedback uses `role="status"` and `aria-live="polite"`.
- Submit target is at least `44px`, uses Faith Gold, and retains disabled/loading states.
- Keep the privacy link locale-aware.

- [ ] **Step 4: Verify Contact**

Run:

```bash
cd frontend
npx eslint 'src/app/[locale]/(client)/contact/ContactContent.tsx' src/components/public/website/PublicContactPageLayout.tsx
./node_modules/.bin/tsc --noEmit
```

Manual checks:

- `/th/contact`, `/en/contact`, `/de/contact`.
- Valid submit, required error, invalid email, service error, and success.
- Missing map, missing transport, disabled form, missing bank, and no social links.
- Keyboard traversal and 200% zoom.

- [ ] **Step 5: Commit Contact**

```bash
git add frontend/src/app/'[locale]'/'(client)'/contact frontend/src/components/public/website/PublicContactPageLayout.tsx frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json
git commit -m "feat(public): align visit and contact experience"
```

---

### Task 6: Give Privacy and Impressum one reading system

**Files:**

- Create: `frontend/src/components/public/layout/PublicReadingPage.tsx`
- Modify: `frontend/src/app/[locale]/(client)/privacy/PrivacyContent.tsx`
- Modify: `frontend/src/app/[locale]/(client)/impressum/ImpressumContent.tsx`

**Interfaces:**

- `PublicReadingPage` owns reading width and header composition only.
- Existing content queries, rich text, localized values, loading/error/not-found handling remain with route content components.

- [ ] **Step 1: Add the reading layout**

Use:

```tsx
interface PublicReadingPageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PublicReadingPage({ title, subtitle, children }: PublicReadingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader variant="reading" align="left" title={title} subtitle={subtitle} />
      <PageContainer width="reading">
        <article className="prose prose-lg max-w-none">{children}</article>
      </PageContainer>
    </div>
  );
}
```

- No outer shadow, giant card, or negative overlap.
- Body measure stays within the reading container.
- Headings, lists, links, and tables receive visible hierarchy and focus states.

- [ ] **Step 2: Migrate Privacy**

- Keep `lastUpdated` in the reading hero subtitle.
- Keep `RichTextContent` and `PublicContentStateBoundary`.
- Loading skeleton matches text lines rather than one rounded rectangle.
- Verify date output for all three locales.

- [ ] **Step 3: Migrate Impressum**

- Keep conditional sections and their current labels.
- Remove decorative icons from every heading; use icons only if they communicate a unique content type.
- Phone and email become actionable links.
- Registration identifiers preserve readable wrapping.
- Use section dividers, not card/shadow repetition.

- [ ] **Step 4: Verify legal routes**

Run:

```bash
cd frontend
npx eslint 'src/app/[locale]/(client)/privacy/PrivacyContent.tsx' 'src/app/[locale]/(client)/impressum/ImpressumContent.tsx' src/components/public/layout/PublicReadingPage.tsx
./node_modules/.bin/tsc --noEmit
```

Manual checks:

- `/th/privacy`, `/en/privacy`, `/de/privacy`.
- `/th/impressum`, `/en/impressum`, `/de/impressum`.
- Long rich text, lists, links, missing fields, loading, not found, and 200% zoom.

- [ ] **Step 5: Commit reading pages**

```bash
git add frontend/src/app/'[locale]'/'(client)'/privacy frontend/src/app/'[locale]'/'(client)'/impressum frontend/src/components/public/layout/PublicReadingPage.tsx
git commit -m "feat(public): unify legal reading pages"
```

---

### Task 7: Cross-route consistency, accessibility, and release verification

**Files:**

- Verify/modify only when a failure is observed:
  - `frontend/src/components/layout/Navbar.tsx`
  - `frontend/src/components/layout/Footer.tsx`
  - `frontend/src/components/layout/StickySocials.tsx`
  - `frontend/src/components/layout/CookieConsent.tsx`
  - `frontend/src/components/public/states/EmptyState.tsx`
  - `frontend/src/components/public/states/QueryErrorState.tsx`
  - `frontend/src/messages/th.json`
  - `frontend/src/messages/en.json`
  - `frontend/src/messages/de.json`
- Update after acceptance: `DESIGN.md`

**Interfaces:**

- No new behavior or API owner.
- This task validates the complete public route family and fixes only verified presentation regressions.

- [ ] **Step 1: Run targeted lint for the complete public surface**

```bash
cd frontend
npx eslint \
  'src/app/[locale]/(client)/**/*.{ts,tsx}' \
  src/components/layout/PageHeader.tsx \
  src/components/layout/PageContainer.tsx \
  src/components/layout/PageNavigation.tsx \
  src/components/common/DetailNavigation.tsx \
  src/components/public/layout \
  src/components/public/website \
  src/features/public/events/components \
  src/features/public/monks/components
```

Expected: no errors in the scoped files. Repository-wide lint may still report pre-existing failures outside this surface; do not widen this project to fix them.

- [ ] **Step 2: Run type-check and production build**

```bash
cd frontend
./node_modules/.bin/tsc --noEmit
npm run build
```

Expected: both commands exit `0`.

- [ ] **Step 3: Run the route matrix**

For each locale `th`, `en`, and `de`, verify:

- `/`
- `/about`
- `/events`
- `/events/<valid-slug>`
- `/monks`
- `/monks/<valid-slug>`
- `/gallery`
- `/contact`
- `/privacy`
- `/impressum`

At `375px`, `768px`, and `1440px`, confirm:

- Navbar does not cover hero content.
- Exactly one `h1` exists.
- No horizontal scrolling occurs at 200% zoom.
- German labels wrap without clipping.
- Thai headings maintain readable line height.
- Primary actions are visually consistent.
- Focus is visible and follows reading order.
- Touch targets are at least `44px`.
- Loading, empty, error, and success states retain layout hierarchy.
- Reduced-motion mode removes nonessential movement.
- Gallery captions remain available without hover.

- [ ] **Step 4: Record the accepted system**

After the implementation is visually accepted, update `DESIGN.md` with:

- The three public page shapes: Listing, Detail/Story, Reading.
- `PageHeader` variants and when to use each.
- `PageContainer` widths and explicit overlap rule.
- Contact’s visit-first information hierarchy.
- Gallery’s non-hover caption rule.
- Legal-page reading measure.

Do not document implementation details or file paths as design principles.

- [ ] **Step 5: Commit verified cleanup and design documentation**

```bash
git add DESIGN.md
git commit -m "docs(public): record unified page system"
```

If the route matrix reveals a source defect, return it to the owning task above, run that task’s checks, and amend that task before this documentation commit. Do not stage `.impeccable/critique/`, `.next/`, or unrelated user changes.

---

## Validation Summary

- **Product:** Visitors can identify the page purpose, find the next action, and move from information to visiting/contacting without encountering a new visual language on each route.
- **Interface:** All ten public route shapes pass multilingual mobile/tablet/desktop review, keyboard navigation, 200% zoom, and state coverage.
- **System:** Shared shell owners are reused; page-specific layouts remain responsible for domain composition; no parallel data path or generic page builder is introduced.
- **Repository:** Targeted ESLint, TypeScript, and `npm run build` pass. Existing repository-wide lint failures outside the selected public surface are reported, not absorbed into this scope.

## Stop Conditions

- Stop if implementing a hero image requires adding an untyped field or bypassing the public service/query boundary.
- Stop if a page’s CMS schema cannot express the approved content order without an API or migration change; split that cross-boundary change into a separate plan.
- Stop if a shared shell change alters the approved homepage appearance.
- Stop if a proposed shared primitive needs page-specific domain data; keep that composition with the owning page instead.
- Stop if current source no longer matches commit `eec5e866a145524d37662cf536ea11aa7c208cc2`; recheck affected paths before implementation.

## Design Documentation

After implementation acceptance, record only the durable public-page system decisions listed in Task 7 in `DESIGN.md`. Do not treat this plan, generated critiques, or screenshots as the source of truth.
