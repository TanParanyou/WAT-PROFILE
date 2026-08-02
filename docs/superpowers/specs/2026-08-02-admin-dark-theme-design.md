# Admin Dark Theme Design

**Date:** 2026-08-02  
**Status:** Approved design, pending plan update

## Goal

Add a maintainable Light, Dark, and System theme to the WAT-PROFILE Admin application without changing Public-site colors, business behavior, API contracts, permissions, or localized content.

## Scope

This design governs:

- Routes under `frontend/src/app/[locale]/admin`, including Login.
- Shared Admin shell and controls.
- Admin modal, drawer, toast, and other portal surfaces.
- Website CMS editor chrome.

This design does not add a Dark theme to the Public website. Website CMS preview remains governed by `.public-theme` and must not inherit Admin Dark mode.

## User experience

Admin users can choose one of three modes:

1. **System** — follow the operating-system color preference.
2. **Light** — always use the Admin Light palette.
3. **Dark** — always use the Admin Dark palette.

The selected mode is available from the Admin Header. The setting persists in the browser and applies to Login, authenticated Admin routes, and Website CMS editor chrome.

The control displays only after the client has mounted, preventing the server-rendered UI from showing a theme selection that disagrees with the browser preference.

## Architecture

### Theme state owner

Use the existing `next-themes` dependency through a focused `AdminThemeProvider`.

The provider configuration is:

```tsx
<ThemeProvider
  attribute="data-admin-theme"
  defaultTheme="system"
  enableSystem
  storageKey="wat-admin-theme"
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

Using `data-admin-theme` instead of the global `.dark` class prevents Admin theme selection from activating unrelated Tailwind `dark:` variants outside Admin.

`next-themes` resolves System mode to `data-admin-theme="light"` or `data-admin-theme="dark"` on the document element. The stored preference remains `system`, `light`, or `dark`.

### Token seam

Admin components consume semantic Tailwind roles such as:

- `admin-canvas`
- `admin-surface`
- `admin-surface-muted`
- `admin-foreground`
- `admin-body`
- `admin-muted`
- `admin-border`
- `admin-control-border`
- `admin-action`
- `admin-action-hover`
- `admin-on-action`
- `admin-selected`
- `admin-selected-foreground`
- `admin-focus`
- Admin success, warning, danger, and info roles

Light values live in `.admin-theme`. Dark overrides live under:

```css
[data-admin-theme="dark"] .admin-theme {
    /* dark semantic values */
}
```

Components do not add one-off `dark:` classes. Changing either palette happens at the token seam.

### Route boundary

`AdminThemeProvider` wraps both Login and authenticated Admin routes in `frontend/src/app/[locale]/admin/layout.tsx`.

The locale root and Public client layout remain unchanged. Public routes may coexist with the persisted Admin preference because only descendants of `.admin-theme` consume Admin variables.

### Portal boundary

`Modal` and `Drawer` render under `document.body`, outside the Admin route wrapper. Their portal roots must include `.admin-theme` so Admin variables resolve there.

Because `data-admin-theme` is stored on the document element, the portal's `.admin-theme` root receives the correct Light or Dark overrides.

Toast placement must follow the same rule if it remains outside the Admin route wrapper. If Toast is rendered inside the provider and route theme root, it inherits normally.

### Website CMS boundary

Website CMS editor controls and chrome use Admin theme roles and follow the Admin theme selection.

Embedded preview content is wrapped in:

```tsx
<div className="public-theme min-h-full bg-site-canvas text-site-foreground">
  {children}
</div>
```

It remains visually equivalent to the real Public site and does not become dark when the Admin is dark. A Public preview theme selector is out of scope until the real Public website supports that same theme.

## Components

### AdminThemeProvider

Responsibilities:

- Configure `next-themes`.
- Own the Admin-specific storage key and attribute.
- Avoid introducing application data or UI state.

Interface:

```tsx
interface AdminThemeProviderProps {
  children: React.ReactNode;
}
```

### AdminThemeSwitcher

Responsibilities:

- Offer System, Light, and Dark choices.
- Use translated accessible labels.
- Reflect the stored `theme` choice, not only the resolved theme.
- Show the resolved theme where helpful.
- Avoid hydration mismatch by rendering a stable placeholder until mounted.
- Provide 44px minimum targets and visible focus.

Interface:

```tsx
type AdminThemeMode = "system" | "light" | "dark";

interface AdminThemeSwitcherProps {
  className?: string;
}
```

The switcher uses existing icons from Lucide React and is placed in `AdminHeader` beside the language selector.

### Theme messages

Add matching keys to:

- `frontend/src/messages/admin/th.json`
- `frontend/src/messages/admin/en.json`
- `frontend/src/messages/admin/de.json`

Required meanings:

- Theme
- System
- Light
- Dark
- Current theme
- Use system preference

No theme label is hard-coded in TSX.

## Data flow

1. Admin layout mounts `AdminThemeProvider`.
2. `next-themes` reads `wat-admin-theme`.
3. If the stored mode is System or absent, it reads `prefers-color-scheme`.
4. It writes `data-admin-theme="light"` or `"dark"` to the document element.
5. `.admin-theme` defines Light tokens; the Dark selector overrides them.
6. Admin semantic utilities resolve the active values.
7. The switcher calls `setTheme("system" | "light" | "dark")`.
8. `next-themes` persists the selection and updates the attribute.
9. Public preview remains inside its own `.public-theme` seam.

No API request, Zustand store, or React Query cache is involved.

## Failure and edge cases

- **JavaScript disabled:** Admin renders with Light token defaults.
- **No stored preference:** System mode is used.
- **System preference changes:** UI updates when mode is System.
- **Invalid stored value:** `next-themes` falls back to the configured default.
- **Hydration:** Switcher delays theme-dependent controls until mounted.
- **Portal rendering:** Portal roots re-establish `.admin-theme`.
- **Theme transition flash:** `disableTransitionOnChange` prevents distracting full-page transitions.
- **Public leakage:** No global `.dark` class is used by the Admin provider.
- **Preview leakage:** Device preview re-establishes `.public-theme`.

## Accessibility

- Target WCAG 2.2 AA contrast in both palettes.
- Focus indicators remain visible against Light and Dark surfaces.
- Theme choice is keyboard-operable and screen-reader labeled.
- Selected mode is communicated through control state and text/icon, not color alone.
- Status colors retain labels or icons.
- Disabled and read-only states remain distinguishable in both palettes.
- Respect operating-system preference when System mode is selected.

## Testing

### Automated

- Theme provider exposes the configured Admin attribute and storage key.
- Theme switcher offers exactly System, Light, and Dark.
- Theme switcher calls `setTheme` with the selected mode.
- Theme guard rejects structural palette classes and raw hex values in migrated Admin TSX.
- Production CSS resolves Admin semantic utilities through `var(--admin-*)`.
- TypeScript, scoped ESLint, theme guard, and production build pass.

### Manual matrix

Test all three modes:

- Explicit Light.
- Explicit Dark.
- System with OS Light.
- System with OS Dark.
- Reload persistence.
- Navigation between Admin routes.
- Login and authenticated shell.
- Desktop and mobile Header/Sidebar.
- Tables: loading, empty, data, selected, pagination.
- Forms: default, focus, invalid, disabled, read-only, dirty, saving.
- Modal, Drawer, Toast, confirmation, and media picker.
- Website CMS editor and all status states.
- Website CMS Public preview while Admin is Light and Dark.
- Thai, English, and German.
- Widths 375px, 768px, and 1440px.

## Acceptance criteria

- Users can select System, Light, or Dark from the Admin Header.
- The preference survives reloads.
- System mode follows OS changes.
- Login, Admin shell, controls, lists, forms, overlays, and CMS chrome render correctly in both palettes.
- Website CMS Public preview is unchanged by Admin theme selection.
- Public routes are unchanged.
- Admin components use semantic roles without distributed `dark:` variants.
- Light and Dark palettes can be tuned centrally.
- No unrelated source changes or user work are overwritten.

