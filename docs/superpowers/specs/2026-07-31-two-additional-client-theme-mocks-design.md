# Two Additional Client Theme Mocks

## Goal

Add two clearly differentiated public-site theme mocks to the existing client
theme exploration route. Both reuse the current prototype content and real image
assets. They extend the picker from five variants to seven without changing the
production public site.

## Shared constraints

- Keep the work inside
  `frontend/src/app/[locale]/prototypes/client-theme-exploration`.
- Preserve the existing five variants.
- Reuse `PrototypeContent`; do not introduce API or CMS changes.
- Keep Thai as the displayed prototype language while retaining the existing
  language affordance.
- Use semantic sections, keyboard-accessible links and controls, visible focus,
  and reduced-motion fallbacks.
- Support desktop and mobile without horizontal overflow.
- Use the source references as visual principles, not as copied branding,
  wordmarks, product language, or proprietary typefaces.
- Avoid gradients, decorative shadows, excessive rounding, and repeated generic
  card grids.

## Variant 6: ทะเบียนศาลา

### Intent

Translate Aesop's catalogue and apothecary discipline into a temple information
archive. The page should feel like a carefully maintained printed register:
quiet, precise, warm through photography, and easy to scan.

### Visual system

- Canvas: warm off-white.
- Ink and rules: warm graphite rather than pure black.
- Accent: sparse terracotta on metadata or a single rule; never a large CTA
  fill.
- Geometry: zero-radius buttons, images, panels, and controls.
- Depth: one-pixel ink rules only; no shadows.
- Typography: the existing Thai sans family handles navigation, body, actions,
  and most headings. The existing Thai display/serif family appears in one
  prominent editorial heading only.

### Structure

1. Compact navigation with temple name, three section links, and language
   control.
2. Split hero: a natural-colour photograph beside restrained introductory copy.
3. A single serif statement introducing the temple.
4. Event register: rows separated by hairlines, with date, title, summary, and
   action aligned like a catalogue index rather than boxed cards.
5. Visit section pairing an image with practical first-visit guidance.
6. Light footer that remains on the same canvas instead of becoming a dark band.

### Responsive behaviour

- Desktop hero uses a balanced image/copy split.
- Event rows use distinct date, content, and action columns.
- Below 768px the hero stacks image-first, navigation simplifies, and event
  columns become a vertical reading order while retaining rules.

## Variant 7: บันทึกภาวนา

### Intent

Extend Anthropic's editorial and academic rhythm into a contemporary practice
journal. Unlike the existing monochrome variant, this direction actively uses a
muted colour system to classify content and create pacing.

### Visual system

- Base: ivory canvas with true-black full-bleed interludes.
- Accents: muted clay, sky blue, and cactus tones, assigned deliberately to
  event categories.
- Typography: bold Thai sans for the impact hero; Thai serif for large editorial
  statements and long-form copy; compact sans metadata.
- Geometry: mostly square corners, with modest radii only on functional controls.
- Depth: surface changes and colour blocks provide hierarchy; no shadows or
  gradients.

### Structure

1. Editorial navigation with temple identity and a compact language control.
2. Asymmetric hero combining a large impact statement, location metadata, and a
   cropped real photograph.
3. Black practice manifesto band with an oversized serif statement.
4. Three-event journal where each event receives one muted accent surface and a
   distinct editorial composition instead of identical cards.
5. Ivory visit section with a large destination image and practical guidance.
6. Black footer that closes the cream/black band rhythm.

### Responsive behaviour

- Desktop uses asymmetric columns and deliberate overlap-free offsets.
- Mobile converts all sections to a single reading column, preserves the accent
  sequence, and keeps display type below the 96px ceiling.
- Long Thai headings must balance cleanly and never overflow.

## Integration

- Extend `ThemeVariantKey`, `THEME_VARIANTS`, and the picker order with
  `apothecary` and `journal`.
- Add the two keys to keyboard navigation.
- Render each variant as its own React component and CSS module.
- Keep the current default selection unchanged unless implementation review
  shows a stronger reason to surface one of the new variants first.

## Verification

- Update the prototype data test to assert seven unique variants in picker order.
- Run the focused Node test, TypeScript type-check, and scoped ESLint.
- Inspect both variants at representative desktop and mobile viewport sizes.
- Verify no horizontal overflow, missing accessible names, or browser console
  errors.
- Treat existing `<img>` optimisation warnings as known prototype debt; do not
  expand the task into a production image migration.

## Out of scope

- Replacing the selected production client theme.
- Backend, CMS, API, or content-schema changes.
- New dependencies, proprietary fonts, new photography, or copied brand marks.
- Refactoring the five existing prototype variants.
