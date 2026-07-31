---
name: "Wat Loung Por Sai"
description: "A calm, trustworthy digital sanctuary that guides people from discovery to Dharma practice."
---

# Design System

Read `PRODUCT.md` before changing content hierarchy or calls to action. This file is the
source of truth for public-facing visual decisions.

## Direction

**Creative North Star:** “ทะเบียนศาลา — The Apothecary Register”

- The public site reads as a carefully maintained temple register: calm, exact,
  and welcoming rather than ceremonial or commercial.
- Use real temple, monk, and activity photography to carry warmth; interface
  chrome remains quiet and precise.
- Make the next action obvious with order, proximity, and typography—not a loud
  colour or oversized control.
- Public pages are narrative and image-led; Admin/CMS surfaces remain
  task-focused and may use their own operational conventions.
- Do not use Thai ornament, gold, or religious symbols as repetitive decoration.

## Colors

| Token | Value | Use |
|---|---|---|
| Register Canvas | `#FFFEF2` | Primary public-page background; paper rather than white screen |
| Register Ink | `#333333` | Primary text, primary CTA, and all standard hairline rules |
| Deep Graphite | `#242424` | Hover/active fill on the primary CTA only |
| Quiet Graphite | `#666666` | Secondary metadata that remains readable on canvas |
| Taupe Surface | `#F7ECDD` | Image-adjacent information and visit guidance |
| Cool Divider | `#E4E9EA` | Rare quiet separation only |
| Terracotta Marker | `#945C26` | Sparse inline link/focus/important metadata accent; never a CTA fill |
| Inverse Canvas | `#FFFEF2` | Text on graphite surfaces |

- Treat ink and hairline as the same colour so sections read as one continuous
  printed sheet.
- Terracotta is a scarcity signal, not a brand field; use it for one meaningful
  detail within a local context, never as a wide panel or decorative motif.
- Do not add gradients, glassmorphism, decorative grids, repeating stripes, or
  gold by default.

### Theme implementation

- `.public-theme` in `frontend/src/app/globals.css` is the single seam for the
  public-site palette.
- Public modules use role-based Tailwind utilities such as `bg-site-canvas`,
  `text-site-foreground`, `bg-site-surface`, `border-site-border`,
  `bg-site-action`, and `text-site-accent`.
- Do not use raw colour values or theme-specific names in public TSX modules.
  A future visual theme changes the `.public-theme` variables, not each caller.
- Keep Admin/CMS colours independent from the public theme.

## Typography

- Interface and body: `"Noto Sans Thai", Inter, "Segoe UI", Arial, sans-serif`.
- Editorial moment only: `Pridi, Georgia, "Times New Roman", serif`.
- Hero display: `clamp(2.9rem, 6vw, 5.8rem)`, weight 700, line-height 1.05,
  letter-spacing no tighter than `-0.03em`.
- Editorial section heading: `clamp(2.3rem, 4.8vw, 4.7rem)`, weight 400,
  line-height 1.14; use the serif family for one principal statement per page.
- Event title: `1.5rem`, weight 500, line-height 1.3.
- Body: `1.125rem`, weight 400, line-height 1.75, maximum `65–75ch`.
- Label and metadata: `0.875rem`, weight 400–500, line-height 1.5.
- Use one `h1` per page; do not use headings only to obtain a font size.
- Use `text-wrap: balance` for long Thai headings; use `text-wrap: pretty` for
  longer prose where supported.
- Prefer readability and contrast over ceremonial styling in every locale.

## Spacing and shape

| Token | Value |
|---|---|
| `xs` | `8px` |
| `sm` | `12px` |
| `base` | `15px` |
| `md` | `16px` |
| `lg` | `24px` |
| `xl` | `32px` |
| rail | `40px` |
| section | `clamp(64px, 9vw, 120px)` |

- Public-site controls, panels, images, inputs, and CTAs use `0px` corner radius.
- Use asymmetric button padding `13px 24px 12px` when the control is at least
  44px high; this is an intentional typographic correction.
- Prefer rails and ordered rows over card grids. Event content is a register:
  date, description, and action align in columns at desktop and stack in reading
  order on mobile.
- Use whitespace, image composition, background contrast, and 1px rules before
  considering elevation.

## Elevation

| Layer | Treatment |
|---|---|
| Resting surface | Flat canvas; no shadow |
| Structural separation | `1px solid #333333` hairline |
| Image-adjacent section | Taupe Surface background |
| Primary action | Register Ink fill with Inverse Canvas text |
| Modal/overlay | A functional, compact shadow only when depth is necessary |

- Public page sections are flat at rest; do not use decorative shadows.
- Do not combine a 1px border with a decorative shadow blur.

## Components

- Primary hero button: Register Ink fill, Inverse Canvas text, `13px 24px 12px`,
  square corners, minimum 44px height.
- Secondary action: Register Canvas fill, 1px Register Ink border, same padding
  and square corners.
- Important text link: Terracotta Marker, underlined or otherwise clear without
  relying on colour alone.
- Hover transitions last 150–200ms and preserve visible keyboard focus; avoid
  decorative motion.
- Inputs: Register Canvas surface, 1px Register Ink border, square corners,
  `0 16px` horizontal padding, no layout shift on focus.
- Errors need text or an icon; color alone is insufficient.
- Navigation is a compact solid canvas bar with a 1px rule when it separates
  from the page; do not float it over photography by default.
- Mobile navigation uses at least 44px touch targets.
- Hero copy and natural-colour photography form a balanced split at desktop;
  image follows copy on mobile unless content order requires otherwise.
- Event rows use 1px rules; do not wrap each row in a card.

## Accessibility and responsive rules

- Target WCAG 2.2 AA.
- Support keyboard navigation, screen readers, 200% zoom, and reduced motion.
- Keep focus indicators at least 3px, visually distinct, and Terracotta Marker
  when shown on a light public surface.
- Test Thai, English, and German at mobile, tablet, and desktop widths.
- Prevent long German labels and Thai headings from clipping or overflowing.
- Do not hide essential content behind animation or hover.
