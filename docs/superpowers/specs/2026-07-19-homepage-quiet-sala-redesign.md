# Homepage Quiet Sala Redesign

## Goal

Turn the public homepage into a flagship, production-ready journey that helps Thai, English, and German visitors trust Wat Loung Por Sai, understand its practice, discover current events, plan a visit, and only then choose to support the temple.

## Approved Direction

**Quiet Sala — Guided Documentary** preserves the calm, image-led hero while replacing the generic card-template rhythm below it with verified temple imagery, practical visitor guidance, and clearer pacing. The page should feel like entering an open sala: one clear threshold, progressively revealed context, and an obvious next step.

The alternative approaches were rejected:

- **Conservative repair** would fix defects but preserve the generic three-card structure.
- **Full documentary** would require broader CMS and content-model changes than this homepage pass needs.

## Product Journey

The homepage will follow this order:

1. **Discover:** Hero establishes the temple's purpose and location.
2. **Understand:** Welcome section explains the forest-tradition practice and shows a verified project photograph.
3. **Participate:** Upcoming events provide the first concrete action.
4. **Prepare:** A new visit section exposes the temple address and routes visitors to complete travel/contact details.
5. **Support:** Donation remains available but visually quieter and later in the journey.

This sequence implements the trust path in `PRODUCT.md`: credible identity, open welcome, real participation, practical preparation, then support.

## Visual System

### Composition

- Keep the full-bleed hero photograph and centered focal point.
- Replace `h-screen` with a small-viewport-safe minimum height so browser chrome and cookie consent cannot crowd the CTA.
- Use an asymmetric two-column Welcome section: one verified photograph from `public/images/gallery/common/` paired with concise copy and three lightweight practice themes. These themes are text rows, not identical cards.
- Keep Events as a card grid because each event is a genuinely separate, actionable object.
- Add a Visit section with a restrained forest-green surface, the localized address, and two explicit actions: plan the visit and contact the temple.
- Reduce Donation's visual weight through a narrower introduction, 12–16px radii, and flatter payment surfaces.

### Imagery

- Preserve `/images/hero-bg.png` for this scoped pass because its composition already supports the hero hierarchy.
- Use a verified, project-owned photograph such as `/images/gallery/common/LINE_ALBUM_1262026_260208_10.jpg` in Welcome. Do not use the stylized `gallery/1.png` image as documentary proof.
- Keep event images sourced from event data with the existing public fallback behavior.

### Typography and Color

- Keep Faith Gold for primary actions only and Forest Calm for the visit section.
- Keep one `h1` in the hero. All section titles become `h2`; card/item titles remain `h3`.
- Apply balanced wrapping to headings and pretty wrapping to paragraphs.
- Remove repeated uppercase/tracked kickers. A single short welcome line in the hero may remain, without aggressive tracking.
- Keep body copy within 65–75 characters where practical.

### Motion

- Keep one restrained hero entrance and limited event/image motion.
- Remove the repeated fade-up reflex from every section.
- Use `useReducedMotion` for all Framer Motion branches. Content must remain visible when motion is reduced or unavailable.
- Remove the infinite scroll-indicator loop for reduced-motion users and pause it outside the hero viewport.
- Interaction feedback stays at or below 200ms and uses opacity/transform only.

## Content Design

### Hero

- Primary action remains the localized events CTA.
- Add the localized secondary action “วางแผนการเดินทางมาวัด” / “Plan your visit” / “Besuch planen”, linking to `/contact`.
- Replace the repeated temple name in the supporting paragraph with the localized promise:
  - TH: `พื้นที่แห่งการปฏิบัติ เพื่อความสงบและความสุขที่แท้จริง`
  - EN: `A place of practice for genuine peace and lasting well-being.`
  - DE: `Ein Ort der Praxis für echten Frieden und nachhaltiges Wohlbefinden.`

### Welcome

- Correct the Thai location from Saraburi to Biebergemünd, Germany.
- Explain that the temple welcomes experienced practitioners and newcomers.
- Retain three themes—meditation practice, Buddhist learning, and community traditions—but present them as a compact semantic list without emoji or card containers.

### Events

- Localize the subtitle fully in TH/EN/DE.
- Add a visible “view all” action after or beside the section heading.
- Avoid duplicating an event title over its image and again as the card heading; retain the semantic card heading.

### Visit

- Read the localized address from `PublicSiteSettingsProvider` so CMS/fallback settings remain the source of truth.
- Provide `/contact` actions rather than inventing opening times or transport details that are not available in the current public settings model.
- Add localized copy explaining that the contact page contains directions and preparation details.

### Donation

- Localize the Thai subtitle instead of showing English.
- Explain channel suitability without implying that a Thai QR channel is appropriate for every visitor.
- Preserve loading, error, empty, bank-transfer, and QR states.

## Component Architecture

### Composition

`HomeContent.tsx` remains the page orchestrator and renders:

1. `HeroSection`
2. `WelcomeSection`
3. `EventsSection`
4. new `VisitSection`
5. `DonationSection`
6. `EventAlertModal`

### New Unit

`frontend/src/components/home/VisitSection.tsx`

- Consumes `usePublicSiteSettings`, `useLocale`, and `useTranslations`.
- Reads the localized address through `getLocalizedText`.
- Produces a semantic section with address, `/contact` visit CTA, and `/contact` contact CTA.
- Renders a useful localized fallback sentence if the address is temporarily empty.

### Dialog Behavior

Create `frontend/src/components/ui/AccessibleDialog.tsx` around the native `<dialog>` element rather than adding a dependency or duplicating keyboard behavior.

- Inputs: `isOpen`, `onClose`, accessible `title`, optional `description`, `children`, and size/class hooks.
- Calls `showModal()` when opened and `close()` when closed.
- Handles native Escape/cancel, backdrop dismissal, initial focus, body scroll locking, and focus restoration.
- Exposes `aria-labelledby` and `aria-describedby` through generated IDs.
- Used by both the event alert and donation QR dialogs.

### Logo Resilience

- Change `siteConfig.logo.light` and `.dark` to the existing `/images/icon/logo.png` asset.
- Make Navbar fall back to this asset when a CMS-provided URL fails.
- Localize accessible names for theme, language, and mobile menu controls.

## Data and State

- Existing TanStack Query hooks remain the only source for public home, event, alert, contact, and settings data.
- No new client fetches, state library, or API endpoints are introduced.
- Event alert dismissal continues to use its existing time-bound local-storage key.
- Dialog state remains local to its owning feature.
- Translation JSON remains the source for all new user-facing copy in TH/EN/DE.

## Error and Edge Cases

- Missing CMS hero fields continue to fall back to localized static messages.
- Missing/invalid logo URLs fall back once to `/images/icon/logo.png`, never to a broken-image marker.
- Empty event, donation, address, and image states retain useful copy and an actionable next step.
- German compound words and long CMS titles must wrap without horizontal overflow at 320px.
- Both dialogs close through their close button, Escape, and backdrop, and restore focus to the trigger.
- Page content remains visible with JavaScript motion disabled or `prefers-reduced-motion: reduce` enabled.

## Accessibility Requirements

- Exactly one `h1` on the page.
- Every icon-only button has a localized accessible name.
- Decorative Lucide icons and purely decorative imagery are hidden from assistive technology.
- Dialogs use native modal semantics, have names/descriptions, trap focus natively, and restore focus.
- Focus indicators remain visible on all links and buttons.
- Touch targets are at least 44×44 CSS pixels where the control is icon-only.
- Body text reaches WCAG 2.2 AA contrast in light and dark themes.
- Loading regions expose an appropriate status or busy state.

## Verification

No new testing library will be added. Verification uses the repository's existing tools:

1. `npm run lint` in `frontend` for static React/TypeScript checks.
2. `npm run build` in `frontend` for production compilation and route generation.
3. Impeccable detector over the homepage and home components.
4. Browser inspection at 390×844, 768×1024, and 1280×720 in TH, EN, and DE.
5. Keyboard walkthrough of navigation, both dialogs, primary/secondary CTAs, and cookie consent.
6. Browser checks for one `h1`, no broken images, no horizontal overflow, and no console errors.
7. Reduced-motion inspection to confirm visible static content and absence of looping motion.

## Commit Boundaries

Work must not land as one commit:

1. `docs(home): define quiet sala homepage redesign`
2. `fix(home): restore trusted localized content and branding`
3. `feat(home): guide visitors from discovery to arrival`
4. `fix(a11y): make homepage motion and dialogs accessible`
5. `style(home): polish responsive homepage presentation` only if final browser inspection finds isolated visual corrections that do not belong in commits 2–4.

Each implementation commit must pass targeted lint before the next begins. The final branch state must pass the full frontend build and browser verification.
