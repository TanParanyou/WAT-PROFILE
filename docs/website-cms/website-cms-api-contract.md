# Website CMS API Contract

Date: 2026-06-28
Status: FE-approved mock-first contract, backend pending

## Rule

Frontend components do not know whether data comes from mock JSON or API. Backend must implement the same response shapes used by `frontend/src/services/websiteCmsService.ts`.

## Response Envelope

```ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  fields?: Record<string, string>;
}
```

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

## Data Shape Notes

- Field names use `snake_case`.
- `LocalizedText` is a keyed object such as `{ "th": "...", "en": "..." }`.
- `status` is one of `draft`, `published`, or `archived`.
- Admin endpoints return draft fields and published snapshot fields.
- Public endpoints return published fields only and exclude archived sections.
- Unknown section-specific data lives in `body` and `settings`; FE validates known section types with Zod.

## Example: Admin Page Response

`GET /api/v1/admin/website/pages/PAGE-CONTACT`

```json
{
  "success": true,
  "data": {
    "id": "PAGE-CONTACT",
    "page_key": "PAGE-CONTACT",
    "slug": "contact",
    "title": {
      "th": "Contact",
      "en": "Contact"
    },
    "description": {
      "th": "Contact the temple team",
      "en": "Contact the temple team"
    },
    "seo": {
      "title": {
        "th": "Contact",
        "en": "Contact"
      },
      "description": {
        "th": "Address, phone, map, and contact channels.",
        "en": "Address, phone, map, and contact channels."
      },
      "canonical_url": "https://example.org/contact",
      "og_image": "https://example.org/images/contact-og.jpg",
      "noindex": false
    },
    "body": {},
    "settings": {},
    "status": "draft",
    "published_title": {
      "th": "Contact",
      "en": "Contact"
    },
    "published_description": {
      "th": "Contact the temple team",
      "en": "Contact the temple team"
    },
    "published_seo": {
      "title": {
        "th": "Contact",
        "en": "Contact"
      },
      "description": {
        "th": "Address, phone, map, and contact channels.",
        "en": "Address, phone, map, and contact channels."
      },
      "canonical_url": "https://example.org/contact",
      "og_image": "https://example.org/images/contact-og.jpg",
      "noindex": false
    },
    "published_body": {},
    "published_settings": {},
    "published_at": "2026-06-28T08:00:00.000Z",
    "created_at": "2026-06-01T08:00:00.000Z",
    "updated_at": "2026-06-28T08:20:00.000Z",
    "sections": [
      {
        "id": "SEC-CONTACT-HERO",
        "page_id": "PAGE-CONTACT",
        "section_key": "contact-hero",
        "section_type": "hero",
        "title": {
          "th": "Contact Us",
          "en": "Contact Us"
        },
        "description": {
          "th": "We are here to help.",
          "en": "We are here to help."
        },
        "body": {
          "eyebrow": {
            "th": "Contact",
            "en": "Contact"
          },
          "headline": {
            "th": "Visit or message us",
            "en": "Visit or message us"
          },
          "image_url": "https://example.org/images/contact-hero.jpg"
        },
        "settings": {
          "layout": "image-right"
        },
        "sort_order": 1,
        "status": "draft",
        "published_title": {
          "th": "Contact Us",
          "en": "Contact Us"
        },
        "published_description": {
          "th": "We are here to help.",
          "en": "We are here to help."
        },
        "published_body": {
          "eyebrow": {
            "th": "Contact",
            "en": "Contact"
          },
          "headline": {
            "th": "Visit or message us",
            "en": "Visit or message us"
          },
          "image_url": "https://example.org/images/contact-hero.jpg"
        },
        "published_settings": {
          "layout": "image-right"
        },
        "published_at": "2026-06-28T08:00:00.000Z",
        "created_at": "2026-06-01T08:00:00.000Z",
        "updated_at": "2026-06-28T08:20:00.000Z"
      }
    ]
  }
}
```

## Example: Update Page

`PUT /api/v1/admin/website/pages/PAGE-CONTACT`

```json
{
  "title": {
    "th": "Contact",
    "en": "Contact"
  },
  "description": {
    "th": "Address, phone, map, and contact channels.",
    "en": "Address, phone, map, and contact channels."
  },
  "seo": {
    "title": {
      "th": "Contact Wat Example",
      "en": "Contact Wat Example"
    },
    "description": {
      "th": "Find address, phone, map, and official contact channels.",
      "en": "Find address, phone, map, and official contact channels."
    },
    "canonical_url": "https://example.org/contact",
    "og_image": "https://example.org/images/contact-og.jpg",
    "noindex": false
  },
  "body": {},
  "settings": {}
}
```

Response returns the full updated `ContentPage`.

## Example: Create Section

`POST /api/v1/admin/website/pages/PAGE-CONTACT/sections`

```json
{
  "section_type": "contact_cards",
  "section_key": "contact-cards",
  "sort_order": 3
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "SEC-CONTACT-CARDS",
    "page_id": "PAGE-CONTACT",
    "section_key": "contact-cards",
    "section_type": "contact_cards",
    "title": {
      "th": "",
      "en": ""
    },
    "description": {
      "th": "",
      "en": ""
    },
    "body": {},
    "settings": {},
    "sort_order": 3,
    "status": "draft",
    "published_at": null,
    "created_at": "2026-06-28T08:30:00.000Z",
    "updated_at": "2026-06-28T08:30:00.000Z"
  }
}
```

## Example: Update Section

`PUT /api/v1/admin/website/sections/SEC-CONTACT-CARDS`

```json
{
  "title": {
    "th": "Contact Channels",
    "en": "Contact Channels"
  },
  "description": {
    "th": "Choose the most convenient channel.",
    "en": "Choose the most convenient channel."
  },
  "body": {
    "items": [
      {
        "label": {
          "th": "Phone",
          "en": "Phone"
        },
        "value": "+66 00 000 0000",
        "href": "tel:+66000000000"
      },
      {
        "label": {
          "th": "Email",
          "en": "Email"
        },
        "value": "contact@example.org",
        "href": "mailto:contact@example.org"
      }
    ]
  },
  "settings": {
    "columns": 2
  },
  "sort_order": 3,
  "status": "draft"
}
```

Response returns the full updated `ContentSection`.

## Example: Archive And Restore Section

Archive:

`POST /api/v1/admin/website/sections/SEC-CONTACT-CARDS/archive`

```json
{
  "archived": true
}
```

Restore:

`POST /api/v1/admin/website/sections/SEC-CONTACT-CARDS/restore`

```json
{
  "archived": false
}
```

Both responses return the full updated `ContentSection`.

## Example: Duplicate Section

`POST /api/v1/admin/website/sections/SEC-CONTACT-CARDS/duplicate`

```json
{
  "section_key": "contact-cards-copy"
}
```

Response returns the newly created `ContentSection`.

## Example: Reorder Sections

`PUT /api/v1/admin/website/pages/PAGE-CONTACT/sections/reorder`

```json
{
  "section_ids": [
    "SEC-CONTACT-HERO",
    "SEC-CONTACT-MAP",
    "SEC-CONTACT-CARDS"
  ]
}
```

Response returns the full updated `ContentPage` with normalized `sort_order` values.

## Example: Publish Page

`POST /api/v1/admin/website/pages/PAGE-CONTACT/publish`

```json
{
  "success": true,
  "data": {
    "id": "PAGE-CONTACT",
    "status": "published",
    "published_at": "2026-06-28T09:00:00.000Z"
  }
}
```

The real response should include the full `ContentPage`; the abbreviated object above shows the fields that must change.

## Example: Public Page Response

`GET /api/v1/public/pages/contact`

```json
{
  "success": true,
  "data": {
    "id": "PAGE-CONTACT",
    "page_key": "PAGE-CONTACT",
    "slug": "contact",
    "title": {
      "th": "Contact",
      "en": "Contact"
    },
    "description": {
      "th": "Contact the temple team",
      "en": "Contact the temple team"
    },
    "seo": {
      "title": {
        "th": "Contact Wat Example",
        "en": "Contact Wat Example"
      },
      "description": {
        "th": "Find address, phone, map, and official contact channels.",
        "en": "Find address, phone, map, and official contact channels."
      },
      "canonical_url": "https://example.org/contact",
      "og_image": "https://example.org/images/contact-og.jpg",
      "noindex": false
    },
    "body": {},
    "settings": {},
    "status": "published",
    "published_at": "2026-06-28T09:00:00.000Z",
    "sections": [
      {
        "id": "SEC-CONTACT-HERO",
        "page_id": "PAGE-CONTACT",
        "section_key": "contact-hero",
        "section_type": "hero",
        "title": {
          "th": "Contact Us",
          "en": "Contact Us"
        },
        "description": {
          "th": "We are here to help.",
          "en": "We are here to help."
        },
        "body": {
          "eyebrow": {
            "th": "Contact",
            "en": "Contact"
          },
          "headline": {
            "th": "Visit or message us",
            "en": "Visit or message us"
          },
          "image_url": "https://example.org/images/contact-hero.jpg"
        },
        "settings": {
          "layout": "image-right"
        },
        "sort_order": 1,
        "status": "published",
        "created_at": "2026-06-01T08:00:00.000Z",
        "updated_at": "2026-06-28T09:00:00.000Z"
      }
    ]
  }
}
```

## Example: Validation Error

```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Please review the highlighted fields.",
  "fields": {
    "seo.title.th": "SEO title is required.",
    "sections.0.body.image_url": "Image URL must be a valid URL."
  }
}
```

## Publish Behavior

Publishing copies draft page fields to published page fields and copies each active section draft payload to published section payloads. Public endpoints read published fields only.

## Deferred Backend Work

Permissions, audit/history, and Supabase-specific persistence are not part of this FE contract hardening phase.
