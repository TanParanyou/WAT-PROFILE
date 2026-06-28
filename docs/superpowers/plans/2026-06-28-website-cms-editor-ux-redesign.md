# Website CMS Editor UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/[locale]/admin/website/pages/[id]` into a structured CMS editor with content-first tabs, real public-like preview, responsive preview modes, clear save/publish state, and advanced JSON moved out of the default workflow.

**Architecture:** Keep route pages thin and preserve the mock-first service contract. TanStack Query owns server data, React Hook Form owns forms, Zod owns validation, and Zustand owns editor UI state only. The editor shell composes focused tabs and a reusable public page renderer.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, lucide-react, React Hook Form, Zod, Zustand, TanStack Query, existing `websiteCmsService`.

---

## File Structure

Create or modify these files:

- Modify `frontend/src/stores/website-cms-editor-store.ts`: add active editor tab and preview mode state.
- Modify `frontend/src/utils/websiteCms.ts`: add draft/published preview conversion, section completeness helpers, and SEO helpers.
- Create `frontend/src/components/public/website/PublicPageRenderer.tsx`: public-like page renderer used by admin preview.
- Create `frontend/src/components/public/website/PublicSectionRenderer.tsx`: renders known section types and fallback cards.
- Modify `frontend/src/components/admin/website/DevicePreviewFrame.tsx`: add tablet device and stage styling support.
- Modify `frontend/src/components/admin/website/WebsitePreviewDeviceSwitch.tsx`: add tablet option.
- Modify `frontend/src/components/admin/website/WebsitePreviewPanel.tsx`: render `PublicPageRenderer`, preview mode, locale, device controls, and public URL.
- Modify `frontend/src/components/admin/website/WebsitePageEditorShell.tsx`: replace inline mixed form layout with toolbar + state panel + tabs + preview workbench.
- Create `frontend/src/components/admin/website/WebsiteEditorTabs.tsx`: tab navigation shell.
- Create `frontend/src/components/admin/website/WebsiteContentTab.tsx`: locale tabs, section list, selected section editor.
- Create `frontend/src/components/admin/website/WebsiteSeoTab.tsx`: SEO form and Google preview.
- Create `frontend/src/components/admin/website/WebsiteSettingsTab.tsx`: page settings and publish metadata.
- Create `frontend/src/components/admin/website/WebsiteAdvancedTab.tsx`: page/section JSON editor fallback.
- Create `frontend/src/components/admin/website/sections/SectionContentEditorBase.tsx`: shared content-first section form without JSON.
- Create `frontend/src/components/admin/website/sections/HeroSectionEditor.tsx`: focused hero section editor.
- Create `frontend/src/components/admin/website/sections/ContactInfoSectionEditor.tsx`: focused contact info editor.
- Create `frontend/src/components/admin/website/sections/ContactFormSectionEditor.tsx`: focused contact form copy editor.
- Create `frontend/src/components/admin/website/sections/RichTextSectionEditor.tsx`: focused rich text editor.
- Create `frontend/src/components/admin/website/sections/MapSectionEditor.tsx`: focused map editor.
- Create `frontend/src/components/admin/website/sections/GenericSectionAdvancedEditor.tsx`: fallback section editor.
- Modify `frontend/src/components/admin/website/WebsiteSectionList.tsx`: show status, type, completeness, and active state more clearly.
- Modify `frontend/src/app/[locale]/admin/website/pages/[id]/page.tsx`: pass page save, section save, publish, active tab, and preview mode props into shell.

## Task 1: Editor UI State

**Files:**
- Modify: `frontend/src/stores/website-cms-editor-store.ts`
- Verify: `frontend/src/components/admin/website/WebsitePageEditorShell.tsx`

- [ ] **Step 1: Extend store types and state**

Replace the store file with this structure:

```ts
import { create } from "zustand";

export type WebsiteCmsLocale = "th" | "en" | "de";
export type WebsiteCmsPreviewDevice = "mobile" | "tablet" | "desktop";
export type WebsiteCmsEditorTab = "content" | "seo" | "settings" | "advanced";
export type WebsiteCmsPreviewMode = "draft" | "published";

interface WebsiteCmsEditorState {
  activeLocale: WebsiteCmsLocale;
  activeSectionId: string | null;
  activeTab: WebsiteCmsEditorTab;
  previewDevice: WebsiteCmsPreviewDevice;
  previewMode: WebsiteCmsPreviewMode;
  setActiveLocale: (locale: WebsiteCmsLocale) => void;
  setActiveSectionId: (sectionId: string | null) => void;
  setActiveTab: (tab: WebsiteCmsEditorTab) => void;
  setPreviewDevice: (device: WebsiteCmsPreviewDevice) => void;
  setPreviewMode: (mode: WebsiteCmsPreviewMode) => void;
}

export const useWebsiteCmsEditorStore = create<WebsiteCmsEditorState>((set) => ({
  activeLocale: "th",
  activeSectionId: null,
  activeTab: "content",
  previewDevice: "desktop",
  previewMode: "draft",
  setActiveLocale: (activeLocale) => set({ activeLocale }),
  setActiveSectionId: (activeSectionId) => set({ activeSectionId }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setPreviewDevice: (previewDevice) => set({ previewDevice }),
  setPreviewMode: (previewMode) => set({ previewMode }),
}));
```

- [ ] **Step 2: Run TypeScript build to find consumers**

Run: `cd frontend && npm run build`

Expected: FAIL only where `WebsiteCmsPreviewDevice` is handled as `"mobile" | "desktop"` or new store fields are not yet consumed.

- [ ] **Step 3: Stop after reading the build output**

Record the failing files in the task notes. Consumer fixes are handled in Tasks 3-5 so this task remains focused on state shape.

## Task 2: CMS Preview Utilities

**Files:**
- Modify: `frontend/src/utils/websiteCms.ts`
- Verify: `frontend/src/components/admin/website/WebsitePreviewPanel.tsx`

- [ ] **Step 1: Add published preview conversion and quality helpers**

Append these functions to `frontend/src/utils/websiteCms.ts`:

```ts
export function contentPageToPublishedPreview(page: ContentPage): PublicContentPage {
  return {
    id: page.id,
    page_key: page.page_key,
    slug: page.slug,
    title: page.published_title || page.title,
    description: page.published_description || page.description,
    seo: page.published_seo || page.seo,
    body: page.published_body || page.body,
    settings: page.published_settings || page.settings,
    status: page.status,
    sections: sortContentSections(page.sections)
      .filter((section) => section.status === "published" || Boolean(section.published_at))
      .map((section) => ({
        ...section,
        title: section.published_title || section.title,
        description: section.published_description || section.description,
        body: section.published_body || section.body,
        settings: section.published_settings || section.settings,
      })),
    published_at: page.published_at,
  };
}

export function hasDraftDifference(page: ContentPage) {
  if (page.status !== "published") return true;
  if (!page.published_at) return true;
  if (page.updated_at > page.published_at) return true;
  return page.sections.some((section) => !section.published_at || section.updated_at > section.published_at);
}

export function getLocalizedCompleteness(value: Partial<Record<Locale, string>> | undefined) {
  return WEBSITE_CMS_LOCALES.filter((locale) => Boolean(value?.[locale]?.trim())).length;
}

export function getSectionHealth(section: ContentSection) {
  const titleCount = getLocalizedCompleteness(section.title);
  const descriptionCount = getLocalizedCompleteness(section.description);

  if (section.status === "archived") return { tone: "muted" as const, label: "Archived" };
  if (titleCount < WEBSITE_CMS_LOCALES.length || descriptionCount < WEBSITE_CMS_LOCALES.length) {
    return { tone: "warn" as const, label: "Missing translation" };
  }
  if (section.status === "draft") return { tone: "draft" as const, label: "Draft" };
  return { tone: "ready" as const, label: "Ready" };
}

export function getSeoHealth(page: ContentPage) {
  const title = page.seo?.title;
  const description = page.seo?.description;
  const hasTitle = Boolean(title?.th || title?.en || title?.de);
  const hasDescription = Boolean(description?.th || description?.en || description?.de);
  const hasCanonical = Boolean(page.seo?.canonical_url || page.slug);
  const warnings = [
    !hasTitle && "Missing meta title",
    !hasDescription && "Missing meta description",
    !hasCanonical && "Missing canonical URL",
    page.seo?.noindex && "Noindex enabled",
  ].filter(Boolean) as string[];

  return {
    score: Math.max(0, 100 - warnings.length * 25),
    warnings,
  };
}
```

- [ ] **Step 2: Run build**

Run: `cd frontend && npm run build`

Expected: PASS after Task 1 consumers are still compatible. If it fails on `WebsiteCmsPreviewDevice`, continue to Task 4 where device consumers are updated.

## Task 3: Public Preview Renderer

**Files:**
- Create: `frontend/src/components/public/website/PublicPageRenderer.tsx`
- Create: `frontend/src/components/public/website/PublicSectionRenderer.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePreviewPanel.tsx`

- [ ] **Step 1: Create public section renderer**

Create `frontend/src/components/public/website/PublicSectionRenderer.tsx`:

```tsx
"use client";

import { MapPin, Mail, Phone } from "lucide-react";
import type { ContentSection } from "@/types/website-cms";
import { getLocalizedText } from "@/utils/localizedText";
import contactData from "@/data/contact.json";

export function PublicSectionRenderer({ section, locale }: { section: ContentSection; locale: string }) {
  switch (section.section_type) {
    case "hero":
      return (
        <section className="border-b border-zinc-200 bg-zinc-50 px-8 py-12">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">{section.section_key}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-zinc-950">
            {getLocalizedText(section.title, locale)}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-zinc-600">{getLocalizedText(section.description, locale)}</p>
        </section>
      );
    case "contact_info":
      return (
        <section className="grid gap-4 border-b border-zinc-200 px-8 py-8 md:grid-cols-3">
          <Info icon={<MapPin size={16} />} label="Address" value={getLocalizedText(contactData.address, locale)} />
          <Info icon={<Phone size={16} />} label="Phone" value={contactData.phone} />
          <Info icon={<Mail size={16} />} label="Email" value={contactData.email} />
        </section>
      );
    case "contact_form":
      return (
        <section className="border-b border-zinc-200 bg-zinc-50 px-8 py-8">
          <h2 className="text-2xl font-semibold text-zinc-950">{getLocalizedText(section.title, locale)}</h2>
          <p className="mt-2 text-zinc-600">{getLocalizedText(section.description, locale)}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="h-11 border border-zinc-300 bg-white px-3 py-2 text-zinc-400">Name</div>
            <div className="h-11 border border-zinc-300 bg-white px-3 py-2 text-zinc-400">Email</div>
            <div className="min-h-28 border border-zinc-300 bg-white px-3 py-2 text-zinc-400 md:col-span-2">Message</div>
          </div>
          <div className="mt-3 inline-flex h-11 items-center bg-zinc-950 px-5 font-medium text-white">Send message</div>
        </section>
      );
    case "rich_text":
      return (
        <section className="border-b border-zinc-200 px-8 py-8">
          <h2 className="text-2xl font-semibold text-zinc-950">{getLocalizedText(section.title, locale)}</h2>
          <p className="mt-3 max-w-3xl text-zinc-600">{getLocalizedText(section.description, locale)}</p>
        </section>
      );
    case "map":
      return (
        <section className="border-b border-zinc-200 px-8 py-8">
          <h2 className="text-2xl font-semibold text-zinc-950">{getLocalizedText(section.title, locale)}</h2>
          <div className="mt-4 grid h-56 place-items-center border border-zinc-300 bg-zinc-100 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
            Map preview
          </div>
        </section>
      );
    default:
      return (
        <section className="border-b border-dashed border-zinc-300 px-8 py-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">{section.section_type}</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-950">{getLocalizedText(section.title, locale)}</h2>
          <p className="mt-2 text-zinc-600">{getLocalizedText(section.description, locale)}</p>
        </section>
      );
  }
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-950">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm text-zinc-600">{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create public page renderer**

Create `frontend/src/components/public/website/PublicPageRenderer.tsx`:

```tsx
"use client";

import type { PublicContentPage } from "@/types/website-cms";
import { getLocalizedText } from "@/utils/localizedText";
import { PublicSectionRenderer } from "@/components/public/website/PublicSectionRenderer";

export function PublicPageRenderer({ page, locale }: { page: PublicContentPage; locale: string }) {
  return (
    <article className="min-h-[640px] bg-white text-zinc-950">
      <header className="flex h-16 items-center justify-between border-b border-zinc-200 px-6">
        <div className="font-semibold">Wat Loung Por Sai</div>
        <nav className="hidden gap-5 text-sm text-zinc-600 md:flex">
          <span>Home</span>
          <span>About</span>
          <span>Events</span>
          <span>Gallery</span>
          <span>Contact</span>
        </nav>
      </header>
      <section className="border-b border-zinc-200 px-8 py-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">{page.page_key}</p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950">{getLocalizedText(page.title, locale)}</h1>
        <p className="mt-3 max-w-2xl text-zinc-600">{getLocalizedText(page.description, locale)}</p>
      </section>
      {page.sections.map((section) => (
        <PublicSectionRenderer key={section.id} section={section} locale={locale} />
      ))}
      <footer className="px-8 py-6 text-sm text-zinc-500">Wat Loung Por Sai</footer>
    </article>
  );
}
```

- [ ] **Step 3: Replace preview panel content**

In `frontend/src/components/admin/website/WebsitePreviewPanel.tsx`, replace the `ContactPagePreview` render with `PublicPageRenderer` and choose draft/published data:

```tsx
"use client";

import type { ContentPage } from "@/types/website-cms";
import { DevicePreviewFrame } from "@/components/admin/website/DevicePreviewFrame";
import { PublicPageRenderer } from "@/components/public/website/PublicPageRenderer";
import type { WebsiteCmsPreviewDevice, WebsiteCmsPreviewMode } from "@/stores/website-cms-editor-store";
import { contentPageToPublicPreview, contentPageToPublishedPreview } from "@/utils/websiteCms";

export function WebsitePreviewPanel({
  page,
  locale,
  device,
  mode,
}: {
  page: ContentPage;
  locale: string;
  device: WebsiteCmsPreviewDevice;
  mode: WebsiteCmsPreviewMode;
}) {
  const previewPage = mode === "published" ? contentPageToPublishedPreview(page) : contentPageToPublicPreview(page);

  return (
    <DevicePreviewFrame device={device}>
      <PublicPageRenderer page={previewPage} locale={locale} />
    </DevicePreviewFrame>
  );
}
```

- [ ] **Step 4: Run build**

Run: `cd frontend && npm run build`

Expected: FAIL because `WebsitePageEditorShell` does not yet pass `mode` to `WebsitePreviewPanel`. Fix in Task 5.

## Task 4: Device Preview Controls

**Files:**
- Modify: `frontend/src/components/admin/website/DevicePreviewFrame.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePreviewDeviceSwitch.tsx`

- [ ] **Step 1: Add tablet frame size**

Update `DevicePreviewFrame` classes:

```tsx
"use client";

import { cn } from "@/utils/cn";
import type { WebsiteCmsPreviewDevice } from "@/stores/website-cms-editor-store";

export function DevicePreviewFrame({
  children,
  device = "desktop",
}: {
  children: React.ReactNode;
  device?: WebsiteCmsPreviewDevice;
}) {
  return (
    <div className="border border-zinc-200 bg-zinc-200 p-3">
      <div
        className={cn(
          "mx-auto max-h-[calc(100vh-220px)] min-h-[560px] overflow-auto border border-zinc-300 bg-white shadow-sm transition-[max-width]",
          device === "mobile" && "max-w-[390px]",
          device === "tablet" && "max-w-[760px]",
          device === "desktop" && "max-w-[1120px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add tablet button**

Update `WebsitePreviewDeviceSwitch`:

```tsx
"use client";

import { LaptopMinimal, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { WebsiteCmsPreviewDevice } from "@/stores/website-cms-editor-store";

export function WebsitePreviewDeviceSwitch({
  value,
  onChange,
}: {
  value: WebsiteCmsPreviewDevice;
  onChange: (device: WebsiteCmsPreviewDevice) => void;
}) {
  return (
    <div className="inline-flex border border-zinc-200 p-1">
      <Button type="button" size="sm" variant={value === "desktop" ? "primary" : "ghost"} icon={<LaptopMinimal size={14} />} onClick={() => onChange("desktop")}>
        Desktop
      </Button>
      <Button type="button" size="sm" variant={value === "tablet" ? "primary" : "ghost"} icon={<Tablet size={14} />} onClick={() => onChange("tablet")}>
        Tablet
      </Button>
      <Button type="button" size="sm" variant={value === "mobile" ? "primary" : "ghost"} icon={<Smartphone size={14} />} onClick={() => onChange("mobile")}>
        Mobile
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Run build**

Run: `cd frontend && npm run build`

Expected: still FAIL until shell passes preview mode in Task 5.

## Task 5: Editor Tabs And Shell Wiring

**Files:**
- Create: `frontend/src/components/admin/website/WebsiteEditorTabs.tsx`
- Create: `frontend/src/components/admin/website/WebsiteContentTab.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePageEditorShell.tsx`
- Modify: `frontend/src/app/[locale]/admin/website/pages/[id]/page.tsx`

- [ ] **Step 1: Create tab navigation**

Create `WebsiteEditorTabs.tsx`:

```tsx
"use client";

import { FileText, Search, Settings, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { WebsiteCmsEditorTab } from "@/stores/website-cms-editor-store";

const tabs = [
  { value: "content", label: "Content", icon: FileText },
  { value: "seo", label: "SEO", icon: Search },
  { value: "settings", label: "Settings", icon: Settings },
  { value: "advanced", label: "Advanced", icon: SlidersHorizontal },
] as const;

export function WebsiteEditorTabs({
  value,
  onChange,
}: {
  value: WebsiteCmsEditorTab;
  onChange: (tab: WebsiteCmsEditorTab) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 border-b border-zinc-200 pb-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            variant={value === tab.value ? "primary" : "outline"}
            icon={<Icon size={14} />}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create content tab**

Create `WebsiteContentTab.tsx`:

```tsx
"use client";

import type { ContentPage } from "@/types/website-cms";
import { WebsiteLocaleTabs } from "@/components/admin/website/WebsiteLocaleTabs";
import { WebsiteSectionList } from "@/components/admin/website/WebsiteSectionList";
import { HeroSectionEditor } from "@/components/admin/website/sections/HeroSectionEditor";
import { ContactInfoSectionEditor } from "@/components/admin/website/sections/ContactInfoSectionEditor";
import { ContactFormSectionEditor } from "@/components/admin/website/sections/ContactFormSectionEditor";
import { RichTextSectionEditor } from "@/components/admin/website/sections/RichTextSectionEditor";
import { MapSectionEditor } from "@/components/admin/website/sections/MapSectionEditor";
import { GenericSectionAdvancedEditor } from "@/components/admin/website/sections/GenericSectionAdvancedEditor";
import type { WebsiteCmsLocale } from "@/stores/website-cms-editor-store";
import type { WebsiteCmsSectionFormData } from "@/schemas/website-cms.schema";
import { getDefaultActiveSectionId } from "@/utils/websiteCms";

export function WebsiteContentTab({
  page,
  activeLocale,
  activeSectionId,
  isSavingSection,
  sectionError,
  onActiveLocaleChange,
  onActiveSectionChange,
  onSaveSection,
}: {
  page: ContentPage;
  activeLocale: WebsiteCmsLocale;
  activeSectionId: string | null;
  isSavingSection: boolean;
  sectionError: Error | null;
  onActiveLocaleChange: (locale: WebsiteCmsLocale) => void;
  onActiveSectionChange: (sectionId: string | null) => void;
  onSaveSection: (values: WebsiteCmsSectionFormData, sectionId: string) => void;
}) {
  const activeSection = page.sections.find((section) => section.id === (activeSectionId ?? getDefaultActiveSectionId(page))) ?? null;

  return (
    <div className="space-y-4">
      <WebsiteLocaleTabs activeLocale={activeLocale} onChange={onActiveLocaleChange} />
      <WebsiteSectionList sections={page.sections} activeSectionId={activeSection?.id ?? null} onSelect={onActiveSectionChange} />
      {activeSection ? (
        <SectionEditor
          section={activeSection}
          activeLocale={activeLocale}
          isSaving={isSavingSection}
          error={sectionError}
          onSubmit={(values) => onSaveSection(values, activeSection.id)}
        />
      ) : null}
    </div>
  );
}

function SectionEditor(props: React.ComponentProps<typeof GenericSectionAdvancedEditor>) {
  switch (props.section.section_type) {
    case "hero":
      return <HeroSectionEditor {...props} />;
    case "contact_info":
      return <ContactInfoSectionEditor {...props} />;
    case "contact_form":
      return <ContactFormSectionEditor {...props} />;
    case "rich_text":
      return <RichTextSectionEditor {...props} />;
    case "map":
      return <MapSectionEditor {...props} />;
    default:
      return <GenericSectionAdvancedEditor {...props} />;
  }
}
```

- [ ] **Step 3: Wire shell props**

Update `WebsitePageEditorShell` props to include:

```ts
activeTab: WebsiteCmsEditorTab;
previewMode: WebsiteCmsPreviewMode;
onActiveTabChange: (tab: WebsiteCmsEditorTab) => void;
onPreviewModeChange: (mode: WebsiteCmsPreviewMode) => void;
```

Render tabs in the left panel:

```tsx
<div className="space-y-4 border border-zinc-200 bg-white p-4">
  <WebsiteEditorTabs value={activeTab} onChange={onActiveTabChange} />
  {activeTab === "content" ? (
    <WebsiteContentTab
      page={page}
      activeLocale={activeLocale}
      activeSectionId={activeSectionId}
      isSavingSection={isSavingSection}
      sectionError={sectionError}
      onActiveLocaleChange={onActiveLocaleChange}
      onActiveSectionChange={onActiveSectionChange}
      onSaveSection={onSaveSection}
    />
  ) : null}
</div>
```

Pass preview mode:

```tsx
<WebsitePreviewPanel page={page} locale={activeLocale} device={previewDevice} mode={previewMode} />
```

- [ ] **Step 4: Wire route state**

In `frontend/src/app/[locale]/admin/website/pages/[id]/page.tsx`, read and pass:

```ts
const {
  activeLocale,
  activeSectionId,
  activeTab,
  previewDevice,
  previewMode,
  setActiveLocale,
  setActiveSectionId,
  setActiveTab,
  setPreviewDevice,
  setPreviewMode,
} = useWebsiteCmsEditorStore();
```

Pass `activeTab`, `previewMode`, `onActiveTabChange={setActiveTab}`, and `onPreviewModeChange={setPreviewMode}` into the shell.

- [ ] **Step 5: Run build**

Run: `cd frontend && npm run build`

Expected: FAIL because section editors from Step 2 do not exist yet. Fix in Task 6.

## Task 6: Section-Specific Editors

**Files:**
- Create: `frontend/src/components/admin/website/sections/SectionContentEditorBase.tsx`
- Create: `frontend/src/components/admin/website/sections/GenericSectionAdvancedEditor.tsx`
- Create: `frontend/src/components/admin/website/sections/HeroSectionEditor.tsx`
- Create: `frontend/src/components/admin/website/sections/ContactInfoSectionEditor.tsx`
- Create: `frontend/src/components/admin/website/sections/ContactFormSectionEditor.tsx`
- Create: `frontend/src/components/admin/website/sections/RichTextSectionEditor.tsx`
- Create: `frontend/src/components/admin/website/sections/MapSectionEditor.tsx`

- [ ] **Step 1: Create shared content-first section editor base**

Create `SectionContentEditorBase.tsx`. This base intentionally does not render JSON fields.

```tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";
import { websiteCmsSectionFormSchema, type WebsiteCmsSectionFormData } from "@/schemas/website-cms.schema";
import type { ContentSection } from "@/types/website-cms";
import { contentSectionToFormValues } from "@/utils/websiteCms";

export function SectionContentEditorBase({
  section,
  activeLocale,
  isSaving,
  error,
  heading,
  summary,
  children,
  onSubmit,
}: {
  section: ContentSection;
  activeLocale: string;
  isSaving: boolean;
  error: Error | null;
  heading: string;
  summary: string;
  children?: (form: ReturnType<typeof useForm<WebsiteCmsSectionFormData>>) => React.ReactNode;
  onSubmit: (values: WebsiteCmsSectionFormData) => void;
}) {
  const form = useForm<WebsiteCmsSectionFormData>({
    resolver: zodResolver(websiteCmsSectionFormSchema) as never,
    defaultValues: contentSectionToFormValues(section),
  });

  useEffect(() => {
    form.reset(contentSectionToFormValues(section));
  }, [form, section]);

  const hidden = form.watch("status") === "archived";

  return (
    <form className="space-y-4 border border-zinc-200 bg-zinc-50 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">{heading}</h2>
          <p className="text-xs text-zinc-500">{summary} · {activeLocale.toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          {hidden ? "Hidden" : "Visible"}
        </div>
      </div>

      <Select
        label="Section status"
        disabled={isSaving}
        options={[
          { value: "draft", label: "Draft" },
          { value: "published", label: "Published" },
          { value: "archived", label: "Hidden / archived" },
        ]}
        {...form.register("status")}
        error={form.formState.errors.status?.message}
      />

      <LocalizedTextFields label="Title" name="title" register={form.register} errors={form.formState.errors} disabled={isSaving} />
      <LocalizedTextareaFields label="Description" name="description" register={form.register} errors={form.formState.errors} disabled={isSaving} />

      {children?.(form)}

      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSaving} icon={<Save size={14} />}>Save section</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Extract generic advanced editor**

Create `GenericSectionAdvancedEditor.tsx` by moving the current `ContactSectionEditor` implementation and updating the component name:

```tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { JsonTextareaField } from "@/components/forms/JsonTextareaField";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";
import { websiteCmsSectionFormSchema, type WebsiteCmsSectionFormData } from "@/schemas/website-cms.schema";
import type { ContentSection } from "@/types/website-cms";
import { contentSectionToFormValues } from "@/utils/websiteCms";

export function GenericSectionAdvancedEditor({
  section,
  activeLocale,
  isSaving,
  error,
  onSubmit,
}: {
  section: ContentSection;
  activeLocale: string;
  isSaving: boolean;
  error: Error | null;
  onSubmit: (values: WebsiteCmsSectionFormData) => void;
}) {
  const form = useForm<WebsiteCmsSectionFormData>({
    resolver: zodResolver(websiteCmsSectionFormSchema) as never,
    defaultValues: contentSectionToFormValues(section),
  });

  useEffect(() => {
    form.reset(contentSectionToFormValues(section));
  }, [form, section]);

  return (
    <form className="space-y-4 border border-zinc-200 bg-zinc-50 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <div className="text-sm font-medium text-zinc-950">{section.section_key}</div>
        <div className="text-xs text-zinc-500">{section.section_type} · {activeLocale.toUpperCase()}</div>
      </div>
      <LocalizedTextFields label="Title" name="title" register={form.register} errors={form.formState.errors} disabled={isSaving} />
      <LocalizedTextareaFields label="Description" name="description" register={form.register} errors={form.formState.errors} disabled={isSaving} />
      <JsonTextareaField label="Body JSON" name="body" control={form.control} disabled={isSaving} />
      <JsonTextareaField label="Settings JSON" name="settings" control={form.control} disabled={isSaving} />
      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSaving}>Save section</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create focused hero editor**

Create `HeroSectionEditor.tsx`:

```tsx
"use client";

import { Input } from "@/components/ui/Input";
import { SectionContentEditorBase } from "@/components/admin/website/sections/SectionContentEditorBase";

export function HeroSectionEditor(props: React.ComponentProps<typeof SectionContentEditorBase>) {
  return (
    <SectionContentEditorBase heading="Hero" summary="Main page headline and primary call to action" {...props}>
      {(form) => (
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Image URL" {...form.register("body.image" as never)} disabled={props.isSaving} />
          <Input label="CTA label" {...form.register("settings.cta_label" as never)} disabled={props.isSaving} />
        </div>
      )}
    </SectionContentEditorBase>
  );
}
```

- [ ] **Step 4: Create focused contact information editor**

Create `ContactInfoSectionEditor.tsx`:

```tsx
"use client";

import { Input } from "@/components/ui/Input";
import { SectionContentEditorBase } from "@/components/admin/website/sections/SectionContentEditorBase";

export function ContactInfoSectionEditor(props: React.ComponentProps<typeof SectionContentEditorBase>) {
  return (
    <SectionContentEditorBase heading="Contact information" summary="Address, phone, email, and contact display options" {...props}>
      {(form) => (
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Phone override" {...form.register("body.phone" as never)} disabled={props.isSaving} />
          <Input label="Email override" {...form.register("body.email" as never)} disabled={props.isSaving} />
          <Input label="Map URL" {...form.register("settings.map_url" as never)} disabled={props.isSaving} className="md:col-span-2" />
        </div>
      )}
    </SectionContentEditorBase>
  );
}
```

- [ ] **Step 5: Create focused contact form editor**

Create `ContactFormSectionEditor.tsx`:

```tsx
"use client";

import { Input } from "@/components/ui/Input";
import { SectionContentEditorBase } from "@/components/admin/website/sections/SectionContentEditorBase";

export function ContactFormSectionEditor(props: React.ComponentProps<typeof SectionContentEditorBase>) {
  return (
    <SectionContentEditorBase heading="Contact form copy" summary="Form labels, button text, and helper copy" {...props}>
      {(form) => (
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Submit label" {...form.register("settings.submit_label" as never)} disabled={props.isSaving} />
          <Input label="Success message" {...form.register("settings.success_message" as never)} disabled={props.isSaving} />
        </div>
      )}
    </SectionContentEditorBase>
  );
}
```

- [ ] **Step 6: Create focused rich text editor**

Create `RichTextSectionEditor.tsx`:

```tsx
"use client";

import { SectionContentEditorBase } from "@/components/admin/website/sections/SectionContentEditorBase";

export function RichTextSectionEditor(props: React.ComponentProps<typeof SectionContentEditorBase>) {
  return (
    <SectionContentEditorBase heading="Rich text" summary="Readable narrative content for public pages" {...props}>
      {(form) => (
        <textarea
          rows={8}
          className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-950"
          disabled={props.isSaving}
          {...form.register("body.markdown" as never)}
        />
      )}
    </SectionContentEditorBase>
  );
}
```

- [ ] **Step 7: Create focused map editor**

Create `MapSectionEditor.tsx`:

```tsx
"use client";

import { Input } from "@/components/ui/Input";
import { SectionContentEditorBase } from "@/components/admin/website/sections/SectionContentEditorBase";

export function MapSectionEditor(props: React.ComponentProps<typeof SectionContentEditorBase>) {
  return (
    <SectionContentEditorBase heading="Map" summary="Public map embed and fallback address" {...props}>
      {(form) => (
        <div className="space-y-3">
          <Input label="Map embed URL" {...form.register("body.embed_url" as never)} disabled={props.isSaving} />
          <Input label="Fallback address" {...form.register("body.address" as never)} disabled={props.isSaving} />
        </div>
      )}
    </SectionContentEditorBase>
  );
}
```

- [ ] **Step 8: Run build**

Run: `cd frontend && npm run build`

Expected: PASS after import paths are correct.

## Task 7: SEO, Settings, And Advanced Tabs

**Files:**
- Create: `frontend/src/components/admin/website/WebsiteSeoTab.tsx`
- Create: `frontend/src/components/admin/website/WebsiteSettingsTab.tsx`
- Create: `frontend/src/components/admin/website/WebsiteAdvancedTab.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePageEditorShell.tsx`

- [ ] **Step 1: Move current page metadata editor into Settings**

Create `WebsiteSettingsTab.tsx`:

```tsx
"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WebsitePageMetadataEditor } from "@/components/admin/website/WebsitePageMetadataEditor";
import type { ContentPage } from "@/types/website-cms";
import type { WebsiteCmsPageFormData } from "@/schemas/website-cms.schema";

export function WebsiteSettingsTab({
  page,
  isSaving,
  error,
  onSubmit,
}: {
  page: ContentPage;
  isSaving: boolean;
  error: Error | null;
  onSubmit: (values: WebsiteCmsPageFormData) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
        Last updated: {new Date(page.updated_at).toLocaleString()} · Last published: {page.published_at ? new Date(page.published_at).toLocaleString() : "Never"}
      </div>
      <WebsitePageMetadataEditor page={page} isSaving={isSaving} error={error} onSubmit={onSubmit} />
      <Button type="button" variant="outline" icon={<ExternalLink size={14} />} onClick={() => window.open(`/${page.slug}`, "_blank")}>
        View public
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create SEO tab**

Create `WebsiteSeoTab.tsx`:

```tsx
"use client";

import type { ContentPage } from "@/types/website-cms";
import type { WebsiteCmsPageFormData } from "@/schemas/website-cms.schema";
import { WebsitePageMetadataEditor } from "@/components/admin/website/WebsitePageMetadataEditor";
import { SeoPreviewPanel } from "@/components/admin/website/SeoPreviewPanel";
import { getSeoHealth } from "@/utils/websiteCms";

export function WebsiteSeoTab({
  page,
  locale,
  isSaving,
  error,
  onSubmit,
}: {
  page: ContentPage;
  locale: string;
  isSaving: boolean;
  error: Error | null;
  onSubmit: (values: WebsiteCmsPageFormData) => void;
}) {
  const health = getSeoHealth(page);

  return (
    <div className="space-y-4">
      <div className="border border-zinc-200 bg-zinc-50 p-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">SEO score</div>
        <div className="mt-1 text-2xl font-semibold text-zinc-950">{health.score}%</div>
        {health.warnings.length ? (
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-700">
            {health.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        ) : <p className="mt-2 text-sm text-emerald-700">SEO basics look ready.</p>}
      </div>
      <SeoPreviewPanel page={page} locale={locale} />
      <WebsitePageMetadataEditor page={page} isSaving={isSaving} error={error} onSubmit={onSubmit} />
    </div>
  );
}
```

- [ ] **Step 3: Create advanced tab**

Create `WebsiteAdvancedTab.tsx`:

```tsx
"use client";

import type { ContentPage } from "@/types/website-cms";
import type { WebsiteCmsPageFormData, WebsiteCmsSectionFormData } from "@/schemas/website-cms.schema";
import { WebsitePageMetadataEditor } from "@/components/admin/website/WebsitePageMetadataEditor";
import { GenericSectionAdvancedEditor } from "@/components/admin/website/sections/GenericSectionAdvancedEditor";
import { getDefaultActiveSectionId } from "@/utils/websiteCms";

export function WebsiteAdvancedTab({
  page,
  activeSectionId,
  activeLocale,
  isSavingPage,
  isSavingSection,
  pageError,
  sectionError,
  onSavePage,
  onSaveSection,
}: {
  page: ContentPage;
  activeSectionId: string | null;
  activeLocale: string;
  isSavingPage: boolean;
  isSavingSection: boolean;
  pageError: Error | null;
  sectionError: Error | null;
  onSavePage: (values: WebsiteCmsPageFormData) => void;
  onSaveSection: (values: WebsiteCmsSectionFormData, sectionId: string) => void;
}) {
  const section = page.sections.find((item) => item.id === (activeSectionId ?? getDefaultActiveSectionId(page))) ?? null;

  return (
    <div className="space-y-4">
      <div className="border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Advanced JSON can affect public rendering. Use this tab for admin/dev fixes only.
      </div>
      <WebsitePageMetadataEditor page={page} isSaving={isSavingPage} error={pageError} onSubmit={onSavePage} />
      {section ? (
        <GenericSectionAdvancedEditor
          section={section}
          activeLocale={activeLocale}
          isSaving={isSavingSection}
          error={sectionError}
          onSubmit={(values) => onSaveSection(values, section.id)}
        />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Render tabs in shell**

In `WebsitePageEditorShell`, render:

```tsx
{activeTab === "seo" ? (
  <WebsiteSeoTab page={page} locale={activeLocale} isSaving={isSavingPage} error={pageError} onSubmit={onSavePage} />
) : null}
{activeTab === "settings" ? (
  <WebsiteSettingsTab page={page} isSaving={isSavingPage} error={pageError} onSubmit={onSavePage} />
) : null}
{activeTab === "advanced" ? (
  <WebsiteAdvancedTab
    page={page}
    activeSectionId={activeSectionId}
    activeLocale={activeLocale}
    isSavingPage={isSavingPage}
    isSavingSection={isSavingSection}
    pageError={pageError}
    sectionError={sectionError}
    onSavePage={onSavePage}
    onSaveSection={onSaveSection}
  />
) : null}
```

- [ ] **Step 5: Run build**

Run: `cd frontend && npm run build`

Expected: PASS.

## Task 8: Toolbar And State Polish

**Files:**
- Modify: `frontend/src/components/admin/website/WebsiteEditorToolbar.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteEditorStatePanel.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteSectionList.tsx`

- [ ] **Step 1: Add status and view public affordance to toolbar**

Update toolbar to show page key, slug, status, publish button, and view public:

```tsx
<div className="flex items-center gap-2">
  <Button type="button" variant="outline" onClick={() => window.open(`/${page.slug}`, "_blank")}>
    View public
  </Button>
  <Button type="button" isLoading={isPublishing} icon={<Send size={14} />} onClick={onPublish}>
    Publish changes
  </Button>
</div>
```

Keep the existing back link as `href="/admin/website"`.

- [ ] **Step 2: Improve section list health display**

In `WebsiteSectionList`, import `getSectionHealth` and render each section label:

```tsx
const health = getSectionHealth(section);
```

Display `health.label` in the right-side monospace badge. Use these classes:

```ts
health.tone === "ready" && "text-emerald-700"
health.tone === "warn" && "text-amber-700"
health.tone === "draft" && "text-zinc-700"
health.tone === "muted" && "text-zinc-400"
```

- [ ] **Step 3: Run build**

Run: `cd frontend && npm run build`

Expected: PASS.

## Task 9: Final Verification

**Files:**
- Verify: `frontend/src/app/[locale]/admin/website/pages/[id]/page.tsx`
- Verify: `frontend/src/components/admin/website/**`
- Verify: `frontend/src/components/public/website/**`

- [ ] **Step 1: Build**

Run: `cd frontend && npm run build`

Expected: PASS and route list includes:

```text
ƒ /[locale]/admin/website
ƒ /[locale]/admin/website/pages
ƒ /[locale]/admin/website/pages/[id]
```

- [ ] **Step 2: Run a dev server**

Run: `cd frontend && npm run dev`

Expected: dev server starts on `http://localhost:3000` or prints the actual available port.

- [ ] **Step 3: Manual browser check**

Open: `http://localhost:3000/th/admin/website/pages/PAGE-CONTACT`

Expected:

- Page opens without login because mock auth is enabled by default.
- Content tab is active.
- Preview mode is Draft.
- Device switch has Desktop, Tablet, Mobile.
- Preview looks like a public page with navbar, sections, and footer.
- SEO tab opens and shows score/warnings.
- Settings tab opens and shows page metadata.
- Advanced tab opens and shows JSON warning and JSON editors.

- [ ] **Step 4: Build after manual fixes**

Run: `cd frontend && npm run build`

Expected: PASS.
