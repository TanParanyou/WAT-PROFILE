# Admin Design System

## Scope
This contract governs routes under `src/app/[locale]/admin` and shared Admin UI.
Public preview content remains governed by the repository-root `DESIGN.md`.

## Theme seam
- `.admin-theme` in `src/app/globals.css` is the only Admin palette owner.
- TSX consumes role utilities (`bg-admin-surface`, `text-admin-foreground`,
  `border-admin-border`, `bg-admin-action`) rather than palette utilities.
- Structural UI does not use raw hex, `gray-*`, `zinc-*`, or `amber-*` classes.
- Status UI uses `admin-success`, `admin-warning`, `admin-danger`, or `admin-info`.

## Shape and hierarchy
- Default controls, panels, cards, inputs, and CTAs use `rounded-none` (0px corner radius) matching the public client design system.
- Primary actions use `admin-action`; destructive actions use `admin-danger`.
- Focus is always visible through `admin-focus`; minimum target height is 44px.
- Use spacing, borders, and muted surfaces before shadows.

## Forms and lists
- Follow `.agents/skills/building-admin-forms/SKILL.md`.
- Forms retain localized labels/errors and sticky save actions.
- Tables retain sorting, selection, pagination, loading, empty, and error states.
