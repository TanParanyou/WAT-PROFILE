# About Page UX/UI Redesign Design Spec

## 1. Overview
Redesign the public "About" page (`frontend/src/app/[locale]/(client)/about`) to use a **Continuous Flow (Minimal & Serene)** layout. The goal is to make the content feel airy, elegant, and perfectly suited for a temple/monastery website by emphasizing whitespace and removing harsh containment boxes.

## 2. Architecture & Components
The changes will primarily take place in `PublicAboutPageLayout.tsx`. 
The existing sections (`#intro`, `#objective`, `#administration`, `#history`, `#buildings`, `#sangha`) will be modified. The `PageNavigation` component will remain sticky on the left for desktop views.

## 3. Design Details

### 3.1. Structure & Whitespace (Continuous Flow)
- **Remove Containment:** Strip all `.bg-white`, `.border-gray-100`, `.shadow-sm`, and heavy padding from the section containers. 
- **Whitespace:** Increase vertical spacing between sections (e.g., changing from `space-y-24` to `space-y-32` or adding larger top/bottom padding) to create visual breathing room.
- **Background:** The sections will flow directly on the main page background (`bg-zinc-50` for light mode, `bg-zinc-950` for dark mode).

### 3.2. Responsive Design (Mandatory)
- **Mobile First:** Ensure that the layout looks great on mobile devices.
- **Navigation:** The sticky `PageNavigation` on desktop should gracefully hide or transform appropriately on smaller screens (existing behavior).
- **Spacing:** Adjust the whitespace using responsive prefixes (e.g., `py-12 md:py-24`) so it doesn't look too sparse on mobile while remaining elegant on desktop.

### 3.3. Specific Section Refinements
- **Intro:** Replace the solid box (`bg-primary/5`) for the "Founded/Location" information with a cleaner left-border style (`border-l-4 border-primary/20 pl-6`).
- **Objective:** Retain the large Quote icon but make it highly subtle/transparent so it acts as a watermark rather than a focal point.
- **Buildings:** Remove the outer card surrounding the numbered list. Retain the `bg-primary/10 text-primary` rounded numbers but let the text flow freely alongside them.
- **Sangha:** Connect the introductory text smoothly to the `MonksGrid` without any dividing borders.

## 4. Accessibility & Theming
- Ensure text contrast remains high against `zinc-50`/`zinc-950`.
- Retain existing dark mode (`dark:prose-invert`) and localized text rendering.
