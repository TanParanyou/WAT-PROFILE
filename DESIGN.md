---
name: "Wat Loung Por Sai"
description: "A calm, trustworthy digital sanctuary that guides people from discovery to Dharma practice."
---

# Design System

Read `PRODUCT.md` before changing content hierarchy or calls to action. This file is the
source of truth for public-facing visual decisions.

## Direction

**Creative North Star:** “ศาลาแห่งความสงบ — The Quiet Sala”

- Use real temple, monk, and activity photography as the primary proof and atmosphere.
- Make the next action obvious without making the site feel commercial.
- Public pages are warm and narrative; Admin/CMS surfaces are quiet and task-focused.
- Do not use Thai ornament, gold, or religious symbols as repetitive decoration.

## Colors

| Token | Value | Use |
|---|---|---|
| Faith Gold | `#C88D1E` | Primary CTA, selected state, important link |
| Deep Faith Gold | `#A97016` | Hover/focus emphasis |
| Soft Gold Wash | `#FCF9F2` | Small highlighted area |
| Forest Calm | `#4A6741` | Nature/practice-related secondary information |
| Morning Amber | `#EEA111` | Necessary warning or accent only |
| Warm Ground | `#FCF3E9` | Light page background |
| Clear Surface | `#FFFFFF` | Content and form surface |
| Grounded Ink | `#2B1F08` | Primary text |
| Quiet Text | `#563F10` | Secondary text that still passes contrast |
| Night Ground | `#160E03` | Dark background |

- Gold is navigation, not decoration; reserve it for meaningful emphasis.
- Do not add gradients, glassmorphism, decorative grids, or repeating stripes by default.

## Typography

- Display: `Pridi, Georgia, "Times New Roman", serif`.
- Body: `"Noto Sans Thai", Inter, "Segoe UI", Arial, sans-serif`.
- Display: `clamp(3rem, 7vw, 6rem)`, weight 700, line-height 1.2.
- Headline: `clamp(1.875rem, 4vw, 3rem)`, weight 700, line-height 1.2.
- Title: `1.5rem`, weight 700, line-height 1.3.
- Body: `1.125rem`, weight 400, line-height 1.75, maximum `65–75ch`.
- Label: `0.875rem`, weight 500, line-height 1.5.
- Use one `h1` per page; do not use headings only to obtain a font size.
- Prefer readability and contrast over ceremonial styling in every locale.

## Spacing and shape

| Token | Value |
|---|---|
| `xs` | `8px` |
| `sm` | `12px` |
| `md` | `16px` |
| `lg` | `24px` |
| `xl` | `32px` |
| section | `80px` |

- Inputs and ordinary controls use `8px` corners.
- Content cards use `12–16px` corners and `24px` internal padding.
- Primary hero CTA may use a pill radius; ordinary cards must not exceed `16px`.
- Use whitespace, background contrast, and thin borders before adding elevation.

## Elevation

| Layer | Shadow |
|---|---|
| Resting surface | `0 1px 2px rgba(0, 0, 0, 0.05)` |
| Interactive hover | `0 4px 8px rgba(43, 31, 8, 0.10)` |
| Modal/overlay | `0 8px 24px rgba(22, 14, 3, 0.18)` |

- General surfaces are flat at rest.
- Do not combine a 1px border with a decorative shadow blur of 16px or more.

## Components

- Primary hero button: Faith Gold, white text, `12px 32px`, pill.
- Hover transitions last 200–300ms and preserve visible keyboard focus.
- Inputs: white surface, 1px neutral border, `8px 12px`, no layout shift on focus.
- Errors need text or an icon; color alone is insufficient.
- Desktop navigation may float over the hero, then become solid on scroll.
- Mobile navigation uses at least 44px touch targets.
- Hero text keeps sufficient overlay contrast and renders without motion.
- Cards use borders or the resting shadow only when separation is otherwise unclear.

## Accessibility and responsive rules

- Target WCAG 2.2 AA.
- Support keyboard navigation, screen readers, 200% zoom, and reduced motion.
- Keep focus indicators at least 2px and visually distinct.
- Test Thai, English, and German at mobile, tablet, and desktop widths.
- Prevent long German labels and Thai headings from clipping or overflowing.
- Do not hide essential content behind animation or hover.
