# Two Additional Client Theme Mocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Aesop-inspired and Anthropic-editorial client theme mocks to the existing theme picker.

**Architecture:** Keep the prototype shell and shared `PrototypeContent` data unchanged. Add two independent presentational React components with CSS modules, then extend the typed registry, keyboard ordering, and contract test from five to seven variants.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Node test runner, ESLint.

## Global Constraints

- Keep all implementation inside `frontend/src/app/[locale]/prototypes/client-theme-exploration`.
- Reuse `PrototypeContent` and its current real image paths; do not add APIs, CMS fields, fonts, dependencies, or copied reference-brand marks.
- Retain Thai prototype copy, accessible semantic landmarks, visible focus styles, and reduced-motion fallbacks.
- Desktop and mobile layouts must not overflow horizontally.
- Preserve existing variants and leave the current default selection unchanged.
- Avoid gradients, decorative shadows, excessive rounding, and generic repeated card grids.

---

### Task 1: Register two typed picker options

**Files:**
- Modify: `frontend/src/app/[locale]/prototypes/client-theme-exploration/prototype-data.ts`
- Modify: `frontend/src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts`
- Modify: `frontend/src/app/[locale]/prototypes/client-theme-exploration/ThemeExploration.tsx`

**Interfaces:**
- Consumes: `ThemeVariantKey`, `THEME_VARIANTS`, `PROTOTYPE_CONTENT`.
- Produces: keys `apothecary` and `journal`, both selectable by `ThemePicker` and keyboard arrows.

- [ ] **Step 1: Write the failing registry assertion**

```ts
assert.deepEqual(
  THEME_VARIANTS.map(({ key }) => key),
  ["forest", "community", "practice", "minimal", "monochrome", "apothecary", "journal"],
);
assert.equal(new Set(THEME_VARIANTS.map(({ key }) => key)).size, 7);
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `cd frontend && node --experimental-strip-types './src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts'`

Expected: `AssertionError` because the registry still exposes five variants.

- [ ] **Step 3: Extend the typed registry and renderer**

```ts
export type ThemeVariantKey =
  | "forest" | "community" | "practice" | "minimal" | "monochrome"
  | "apothecary" | "journal";

export const THEME_VARIANTS = [
  // existing variants
  { key: "apothecary", name: "ทะเบียนศาลา", axis: "Apothecary" },
  { key: "journal", name: "บันทึกภาวนา", axis: "Editorial" },
] as const satisfies readonly ThemeVariant[];
```

Add both keys to `variantKeys`, import each new component, and add their two `switch` branches in `ThemeExploration`.

- [ ] **Step 4: Re-run the focused test**

Run: `cd frontend && node --experimental-strip-types './src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts'`

Expected: four passing subtests, with the first asserting seven unique keys.

### Task 2: Build the Aesop-inspired “ทะเบียนศาลา” variant

**Files:**
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/ApothecaryRegister.tsx`
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/apothecary-register.module.css`

**Interfaces:**
- Consumes: `{ content: PrototypeContent }`.
- Produces: `ApothecaryRegister`, a self-contained article rooted at `#apothecary-top`.

- [ ] **Step 1: Create the semantic component**

```tsx
export default function ApothecaryRegister({ content }: { content: PrototypeContent }) {
  return (
    <article className={styles.page}>
      <header className={styles.nav}>...</header>
      <section id="apothecary-top" className={styles.hero}>...</section>
      <section id="apothecary-story" className={styles.statement}>...</section>
      <section id="apothecary-events" className={styles.events}>
        {content.events.map((event) => <article key={event.title}>...</article>)}
      </section>
      <section id="apothecary-visit" className={styles.visit}>...</section>
      <footer className={styles.footer}>...</footer>
    </article>
  );
}
```

Use the existing hero, story, visit, and event images; use `time`, headings, links, and descriptive image alt text. Keep three event entries as ruled rows rather than cards.

- [ ] **Step 2: Add the Aesop-derived CSS system**

```css
.page { background: #fffef2; color: #333; font-family: var(--prototype-font-community); }
.page :is(button, a) { border-radius: 0; }
.eventRow { border-top: 1px solid #333; }
.statement h2 { font-family: var(--prototype-font-forest); }
@media (max-width: 767px) { .hero, .eventRow, .visit { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto; transition: none; } }
```

Use warm graphite rules, one sparse terracotta detail, zero corner radius, no shadow, and image-led warmth.

- [ ] **Step 3: Verify the variant in the browser**

Select the “ทะเบียนศาลา” radio on `http://localhost:3000/th/prototypes/client-theme-exploration` and inspect 1440px and 390px viewports.

Expected: natural-colour images, rule-led event register, no horizontal overflow, and accessible links/buttons.

### Task 3: Build the Anthropic-inspired “บันทึกภาวนา” variant

**Files:**
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/PracticeJournal.tsx`
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/practice-journal.module.css`

**Interfaces:**
- Consumes: `{ content: PrototypeContent }`.
- Produces: `PracticeJournal`, a self-contained article rooted at `#journal-top`.

- [ ] **Step 1: Create the semantic component**

```tsx
export default function PracticeJournal({ content }: { content: PrototypeContent }) {
  return (
    <article className={styles.page}>
      <header className={styles.nav}>...</header>
      <section id="journal-top" className={styles.hero}>...</section>
      <section id="journal-story" className={styles.manifesto}>...</section>
      <section id="journal-events" className={styles.events}>
        {content.events.map((event, index) => <article data-tone={index}>...</article>)}
      </section>
      <section id="journal-visit" className={styles.visit}>...</section>
      <footer className={styles.footer}>...</footer>
    </article>
  );
}
```

Keep the events semantically equal while varying their composition through `data-tone`; do not use copied Anthropic wording or marks.

- [ ] **Step 2: Add the editorial CSS system**

```css
.page { background: #faf9f5; color: #141413; }
.manifesto, .footer { background: #000; color: #faf9f5; }
.event[data-tone="0"] { background: #d97757; }
.event[data-tone="1"] { background: #6a9bcc; }
.event[data-tone="2"] { background: #bcd1ca; }
.manifesto h2, .visit h2 { font-family: var(--prototype-font-forest); }
.hero h1 { font-family: var(--prototype-font-community); text-wrap: balance; }
```

Use cream/black pacing and muted colour surfaces without gradients, shadows, or repeated same-sized cards. Limit hero type to `clamp(..., 6rem)` or less and add a mobile single-column breakpoint plus reduced-motion fallback.

- [ ] **Step 3: Verify the variant in the browser**

Select “บันทึกภาวนา” at desktop and mobile viewports.

Expected: cream/black editorial rhythm, three visibly distinct muted event treatments, readable contrast, and no overflow.

### Task 4: Validate the combined prototype surface

**Files:**
- Modify if required by verification: the files from Tasks 1–3 only.

**Interfaces:**
- Consumes: all seven registered variants.
- Produces: a verified seven-option prototype route.

- [ ] **Step 1: Run static verification**

Run:

```bash
cd frontend
node --experimental-strip-types './src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts'
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint -- 'src/app/[locale]/prototypes/client-theme-exploration'
```

Expected: four test passes, TypeScript exit code 0, ESLint exit code 0; document existing prototype `<img>` warnings if present.

- [ ] **Step 2: Inspect browser behaviour**

Verify both new radio labels exist exactly once, each can be selected, ArrowLeft/ArrowRight reaches the new variants, browser console has no errors, and 390px/1440px layouts have no horizontal overflow.

- [ ] **Step 3: Commit scoped implementation**

```bash
git add \
  'frontend/src/app/[locale]/prototypes/client-theme-exploration/ThemeExploration.tsx' \
  'frontend/src/app/[locale]/prototypes/client-theme-exploration/prototype-data.ts' \
  'frontend/src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts' \
  'frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/ApothecaryRegister.tsx' \
  'frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/apothecary-register.module.css' \
  'frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/PracticeJournal.tsx' \
  'frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/practice-journal.module.css'
git commit -m "feat(public): add two client theme mocks"
```

Expected: only the seven implementation files are committed; unrelated user changes remain untouched.
