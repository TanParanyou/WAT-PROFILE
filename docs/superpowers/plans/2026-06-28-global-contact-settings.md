# Global Contact Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move shared contact data such as address, phone, email, social links, opening hours, map, and bank details into a reusable global settings contract that can be reviewed with mock JSON first and switched to API later.

**Architecture:** Website page CMS remains responsible for page-specific copy and section composition. Global contact settings become a separate data source with the same mock/API boundary as Website CMS. Public templates consume contact settings through a service, not by importing static JSON directly.

**Tech Stack:** Next.js App Router, TypeScript, Zod, mock JSON, API-ready service layer, existing public templates and admin CMS patterns.

---

## Scope Lock

This is not a page builder change. This plan only moves reusable organization/contact data out of page content and out of direct component imports.

Global settings should own:

- Address
- Phone
- Email
- Social links
- Opening hours
- Transportation details
- Map URLs
- Bank account details

Page content should still own:

- Contact page hero title and subtitle
- Section headings and descriptions
- Whether a page shows social/bank/map blocks
- Form copy and submit behavior

---

## File Map

- Create: `frontend/src/types/site-settings.ts` - shared contracts for site/contact settings.
- Create: `frontend/src/schemas/site-settings.schema.ts` - Zod validation and normalization for settings payloads.
- Create: `frontend/src/data/site-settings.json` - mock settings payload that replaces the role of `contact.json`.
- Create: `frontend/src/services/siteSettingsService.ts` - source switch and public/admin setting reads.
- Modify: `frontend/src/components/public/website/PublicContactPageLayout.tsx` - receive `contactSettings` via props.
- Modify: `frontend/src/components/public/website/PublicSectionRenderer.tsx` - receive or load normalized contact settings through a safe wrapper.
- Modify: `frontend/src/app/[locale]/(client)/contact/page.tsx` and `ContactContent.tsx` - load settings and pass them into the contact template.
- Modify: `frontend/src/components/admin/website/WebsitePreviewPanel.tsx` - provide mock/global contact settings to contact preview.
- Later admin UI: `frontend/src/app/[locale]/admin/website/settings/page.tsx` or a tab under admin website for editing global settings.

---

### Task 1: Define The Global Settings Contract

**Files:**
- Create: `frontend/src/types/site-settings.ts`
- Create: `frontend/src/schemas/site-settings.schema.ts`
- Create: `frontend/src/data/site-settings.json`

- [ ] **Step 1: Add TypeScript types**

Create `frontend/src/types/site-settings.ts`:

```ts
import type { LocalizedText } from "./common";

export interface SocialLinks {
  facebook?: string;
  messenger?: string;
  instagram?: string;
  line?: string;
  youtube?: string;
}

export interface OpeningHours {
  days: LocalizedText;
  time: string;
  remark?: LocalizedText;
}

export interface TransportInfo {
  parking?: LocalizedText;
  directionsUrl?: string;
  public?: Array<{
    icon: "train" | "bus" | "walk" | "car";
    text: LocalizedText;
  }>;
  car?: {
    text: LocalizedText;
  };
}

export interface MapSettings {
  embedUrl?: string;
  locationName?: string;
}

export interface BankAccountSettings {
  name: string;
  account?: string;
  iban?: string;
  bic?: string;
}

export interface GlobalContactSettings {
  address: LocalizedText;
  phone: string;
  email: string;
  social: SocialLinks;
  openingHours: OpeningHours;
  transport: TransportInfo;
  map: MapSettings;
  bank: BankAccountSettings;
}

export interface SiteSettings {
  contact: GlobalContactSettings;
}
```

- [ ] **Step 2: Add Zod schemas**

Create `frontend/src/schemas/site-settings.schema.ts`:

```ts
import { z } from "zod";

const localizedTextSchema = z.object({
  th: z.string().default(""),
  en: z.string().default(""),
  de: z.string().default(""),
});

export const globalContactSettingsSchema = z.object({
  address: localizedTextSchema,
  phone: z.string().default(""),
  email: z.string().email().or(z.literal("")).default(""),
  social: z
    .object({
      facebook: z.string().optional().default(""),
      messenger: z.string().optional().default(""),
      instagram: z.string().optional().default(""),
      line: z.string().optional().default(""),
      youtube: z.string().optional().default(""),
    })
    .default({}),
  openingHours: z.object({
    days: localizedTextSchema,
    time: z.string().default(""),
    remark: localizedTextSchema.optional(),
  }),
  transport: z
    .object({
      parking: localizedTextSchema.optional(),
      directionsUrl: z.string().optional().default(""),
      public: z
        .array(
          z.object({
            icon: z.enum(["train", "bus", "walk", "car"]),
            text: localizedTextSchema,
          }),
        )
        .optional()
        .default([]),
      car: z
        .object({
          text: localizedTextSchema,
        })
        .optional(),
    })
    .default({}),
  map: z
    .object({
      embedUrl: z.string().optional().default(""),
      locationName: z.string().optional().default(""),
    })
    .default({}),
  bank: z.object({
    name: z.string().default(""),
    account: z.string().optional().default(""),
    iban: z.string().optional().default(""),
    bic: z.string().optional().default(""),
  }),
});

export const siteSettingsSchema = z.object({
  contact: globalContactSettingsSchema,
});

export type GlobalContactSettingsFormData = z.infer<typeof globalContactSettingsSchema>;
```

- [ ] **Step 3: Add mock JSON**

Create `frontend/src/data/site-settings.json` by moving the current object from `frontend/src/data/contact.json` under a `contact` key:

```json
{
  "contact": {
    "address": {
      "th": "Buddhistisches Meditationszentrum e.V., Am Pflaster 11, 63599 Biebergemünd",
      "en": "Buddhistisches Meditationszentrum e.V., Am Pflaster 11, 63599 Biebergemünd",
      "de": "Buddhistisches Meditationszentrum e.V., Am Pflaster 11, 63599 Biebergemünd"
    },
    "phone": "0160-1604486",
    "email": "Watloungporsai@gmail.com",
    "social": {
      "facebook": "https://www.facebook.com/wat.loungporsai.9",
      "messenger": "Wat loung por sai",
      "instagram": "https://www.instagram.com/watloungporsai/"
    },
    "openingHours": {
      "days": {
        "th": "จันทร์ - อาทิตย์",
        "en": "Monday - Sunday",
        "de": "Montag - Sonntag"
      },
      "time": "09.00 - 21.00",
      "remark": {
        "th": "ปล. ยกเว้นวันที่พระมีกิจนิมนต์นอกวัด",
        "en": "Note: Except on days when the monk has an outside engagement",
        "de": "Hinweis: Außer an Tagen, an denen der Mönch auswärts beschäftigt ist"
      }
    },
    "transport": {
      "parking": {
        "th": "มีที่จอดรถภายในวัด",
        "en": "Parking available on-site",
        "de": "Parkplätze vor Ort verfügbar"
      },
      "directionsUrl": "https://www.google.com/maps/search/?api=1&query=Am+Pflaster+11,+63599+Biebergemünd",
      "public": [
        {
          "icon": "train",
          "text": {
            "th": "นั่งรถไฟ ลง สถานี Gelnhausen",
            "en": "Take the train to Gelnhausen Station",
            "de": "Fahren Sie mit der Bahn bis zum Bahnhof Gelnhausen"
          }
        },
        {
          "icon": "bus",
          "text": {
            "th": "ต่อรถเมล์ สาย MKK64 ลงป้าย Bieber Rathaus, Biebergemünd (วัดอยู่ตรงข้ามป้ายรถเมล์)",
            "en": "Transfer to Bus MKK64, get off at Bieber Rathaus, Biebergemünd (Temple is opposite the bus stop)",
            "de": "Nehmen Sie den Bus MKK64, steigen Sie an der Haltestelle Bieber Rathaus, Biebergemünd aus (Der Tempel befindet sich gegenüber)"
          }
        }
      ],
      "car": {
        "text": {
          "th": "รถยนต์ส่วนบุคคล เปิด GPS นำทางไปที่ 'Wat Loung Por Sai' หรือ 'Am Pflaster 11, 63599 Biebergemünd'",
          "en": "For personal car, enter 'Wat Loung Por Sai' or 'Am Pflaster 11, 63599 Biebergemünd' into your GPS",
          "de": "Wenn Sie mit dem Auto anreisen, geben Sie 'Wat Loung Por Sai' oder 'Am Pflaster 11, 63599 Biebergemünd' in Ihr GPS ein"
        }
      }
    },
    "map": {
      "embedUrl": "https://maps.google.com/maps?q=Am+Pflaster+11,+63599+Biebergemünd&t=&z=15&ie=UTF8&iwloc=&output=embed",
      "locationName": "Wat Loung Por Sai"
    },
    "bank": {
      "name": "Buddhistisches Meditationszentrum Verein e. V. / VR Bank",
      "account": "Wat Loung Por Sai",
      "iban": "DE05 5066 1639 0004 3138 60",
      "bic": "GENODEF1LSR"
    }
  }
}
```

- [ ] **Step 4: Verify JSON and types**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build still passes after adding files.

---

### Task 2: Add Site Settings Service

**Files:**
- Create: `frontend/src/services/siteSettingsService.ts`

- [ ] **Step 1: Add source switch service**

Create `frontend/src/services/siteSettingsService.ts`:

```ts
import api from "./api";
import { publicApi } from "./publicService";
import mockSiteSettings from "@/data/site-settings.json";
import { siteSettingsSchema, globalContactSettingsSchema } from "@/schemas/site-settings.schema";
import type { GlobalContactSettings, SiteSettings } from "@/types/site-settings";
import type { ApiResponse } from "@/types/api";

const useMockSiteSettings = process.env.NEXT_PUBLIC_WEBSITE_CMS_SOURCE !== "api";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function unwrapApiResponse<T>(response: ApiResponse<T>, fallbackMessage: string): T {
  if (!response.success || response.error || response.data === undefined || response.data === null) {
    throw new Error(response.error || fallbackMessage);
  }

  return response.data;
}

function normalizeSiteSettings(value: unknown): SiteSettings {
  return siteSettingsSchema.parse(value);
}

function normalizeContactSettings(value: unknown): GlobalContactSettings {
  return globalContactSettingsSchema.parse(value);
}

export const siteSettingsPublicService = {
  async getSettings() {
    if (useMockSiteSettings) {
      return normalizeSiteSettings(clone(mockSiteSettings));
    }

    const res = await publicApi.get<ApiResponse<SiteSettings>>("/settings");
    return normalizeSiteSettings(unwrapApiResponse(res.data, "Failed to fetch site settings"));
  },

  async getContactSettings() {
    if (useMockSiteSettings) {
      return normalizeContactSettings(clone(mockSiteSettings.contact));
    }

    const res = await publicApi.get<ApiResponse<GlobalContactSettings>>("/settings/contact");
    return normalizeContactSettings(unwrapApiResponse(res.data, "Failed to fetch contact settings"));
  },
};

export const siteSettingsAdminService = {
  async getContactSettings() {
    if (useMockSiteSettings) {
      return normalizeContactSettings(clone(mockSiteSettings.contact));
    }

    const res = await api.get<ApiResponse<GlobalContactSettings>>("/admin/website/settings/contact");
    return normalizeContactSettings(unwrapApiResponse(res.data, "Failed to fetch contact settings"));
  },

  async updateContactSettings(payload: GlobalContactSettings) {
    if (useMockSiteSettings) {
      return normalizeContactSettings(clone(payload));
    }

    const res = await api.put<ApiResponse<GlobalContactSettings>>("/admin/website/settings/contact", payload);
    return normalizeContactSettings(unwrapApiResponse(res.data, "Failed to update contact settings"));
  },
};
```

- [ ] **Step 2: Verify service compiles**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build passes.

---

### Task 3: Wire Public Contact Rendering To Global Settings

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/contact/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/contact/ContactContent.tsx`
- Modify: `frontend/src/components/public/website/PublicContactPageLayout.tsx`
- Modify: `frontend/src/components/public/website/PublicSectionRenderer.tsx`

- [ ] **Step 1: Load contact settings in route**

Modify contact page route to load both page content and global contact settings:

```ts
const [cmsPage, contactSettings] = await Promise.all([
  websiteCmsPublicService.getPage("contact").catch(() => null),
  siteSettingsPublicService.getContactSettings(),
]);
```

Pass `contactSettings` into `ContactContent`.

- [ ] **Step 2: Add contact settings prop**

Update `ContactContent` props:

```ts
interface ContactContentProps {
  locale: string;
  cmsPage: PublicContentPage | null;
  contactSettings: GlobalContactSettings;
}
```

Pass `contactSettings` to `PublicContactPageLayout`.

- [ ] **Step 3: Remove direct `contact.json` import from contact layout**

Update `PublicContactPageLayout` to accept:

```ts
contactSettings: GlobalContactSettings;
```

Replace all `contactData.*` reads with `contactSettings.*`.

- [ ] **Step 4: Keep page section overrides**

Preserve this behavior:

```ts
const address = readString(contactSection?.body.address) || getLocalizedText(contactSettings.address, locale);
const phone = readString(contactSection?.body.phone) || contactSettings.phone;
const email = readString(contactSection?.body.email) || contactSettings.email;
```

This keeps page-specific overrides possible without making global data live inside the page.

- [ ] **Step 5: Verify**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build passes, contact page still renders address/phone/email/social/bank.

---

### Task 4: Wire Admin Preview To Global Settings

**Files:**
- Modify: `frontend/src/components/admin/website/WebsitePreviewPanel.tsx`
- Modify if needed: `frontend/src/data/site-settings.json`

- [ ] **Step 1: Import mock settings for preview**

Admin preview is client-side and does not need an async settings fetch for phase 1. Import mock settings and parse it through Zod:

```ts
import mockSiteSettings from "@/data/site-settings.json";
import { globalContactSettingsSchema } from "@/schemas/site-settings.schema";

const previewContactSettings = globalContactSettingsSchema.parse(mockSiteSettings.contact);
```

- [ ] **Step 2: Pass settings to contact preview**

Pass:

```tsx
contactSettings={previewContactSettings}
```

to `PublicContactPageLayout`.

- [ ] **Step 3: Verify preview**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build passes and admin preview still renders contact details.

---

### Task 5: Add Admin Editing Screen Later

**Files:**
- Create: `frontend/src/app/[locale]/admin/website/settings/page.tsx`
- Create: `frontend/src/components/admin/website/settings/ContactSettingsForm.tsx`
- Create: `frontend/src/hooks/site-settings.ts`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

- [ ] **Step 1: Add query and mutation hooks**

Create `frontend/src/hooks/site-settings.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { siteSettingsAdminService } from "@/services/siteSettingsService";
import type { GlobalContactSettings } from "@/types/site-settings";

const siteSettingsKeys = {
  contact: ["site-settings", "contact"] as const,
};

export function useContactSettingsQuery() {
  return useQuery({
    queryKey: siteSettingsKeys.contact,
    queryFn: () => siteSettingsAdminService.getContactSettings(),
  });
}

export function useUpdateContactSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GlobalContactSettings) => siteSettingsAdminService.updateContactSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(siteSettingsKeys.contact, data);
    },
  });
}
```

- [ ] **Step 2: Add form UI**

Create `ContactSettingsForm` with React Hook Form and `zodResolver(globalContactSettingsSchema)`. Include fields for address per locale, phone, email, social links, opening hours, map URLs, and bank details.

- [ ] **Step 3: Add page route**

Create `admin/website/settings/page.tsx` that loads the query, renders loading/error states, and submits through mutation. Use toast for success/error.

- [ ] **Step 4: Verify**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build passes and the settings page can edit mock data in the same session.

---

### Task 6: Backend/API Contract For Later

**Files:**
- No frontend file edits required in this step.

- [ ] **Step 1: Backend endpoints to support**

Backend should eventually expose:

```text
GET /api/v1/public/settings
GET /api/v1/public/settings/contact
GET /api/v1/admin/website/settings/contact
PUT /api/v1/admin/website/settings/contact
```

- [ ] **Step 2: Database shape**

Recommended DB shape:

```text
website_settings
- id
- key
- value jsonb
- created_at
- updated_at
```

Rows:

```text
key = contact
value = GlobalContactSettings JSON
```

This avoids creating many columns for settings that may evolve.

---

### Task 7: Final Verification

**Files:**
- No new files unless fixes are needed.

- [ ] **Step 1: Search for direct `contact.json` imports**

Run:

```bash
cd frontend
rg "data/contact.json|contactData" src
```

Expected: no direct public template imports remain, except temporary compatibility files if intentionally kept.

- [ ] **Step 2: Production build**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build passes.

- [ ] **Step 3: Manual check**

Check:

```text
http://localhost:3000/th/contact
http://localhost:3000/th/admin/website/pages/PAGE-CONTACT
```

Expected: both pages show the same global contact data unless page section overrides are set.

---

## Self-Review

- Spec coverage: Covers where reusable contact data should live, mock-first frontend, API-ready service, public rendering, admin preview, and future admin editing.
- Placeholder scan: No placeholders remain; later backend/admin-edit tasks are explicitly scoped with concrete endpoints and file paths.
- Type consistency: Uses `GlobalContactSettings`, `SiteSettings`, `siteSettingsPublicService`, and `siteSettingsAdminService` consistently.
- Scope check: This is a focused settings migration, not a page builder or full backend implementation.
