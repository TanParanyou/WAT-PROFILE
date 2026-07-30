# Frontend Agent Guide

Applies to `frontend/`. Also follow the root `AGENTS.md`.

## Stack and paths

- Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4.
- `src/app/[locale]/(client)/`: public routes.
- `src/app/[locale]/admin/`: protected Admin Panel and CMS routes.
- `src/components/ui/`: shared primitives.
- `src/components/admin/`: shared admin components.
- `src/features/public/`: public domain API, DTO, mapper, and query boundaries.
- `src/services/`: shared/admin API clients.
- `src/messages/{th,en,de}.json`: public messages.
- `src/messages/admin/{th,en,de}.json`: admin messages.
- Use `@/` for imports rooted at `src/`.

## Commands

```bash
npm ci
npm run dev
npm run lint
./node_modules/.bin/tsc --noEmit
npm run build
```

There is no working aggregate test command. TypeScript test files use `node:test`,
but direct `node --test` cannot currently resolve the TypeScript modules.

## Data access

- Components must not import Axios or construct API URLs.
- Public requests belong in `src/features/public/<domain>/api.ts`.
- Public query keys/hooks belong in the matching `queries.ts`.
- Admin/shared requests belong in `src/services/`.
- Use `src/services/api.ts` for authenticated requests.
- Use `src/services/publicService.ts` for anonymous `/public` requests.
- Unwrap and validate the backend response envelope before returning domain data.
- Keep server data in TanStack Query; do not mirror it into Zustand or context.
- Keep Zustand limited to CMS editor view state such as locale, selection, and preview.
- Do not fetch server data directly in `useEffect`.

## Contracts and forms

- Reuse types from `src/types/` or the owning feature; do not duplicate DTOs in components.
- Do not use `any` or `@ts-ignore`; narrow `unknown` values.
- Localized text objects must preserve `th`, `en`, and `de`.
- Forms use React Hook Form and Zod where that pattern exists in the feature.
- Map API validation errors through existing form-error utilities.
- Rich text uses the shared `src/lib/rich-text/` contract and admin rich-text components.
- Sanitize rich-text HTML through the existing rendering utilities.

## Components and routes

- Keep App Router `page.tsx` files focused on routing and composition.
- Reuse `src/components/ui/` and admin shared components before adding variants.
- Permission-sensitive actions must use `usePermission`, `PermissionGuard`, or
  `PermissionButton`; backend permission middleware remains mandatory.
- Preserve loading, error, empty, and success states for independent public sections.
- Use `routing.ts` navigation helpers for locale-aware links.
- Add message keys to all six relevant locale files when UI copy changes.
- Keep `Europe/Berlin` semantics for visitor-facing dates and times.

## CMS and fallback data

- Admin Website CMS always uses the real admin API service.
- Public CMS fallback selection remains inside the service boundary.
- Components must not import `src/data/*.json` for new remote-backed behavior.
- `NEXT_PUBLIC_WEBSITE_CMS_SOURCE=api` selects the public API source.
- `NEXT_PUBLIC_SKIP_ADMIN_AUTH=true` is local UI-review mode only.
- Do not expose private credentials in variables prefixed with `NEXT_PUBLIC_`.

## UI rules

- Read `../DESIGN.md` for public UI changes.
- Read `../PRODUCT.md` when changing content hierarchy, calls to action, or copy.
- Keep focus indicators, keyboard operation, 44px touch targets, and reduced motion.
- Verify layouts and copy in Thai, English, and German at mobile and desktop widths.

## Definition of Done additions

- `npm run lint`, type-check, and `npm run build` pass.
- Query keys are stable and mutations invalidate the owning queries.
- No component performs direct HTTP calls or owns duplicate remote state.
- Every changed message key exists in all supported locale files.
- Test-runner limitations are reported when changed behavior cannot be executed as a test.
