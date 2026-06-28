# PAGE-CONTACT FE Contract Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the PAGE-CONTACT admin Website CMS frontend as the mock-first executable requirement before rebuilding the backend contract.

**Architecture:** Keep frontend components independent of mock/API source. `websiteCmsService` becomes the single contract boundary, mock behavior mirrors the future backend, and admin UI consumes TanStack Query mutations without knowing whether data is local mock or remote API. Backend, DB, permissions, history/versioning, and test coverage are intentionally deferred.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, React Hook Form, TanStack Query, Zustand, Tailwind CSS, lucide-react, existing `websiteCmsService`.

---

## Scope

Implement now:

- FE service contract guard and response normalization.
- Mock-first section lifecycle behavior: create, update, reorder, archive, restore, duplicate, publish.
- PAGE-CONTACT editor behavior polish: per-action pending/error state, dirty guard for section/tab/back changes, media URL field.
- API contract documentation generated from the FE contract.

Defer:

- Automated tests.
- Permissions and role boundary.
- Audit/history/versioning.
- Real DB/Supabase calls.
- Backend implementation.

## File Structure

- Modify `frontend/src/types/api.ts`: add field-error contract used by future backend.
- Modify `frontend/src/types/website-cms.ts`: add request/response types for section operations.
- Modify `frontend/src/services/websiteCmsService.ts`: centralize API unwrap, normalize payloads, mock lifecycle operations, and future endpoint names.
- Modify `frontend/src/hooks/website-cms.ts`: expose mutations that match service contract and update query cache consistently.
- Modify `frontend/src/utils/websiteCms.ts`: add pure helpers for duplicate templates, full reorder payloads, and section lifecycle operations.
- Create `frontend/src/components/admin/website/MediaUrlField.tsx`: reusable URL + preview field for hero/map/media-like fields.
- Modify `frontend/src/components/admin/website/WebsiteContentTab.tsx`: add duplicate, restore, confirm guards, and per-action disabled states.
- Modify `frontend/src/components/admin/website/WebsitePageEditorShell.tsx`: route dirty-change and action errors into content/editor panels.
- Modify `frontend/src/app/[locale]/admin/website/pages/[id]/page.tsx`: wire mutation handlers, dirty guard behavior, and action errors.
- Create `docs/website-cms/website-cms-api-contract.md`: BE contract to implement after FE behavior is approved.

## Contract Decisions

Use these future API endpoints in FE service code now:

```text
GET  /api/v1/admin/website/pages
GET  /api/v1/admin/website/pages/:pageKey
PUT  /api/v1/admin/website/pages/:id
POST /api/v1/admin/website/pages/:id/publish

POST /api/v1/admin/website/pages/:pageId/sections
PUT  /api/v1/admin/website/sections/:id
POST /api/v1/admin/website/sections/:id/archive
POST /api/v1/admin/website/sections/:id/restore
POST /api/v1/admin/website/sections/:id/duplicate
PUT  /api/v1/admin/website/pages/:pageId/sections/reorder

GET  /api/v1/public/pages/:slug
```

Response rules:

- Page mutations return `ContentPage`.
- Section create/update/archive/restore/duplicate return `ContentSection`.
- Section reorder returns `ContentPage`.
- Publish returns `ContentPage`.
- Public fetch returns `PublicContentPage`.
- Errors use `{ success: false, error: string, fields?: Record<string, string> }`.

## Task 1: API And CMS Contract Types

**Files:**
- Modify: `frontend/src/types/api.ts`
- Modify: `frontend/src/types/website-cms.ts`

- [ ] **Step 1: Add API field error type**

In `frontend/src/types/api.ts`, update `ApiResponse` to include optional field errors:

```ts
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    fields?: Record<string, string>;
}
```

- [ ] **Step 2: Add CMS operation request types**

Append this to `frontend/src/types/website-cms.ts`:

```ts
export interface CreateContentSectionRequest {
  section_type: string;
  section_key?: string;
  sort_order?: number;
}

export interface ReorderContentSectionsRequest {
  section_ids: string[];
}

export interface ArchiveContentSectionRequest {
  archived: boolean;
}

export interface DuplicateContentSectionRequest {
  section_key?: string;
}
```

- [ ] **Step 3: Run TypeScript build**

Run:

```bash
cd frontend
npm run build
```

Expected: PASS or fail only in files that will be updated by later tasks.

## Task 2: Service Contract Boundary

**Files:**
- Modify: `frontend/src/services/websiteCmsService.ts`
- Modify: `frontend/src/utils/websiteCms.ts`

- [ ] **Step 1: Add API unwrap and clone helpers**

At the top of `frontend/src/services/websiteCmsService.ts`, keep imports and add helpers:

```ts
function unwrapApiResponse<T>(response: ApiResponse<T>, fallbackMessage: string): T {
  if (!response.success || response.error) {
    const error = new Error(response.error || fallbackMessage);
    Object.assign(error, { fields: response.fields });
    throw error;
  }
  if (response.data === undefined || response.data === null) {
    throw new Error(fallbackMessage);
  }
  return response.data;
}

function clonePage(page: ContentPage) {
  return structuredClone(page);
}

function cloneSection(section: ContentSection) {
  return structuredClone(section);
}
```

Remove any duplicate `clonePage` definition already in the file.

- [ ] **Step 2: Normalize nullable backend maps**

Add these helpers in `frontend/src/services/websiteCmsService.ts`:

```ts
function normalizeSection(section: ContentSection): ContentSection {
  return {
    ...section,
    title: section.title || { th: "", en: "", de: "" },
    description: section.description || { th: "", en: "", de: "" },
    body: section.body || {},
    settings: section.settings || {},
    status: section.status || "draft",
  };
}

function normalizePage(page: ContentPage): ContentPage {
  return {
    ...page,
    title: page.title || { th: "", en: "", de: "" },
    description: page.description || { th: "", en: "", de: "" },
    seo: page.seo || {},
    body: page.body || {},
    settings: page.settings || {},
    status: page.status || "draft",
    sections: [...(page.sections || [])].map(normalizeSection).sort((a, b) => a.sort_order - b.sort_order),
  };
}

function normalizePublicPage(page: PublicContentPage): PublicContentPage {
  return {
    ...page,
    title: page.title || { th: "", en: "", de: "" },
    description: page.description || { th: "", en: "", de: "" },
    seo: page.seo || {},
    body: page.body || {},
    settings: page.settings || {},
    sections: [...(page.sections || [])].map(normalizeSection).sort((a, b) => a.sort_order - b.sort_order),
  };
}
```

- [ ] **Step 3: Route all reads through normalizers**

Update service return sites:

```ts
return pages.map((page) => normalizePage(clonePage(page)));
return normalizePage(clonePage(page));
return normalizePage(unwrapApiResponse(res.data, "Page not found"));
return page ? normalizePublicPage(toPublicPage(clonePage(page))) : null;
return res.data.data ? normalizePublicPage(res.data.data) : null;
```

- [ ] **Step 4: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: PASS or only expected failures from missing lifecycle methods.

## Task 3: Mock Lifecycle Contract

**Files:**
- Modify: `frontend/src/utils/websiteCms.ts`
- Modify: `frontend/src/services/websiteCmsService.ts`

- [ ] **Step 1: Add duplicate helper**

Append to `frontend/src/utils/websiteCms.ts`:

```ts
export function duplicateSectionTemplate(page: ContentPage, source: ContentSection) {
  const timestamp = new Date().toISOString();
  return {
    ...structuredClone(source),
    id: crypto.randomUUID(),
    section_key: getUniqueSectionKey(page.sections, `${source.section_key}-copy`),
    sort_order: page.sections.length,
    status: "draft" as const,
    published_title: undefined,
    published_description: undefined,
    published_body: undefined,
    published_settings: undefined,
    published_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  } satisfies ContentSection;
}
```

If `getUniqueSectionKey` is currently private, keep it private but ensure `duplicateSectionTemplate` is in the same file and can call it.

- [ ] **Step 2: Change reorder API method to full section id contract**

In `frontend/src/services/websiteCmsService.ts`, replace `reorderSection(id, direction)` with:

```ts
async reorderSections(pageId: string, sectionIds: string[]) {
  if (useMockWebsiteCms) {
    const page = pages.find((item) => item.id === pageId);
    if (!page) throw new Error("Page not found");
    const order = new Map(sectionIds.map((id, index) => [id, index]));
    page.sections = page.sections
      .map((section) => ({
        ...section,
        sort_order: order.get(section.id) ?? section.sort_order,
        updated_at: new Date().toISOString(),
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
    page.updated_at = new Date().toISOString();
    return normalizePage(clonePage(page));
  }

  const res = await api.put<ApiResponse<ContentPage>>(`/admin/website/pages/${pageId}/sections/reorder`, {
    section_ids: sectionIds,
  });
  return normalizePage(unwrapApiResponse(res.data, "Failed to reorder sections"));
}
```

- [ ] **Step 3: Add archive, restore, and duplicate methods**

In `websiteCmsAdminService`, add:

```ts
async archiveSection(id: string) {
  return this.updateSection(id, { status: "archived" });
},

async restoreSection(id: string) {
  return this.updateSection(id, { status: "draft" });
},

async duplicateSection(id: string) {
  if (useMockWebsiteCms) {
    for (const page of pages) {
      const source = page.sections.find((section) => section.id === id);
      if (!source) continue;
      const duplicate = duplicateSectionTemplate(page, source);
      page.sections = [...page.sections, duplicate];
      page.updated_at = new Date().toISOString();
      return cloneSection(duplicate);
    }
    throw new Error("Section not found");
  }

  const res = await api.post<ApiResponse<ContentSection>>(`/admin/website/sections/${id}/duplicate`);
  return normalizeSection(unwrapApiResponse(res.data, "Failed to duplicate section"));
},
```

- [ ] **Step 4: Keep create section future endpoint**

Ensure `createSection(pageId, sectionType)` uses:

```ts
const res = await api.post<ApiResponse<ContentSection>>(`/admin/website/pages/${pageId}/sections`, {
  section_type: sectionType,
});
return normalizeSection(unwrapApiResponse(res.data, "Failed to create section"));
```

- [ ] **Step 5: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: fail in hooks/components that still call old reorder/archive signatures. Those are fixed in Tasks 4-5.

## Task 4: Query Hooks Match Contract

**Files:**
- Modify: `frontend/src/hooks/website-cms.ts`

- [ ] **Step 1: Update reorder mutation**

Replace `useReorderWebsiteSectionMutation` with:

```ts
export function useReorderWebsiteSectionsMutation(pageKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, sectionIds }: { pageId: string; sectionIds: string[] }) =>
      websiteCmsAdminService.reorderSections(pageId, sectionIds),
    onSuccess: (page) => {
      queryClient.setQueryData(websiteCmsKeys.page(pageKey), page);
      queryClient.invalidateQueries({ queryKey: websiteCmsKeys.pages() });
    },
  });
}
```

- [ ] **Step 2: Split archive and restore mutations**

Add:

```ts
export function useArchiveWebsiteSectionMutation(pageKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => websiteCmsAdminService.archiveSection(id),
    onSuccess: (section) => {
      queryClient.setQueryData<ContentPage | undefined>(websiteCmsKeys.page(pageKey), (page) => {
        if (!page) return page;
        return {
          ...page,
          updated_at: new Date().toISOString(),
          sections: page.sections.map((item) => (item.id === section.id ? section : item)),
        };
      });
      queryClient.invalidateQueries({ queryKey: websiteCmsKeys.pages() });
    },
  });
}

export function useRestoreWebsiteSectionMutation(pageKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => websiteCmsAdminService.restoreSection(id),
    onSuccess: (section) => {
      queryClient.setQueryData<ContentPage | undefined>(websiteCmsKeys.page(pageKey), (page) => {
        if (!page) return page;
        return {
          ...page,
          updated_at: new Date().toISOString(),
          sections: page.sections.map((item) => (item.id === section.id ? section : item)),
        };
      });
      queryClient.invalidateQueries({ queryKey: websiteCmsKeys.pages() });
    },
  });
}
```

- [ ] **Step 3: Add duplicate mutation**

Add:

```ts
export function useDuplicateWebsiteSectionMutation(pageKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => websiteCmsAdminService.duplicateSection(id),
    onSuccess: (section) => {
      queryClient.setQueryData<ContentPage | undefined>(websiteCmsKeys.page(pageKey), (page) => {
        if (!page) return page;
        return {
          ...page,
          updated_at: new Date().toISOString(),
          sections: [...page.sections, section].sort((a, b) => a.sort_order - b.sort_order),
        };
      });
      queryClient.invalidateQueries({ queryKey: websiteCmsKeys.pages() });
    },
  });
}
```

- [ ] **Step 4: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: fail in route/component imports that still reference old hook names. Fix in Task 5.

## Task 5: PAGE-CONTACT Section Behavior UI

**Files:**
- Modify: `frontend/src/app/[locale]/admin/website/pages/[id]/page.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePageEditorShell.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteContentTab.tsx`

- [ ] **Step 1: Update route imports**

In page route, import these hooks:

```ts
useArchiveWebsiteSectionMutation,
useCreateWebsiteSectionMutation,
useDuplicateWebsiteSectionMutation,
useReorderWebsiteSectionsMutation,
useRestoreWebsiteSectionMutation,
```

Remove `useReorderWebsiteSectionMutation` if present.

- [ ] **Step 2: Wire mutations in route**

Use:

```ts
const createSectionMutation = useCreateWebsiteSectionMutation(id);
const reorderSectionsMutation = useReorderWebsiteSectionsMutation(id);
const archiveSectionMutation = useArchiveWebsiteSectionMutation(id);
const restoreSectionMutation = useRestoreWebsiteSectionMutation(id);
const duplicateSectionMutation = useDuplicateWebsiteSectionMutation(id);
```

- [ ] **Step 3: Pass full reorder handler**

In route render, pass:

```ts
onReorderSections={(sectionIds) =>
  reorderSectionsMutation.mutate(
    { pageId: pageQuery.data.id, sectionIds },
    { onSuccess: () => setHasUnsavedChanges(false) },
  )
}
```

- [ ] **Step 4: Add archive, restore, duplicate handlers**

Pass:

```ts
onArchiveSection={(sectionId) =>
  archiveSectionMutation.mutate(sectionId, { onSuccess: () => setHasUnsavedChanges(false) })
}
onRestoreSection={(sectionId) =>
  restoreSectionMutation.mutate(sectionId, { onSuccess: () => setHasUnsavedChanges(false) })
}
onDuplicateSection={(sectionId) =>
  duplicateSectionMutation.mutate(sectionId, {
    onSuccess: (section) => {
      setActiveSectionId(section.id);
      setHasUnsavedChanges(false);
    },
  })
}
```

- [ ] **Step 5: Confirm before section switch when dirty**

In `WebsiteContentTab`, wrap section select:

```ts
const selectSection = (sectionId: string) => {
  if (hasUnsavedChanges && !window.confirm("You have unsaved edits. Change section anyway?")) return;
  onActiveSectionChange(sectionId);
};
```

Then pass `selectSection` to `WebsiteSectionList`.

- [ ] **Step 6: Compute full reorder array**

In `WebsiteContentTab`, replace direction handler with:

```ts
const reorderActiveSection = (direction: "up" | "down") => {
  if (!activeSection) return;
  const next = [...sortedSections];
  const target = direction === "up" ? activeIndex - 1 : activeIndex + 1;
  if (target < 0 || target >= next.length) return;
  [next[activeIndex], next[target]] = [next[target], next[activeIndex]];
  onReorderSections(next.map((section) => section.id));
};
```

- [ ] **Step 7: Add Duplicate button**

Add a button next to archive/restore:

```tsx
<Button
  type="button"
  variant="outline"
  size="sm"
  icon={<Copy size={14} />}
  isLoading={isDuplicatingSection}
  onClick={() => onDuplicateSection(activeSection.id)}
>
  Duplicate
</Button>
```

- [ ] **Step 8: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: PASS after prop types are aligned.

## Task 6: Route Guard And Back Guard

**Files:**
- Modify: `frontend/src/components/admin/website/WebsiteEditorToolbar.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteEditorTabs.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePageEditorShell.tsx`

- [ ] **Step 1: Add confirm helper to shell**

Inside `WebsitePageEditorShell`:

```ts
const canLeaveCurrentForm = () => {
  return !hasUnsavedChanges || window.confirm("You have unsaved edits. Continue without saving?");
};
```

- [ ] **Step 2: Guard tab changes**

Pass guarded tab handler:

```tsx
<WebsiteEditorTabs
  value={activeTab}
  onChange={(tab) => {
    if (!canLeaveCurrentForm()) return;
    onActiveTabChange(tab);
  }}
/>
```

- [ ] **Step 3: Change toolbar Back to button-based navigation**

In `WebsiteEditorToolbar`, replace the `Link` wrapper with `useRouter` from `@/navigation`:

```ts
const router = useRouter();
```

Add prop:

```ts
onBeforeLeave: () => boolean;
```

Back button:

```tsx
<Button
  type="button"
  variant="ghost"
  size="sm"
  icon={<ArrowLeft size={14} />}
  onClick={() => {
    if (!onBeforeLeave()) return;
    router.push("/admin/website");
  }}
>
  Back
</Button>
```

- [ ] **Step 4: Pass guard into toolbar**

In shell:

```tsx
<WebsiteEditorToolbar
  ...
  onBeforeLeave={canLeaveCurrentForm}
/>
```

- [ ] **Step 5: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: PASS.

## Task 7: Media URL Field

**Files:**
- Create: `frontend/src/components/admin/website/MediaUrlField.tsx`
- Modify: `frontend/src/components/admin/website/sections/HeroSectionEditor.tsx`
- Modify: `frontend/src/components/admin/website/sections/MapSectionEditor.tsx`

- [ ] **Step 1: Create shared MediaUrlField**

Create:

```tsx
"use client";

import { Image, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/Input";

export function MediaUrlField({
  label,
  value,
  disabled,
  inputProps,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const isImage = /^https?:\/\//.test(value) || value.startsWith("/");

  return (
    <div className="space-y-2">
      <Input label={label} disabled={disabled} {...inputProps} />
      <div className="border border-zinc-200 bg-zinc-50 p-3">
        {isImage ? (
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden border border-zinc-200 bg-white">
              <img src={value} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 text-sm text-zinc-600">
              <div className="flex items-center gap-2 font-medium text-zinc-950">
                <Image size={14} />
                Preview
              </div>
              <div className="truncate">{value}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <LinkIcon size={14} />
            Add a URL to preview this media.
          </div>
        )}
        <button
          type="button"
          disabled
          className="mt-3 border border-zinc-200 bg-white px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-400"
        >
          Choose media
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Use MediaUrlField in hero**

In `HeroSectionEditor`, replace image URL input with:

```tsx
<div className="md:col-span-2">
  <MediaUrlField
    label="Image URL"
    value={String(form.watch("body.image" as never) || "")}
    disabled={props.isSaving}
    inputProps={form.register("body.image" as never)}
  />
</div>
```

- [ ] **Step 3: Use MediaUrlField for map embed**

In `MapSectionEditor`, replace map embed input with:

```tsx
<MediaUrlField
  label="Map embed URL"
  value={String(form.watch("body.embed_url" as never) || "")}
  disabled={props.isSaving}
  inputProps={form.register("body.embed_url" as never)}
/>
```

- [ ] **Step 4: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: PASS.

## Task 8: API Contract Documentation

**Files:**
- Create: `docs/website-cms/website-cms-api-contract.md`

- [ ] **Step 1: Create contract doc**

Create `docs/website-cms/website-cms-api-contract.md` with:

```md
# Website CMS API Contract

Date: 2026-06-28
Status: FE-approved mock-first contract, backend pending

## Rule

Frontend components do not know whether data comes from mock JSON or API. Backend must implement the same response shapes used by `frontend/src/services/websiteCmsService.ts`.

## Response Envelope

\`\`\`ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  fields?: Record<string, string>;
}
\`\`\`

## Admin Pages

- `GET /api/v1/admin/website/pages` returns `ContentPage[]`
- `GET /api/v1/admin/website/pages/:pageKey` returns `ContentPage`
- `PUT /api/v1/admin/website/pages/:id` returns `ContentPage`
- `POST /api/v1/admin/website/pages/:id/publish` returns `ContentPage`

## Admin Sections

- `POST /api/v1/admin/website/pages/:pageId/sections` with `{ section_type, section_key?, sort_order? }` returns `ContentSection`
- `PUT /api/v1/admin/website/sections/:id` returns `ContentSection`
- `POST /api/v1/admin/website/sections/:id/archive` returns `ContentSection`
- `POST /api/v1/admin/website/sections/:id/restore` returns `ContentSection`
- `POST /api/v1/admin/website/sections/:id/duplicate` returns `ContentSection`
- `PUT /api/v1/admin/website/pages/:pageId/sections/reorder` with `{ section_ids }` returns `ContentPage`

## Public Pages

- `GET /api/v1/public/pages/:slug` returns `PublicContentPage`

## Publish Behavior

Publishing copies draft page fields to published page fields and copies each active section draft payload to published section payloads. Public endpoints read published fields only.

## Deferred Backend Work

Permissions, audit/history, and Supabase-specific persistence are not part of this FE contract hardening phase.
\`\`\`
```

- [ ] **Step 2: Run final build**

Run:

```bash
cd frontend
npm run build
```

Expected: PASS.

- [ ] **Step 3: Review changed files**

Run:

```bash
git status --short
```

Expected: plan/doc/frontend files are modified; no unrelated files are reverted.

## Execution Notes

- Do not call the real DB.
- Do not add tests in this slice.
- Do not implement permissions.
- Do not implement history/versioning.
- Keep all editor data ownership rules: TanStack Query for server data, RHF for form state, Zustand for UI-only state.
- Keep FE service as the only mock/API switch.

## Self-Review

- Requirement coverage: covers contract guard, mock behavior, mutation UX, dirty guard, media URL field, and BE contract doc.
- Deferred items respected: tests, permissions, history/versioning, and real DB calls are excluded.
- Type consistency: section operation names use create/update/archive/restore/duplicate/reorder consistently, and reorder uses full `section_ids` contract.
