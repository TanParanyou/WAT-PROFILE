# Client Theme Exploration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated, full-page Next.js prototype with four genuinely different client homepage themes and an instant keyboard-accessible picker.

**Architecture:** Add a locale-aware prototype route outside the production `(client)` layout at `src/app/[locale]/prototypes/client-theme-exploration/`. A client-side harness owns only the active variant key; static content and real image paths live in one typed data module so every design is compared with identical information. Each direction has its own component and CSS Module, while the picker and surrounding prototype chrome remain visually neutral.

**Tech Stack:** Next.js 16 App Router, React 19, strict TypeScript, CSS Modules, `next/font/google`, Node 22 test runner, existing local gallery assets.

## Global Constraints

- Do not modify production client components, shared design tokens, API clients, CMS contracts, or backend code.
- Use only real images under `frontend/public/images/gallery/common/` and `frontend/public/images/gallery/before_buying_2018/`.
- Do not use `hero-bg.*` or `gallery/1.png` through `gallery/6.png`.
- Use identical Thai content and image sources in all four variants.
- Primary CTA: `ดูกิจกรรมและเข้าร่วมปฏิบัติธรรม`.
- Secondary CTA: `วางแผนการเดินทางมาวัด`.
- Preserve at least 44px touch targets, visible keyboard focus, and `prefers-reduced-motion`.
- Verify layouts at 390px, 768px, and 1440px.
- Do not add dependencies.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.

---

## File Structure

| File | Responsibility |
|---|---|
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/page.tsx` | Route metadata, font variables, and prototype entry point |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/ThemeExploration.tsx` | Active variant state, picker wiring, and variant rendering |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/ThemePicker.tsx` | Neutral fixed picker with click and keyboard controls |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/prototype-data.ts` | Shared typed content, image paths, and variant registry |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts` | Registry, content parity, CTA, and real-image guard tests |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/prototype-shell.module.css` | Picker, focus, viewport, and reduced-motion chrome |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/ForestThreshold.tsx` | “ร่มไม้ก่อนเข้าศาลา” markup |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/forest-threshold.module.css` | Immersive forest direction |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/LivingCommunity.tsx` | “วัดที่มีชีวิต” markup |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/living-community.module.css` | Community and schedule-first direction |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/ContemporaryPractice.tsx` | “สำนักปฏิบัติร่วมสมัย” markup |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/contemporary-practice.module.css` | Architectural asymmetric direction |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/OneBreathMinimal.tsx` | “หนึ่งภาพ หนึ่งลมหายใจ” markup |
| `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/one-breath-minimal.module.css` | Essential minimal direction |

---

### Task 1: Establish shared prototype data and invariants

**Files:**
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/prototype-data.ts`
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts`

**Interfaces:**
- Produces: `ThemeVariantKey`, `THEME_VARIANTS`, `PROTOTYPE_CONTENT`, `PrototypeEvent`, `PrototypeContent`
- Consumes: no project runtime dependencies

- [ ] **Step 1: Write the failing registry and content tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { PROTOTYPE_CONTENT, THEME_VARIANTS } from "./prototype-data.ts";

test("exposes four unique theme directions in picker order", () => {
  assert.deepEqual(
    THEME_VARIANTS.map(({ key }) => key),
    ["forest", "community", "practice", "minimal"],
  );
  assert.equal(new Set(THEME_VARIANTS.map(({ key }) => key)).size, 4);
});

test("keeps the approved primary and secondary calls to action", () => {
  assert.equal(
    PROTOTYPE_CONTENT.primaryCta,
    "ดูกิจกรรมและเข้าร่วมปฏิบัติธรรม",
  );
  assert.equal(
    PROTOTYPE_CONTENT.secondaryCta,
    "วางแผนการเดินทางมาวัด",
  );
});

test("uses only approved real gallery images", () => {
  const imagePaths = [
    PROTOTYPE_CONTENT.heroImage,
    PROTOTYPE_CONTENT.storyImage,
    PROTOTYPE_CONTENT.visitImage,
    ...PROTOTYPE_CONTENT.events.map(({ image }) => image),
  ];

  for (const imagePath of imagePaths) {
    assert.match(
      imagePath,
      /^\/images\/gallery\/(common|before_buying_2018)\//,
    );
    assert.doesNotMatch(imagePath, /hero-bg|\/gallery\/[1-6]\.png/);
  }
});

test("provides exactly three realistic upcoming events", () => {
  assert.equal(PROTOTYPE_CONTENT.events.length, 3);
  for (const event of PROTOTYPE_CONTENT.events) {
    assert.ok(event.title.length > 5);
    assert.ok(event.dateLabel.length > 5);
    assert.ok(event.summary.length > 20);
  }
});
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run:

```bash
cd frontend && node --experimental-strip-types --test 'src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts'
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `prototype-data.ts`.

- [ ] **Step 3: Add the typed variant registry and shared content**

```ts
export type ThemeVariantKey =
  | "forest"
  | "community"
  | "practice"
  | "minimal";

export type ThemeVariant = {
  key: ThemeVariantKey;
  name: string;
  axis: string;
};

export type PrototypeEvent = {
  dateLabel: string;
  title: string;
  summary: string;
  image: string;
};

export type PrototypeContent = {
  templeName: string;
  location: string;
  message: string;
  introduction: string;
  primaryCta: string;
  secondaryCta: string;
  heroImage: string;
  storyImage: string;
  visitImage: string;
  events: readonly PrototypeEvent[];
};

export const THEME_VARIANTS = [
  { key: "forest", name: "ร่มไม้ก่อนเข้าศาลา", axis: "Immersive" },
  { key: "community", name: "วัดที่มีชีวิต", axis: "Community" },
  { key: "practice", name: "สำนักปฏิบัติร่วมสมัย", axis: "Architectural" },
  { key: "minimal", name: "หนึ่งภาพ หนึ่งลมหายใจ", axis: "Minimal" },
] as const satisfies readonly ThemeVariant[];

export const PROTOTYPE_CONTENT: PrototypeContent = {
  templeName: "วัดหลวงพ่อใส",
  location: "Großkrotzenburg · Germany",
  message: "พื้นที่แห่งการปฏิบัติ เพื่อความสงบและความสุขที่แท้จริง",
  introduction:
    "พื้นที่เปิดสำหรับทุกคนที่อยากเรียนรู้การเจริญสติ ทำความรู้จักพระพุทธศาสนาเถรวาทสายวัดป่า และค่อย ๆ เริ่มต้นการปฏิบัติในจังหวะของตนเอง",
  primaryCta: "ดูกิจกรรมและเข้าร่วมปฏิบัติธรรม",
  secondaryCta: "วางแผนการเดินทางมาวัด",
  heroImage: "/images/gallery/common/LINE_ALBUM_1262026_260208_17.jpg",
  storyImage: "/images/gallery/common/LINE_ALBUM_1262026_260208_1.jpg",
  visitImage:
    "/images/gallery/before_buying_2018/LINE_ALBUM_ภาพที่หลวงปู่ทิวาไปดูก่อนซื้อปี 2018_260208_1.jpg",
  events: [
    {
      dateLabel: "เสาร์ 8 สิงหาคม · 09:30",
      title: "วันภาวนาและเจริญสติ",
      summary:
        "เริ่มต้นด้วยการทำวัตร นั่งสมาธิ และสนทนาธรรม เหมาะสำหรับทั้งผู้เริ่มต้นและผู้ที่ปฏิบัติเป็นประจำ",
      image: "/images/gallery/common/LINE_ALBUM_1262026_260208_6.jpg",
    },
    {
      dateLabel: "อาทิตย์ 16 สิงหาคม · 10:00",
      title: "ทำบุญและถวายภัตตาหาร",
      summary:
        "ร่วมทำบุญ ฟังธรรม และพบปะชุมชนไทย–เยอรมัน กรุณามาถึงก่อนเริ่มกิจกรรม 20 นาที",
      image: "/images/gallery/common/LINE_ALBUM_1262026_260208_12.jpg",
    },
    {
      dateLabel: "เสาร์ 29 สิงหาคม · 18:00",
      title: "สวดมนต์เย็นและนั่งสมาธิ",
      summary:
        "ช่วงเย็นที่เรียบง่ายสำหรับพักจากความเร่งรีบ มีคำแนะนำเบื้องต้นเป็นภาษาไทยและเยอรมัน",
      image: "/images/gallery/common/LINE_ALBUM_1262026_260208_20.jpg",
    },
  ],
};
```

- [ ] **Step 4: Run the data tests**

Run:

```bash
cd frontend && node --experimental-strip-types --test 'src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts'
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit the shared contract**

```bash
git add 'frontend/src/app/[locale]/prototypes/client-theme-exploration/prototype-data.ts' 'frontend/src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts'
git commit -m "test(public): define theme prototype contract"
```

---

### Task 2: Build the isolated route, neutral picker, and font setup

**Files:**
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/page.tsx`
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/ThemeExploration.tsx`
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/ThemePicker.tsx`
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/prototype-shell.module.css`

**Interfaces:**
- Consumes: `ThemeVariantKey`, `THEME_VARIANTS`
- Produces: `ThemeExploration`, `ThemePicker`

- [ ] **Step 1: Add the locale-aware route and font variables**

```tsx
import type { Metadata } from "next";
import {
  Anuphan,
  Bai_Jamjuree,
  Noto_Sans_Thai,
  Trirong,
} from "next/font/google";
import ThemeExploration from "./ThemeExploration";

const body = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--prototype-font-body",
  display: "swap",
});
const forestDisplay = Trirong({
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  variable: "--prototype-font-forest",
  display: "swap",
});
const community = Anuphan({
  subsets: ["thai", "latin"],
  variable: "--prototype-font-community",
  display: "swap",
});
const practice = Bai_Jamjuree({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--prototype-font-practice",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Client Theme Exploration · Wat Loung Por Sai",
  robots: { index: false, follow: false },
};

export default function ClientThemeExplorationPage() {
  return (
    <div
      className={[
        body.variable,
        forestDisplay.variable,
        community.variable,
        practice.variable,
      ].join(" ")}
    >
      <ThemeExploration />
    </div>
  );
}
```

- [ ] **Step 2: Add a neutral fixed picker with radio semantics**

```tsx
"use client";

import type { ThemeVariantKey } from "./prototype-data";
import { THEME_VARIANTS } from "./prototype-data";
import styles from "./prototype-shell.module.css";

type ThemePickerProps = {
  active: ThemeVariantKey;
  onChange: (key: ThemeVariantKey) => void;
};

export default function ThemePicker({
  active,
  onChange,
}: ThemePickerProps) {
  return (
    <div className={styles.picker} role="radiogroup" aria-label="เลือกแนวทางดีไซน์">
      <span className={styles.pickerLabel}>Theme</span>
      {THEME_VARIANTS.map((variant, index) => (
        <button
          key={variant.key}
          type="button"
          role="radio"
          aria-checked={active === variant.key}
          className={styles.pickerButton}
          data-active={active === variant.key}
          onClick={() => onChange(variant.key)}
        >
          <span aria-hidden="true">{index + 1}</span>
          <span>{variant.name}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Add the harness with instant switching and arrow-key shortcuts**

```tsx
"use client";

import { useEffect, useState } from "react";
import ThemePicker from "./ThemePicker";
import type { ThemeVariantKey } from "./prototype-data";
import styles from "./prototype-shell.module.css";

const variantKeys: readonly ThemeVariantKey[] = [
  "forest",
  "community",
  "practice",
  "minimal",
];

export default function ThemeExploration() {
  const [active, setActive] = useState<ThemeVariantKey>("forest");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      const current = variantKeys.indexOf(active);
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = (current + delta + variantKeys.length) % variantKeys.length;
      setActive(variantKeys[next]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  return (
    <main className={styles.canvas} data-theme-variant={active}>
      <ThemePicker active={active} onChange={setActive} />
      <div className={styles.stage} aria-live="polite">
        กำลังเตรียม {active}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Add neutral shell styles**

```css
.canvas {
  min-height: 100svh;
  font-family: var(--prototype-font-body), sans-serif;
}

.picker {
  position: fixed;
  inset: auto 50% 16px auto;
  z-index: 80;
  display: flex;
  max-width: calc(100vw - 24px);
  min-height: 48px;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  padding: 5px;
  transform: translateX(50%);
  border-radius: 12px;
  background: #151515;
  color: #fff;
  box-shadow: 0 4px 8px rgb(0 0 0 / 22%);
}

.pickerLabel {
  padding-inline: 10px 6px;
  color: #b8b8b8;
  font-size: 12px;
}

.pickerButton {
  min-height: 38px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #d8d8d8;
  padding: 7px 10px;
  font: inherit;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}

.pickerButton span:first-child {
  margin-right: 6px;
  color: #8f8f8f;
}

.pickerButton[data-active="true"] {
  background: #fff;
  color: #151515;
}

.pickerButton:focus-visible {
  outline: 2px solid #80a7ff;
  outline-offset: 2px;
}

.stage {
  display: grid;
  min-height: 100svh;
  place-items: center;
}

@media (max-width: 720px) {
  .picker {
    inset: auto 8px 8px 8px;
    transform: none;
  }

  .pickerLabel {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .picker,
  .pickerButton {
    scroll-behavior: auto;
    transition: none;
  }
}
```

- [ ] **Step 5: Run type-check and lint**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit && npm run lint
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit the isolated harness**

```bash
git add 'frontend/src/app/[locale]/prototypes/client-theme-exploration'
git commit -m "feat(public): add client theme prototype harness"
```

---

### Task 3: Implement “ร่มไม้ก่อนเข้าศาลา” and “วัดที่มีชีวิต”

**Files:**
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/ForestThreshold.tsx`
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/forest-threshold.module.css`
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/LivingCommunity.tsx`
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/living-community.module.css`
- Modify: `frontend/src/app/[locale]/prototypes/client-theme-exploration/ThemeExploration.tsx`

**Interfaces:**
- Consumes: `PrototypeContent`, `PROTOTYPE_CONTENT`
- Produces: `ForestThreshold({ content })`, `LivingCommunity({ content })`

- [ ] **Step 1: Build the immersive forest component**

Implement `ForestThreshold.tsx` with this exact section order:

```tsx
import type { PrototypeContent } from "../prototype-data";
import styles from "./forest-threshold.module.css";

export default function ForestThreshold({
  content,
}: {
  content: PrototypeContent;
}) {
  return (
    <article className={styles.page}>
      <header className={styles.nav}>
        <a href="#forest-top" className={styles.brand}>{content.templeName}</a>
        <nav aria-label="เมนูหลัก">
          <a href="#forest-story">รู้จักวัด</a>
          <a href="#forest-events">กิจกรรม</a>
          <a href="#forest-visit">การเดินทาง</a>
        </nav>
        <button type="button" aria-label="เปลี่ยนภาษา">TH · EN · DE</button>
      </header>
      <section id="forest-top" className={styles.hero}>
        <img src={content.heroImage} alt="พระสงฆ์ภายในวัดหลวงพ่อใส" />
        <div className={styles.heroCopy}>
          <p>{content.location}</p>
          <h1>{content.message}</h1>
          <div className={styles.actions}>
            <a href="#forest-events">{content.primaryCta}</a>
            <a href="#forest-visit">{content.secondaryCta}</a>
          </div>
        </div>
      </section>
      <section id="forest-story" className={styles.story}>
        <div>
          <h2>เริ่มต้นจากความสงบที่เข้าถึงได้</h2>
          <p>{content.introduction}</p>
        </div>
        <img src={content.storyImage} alt="อาคารวัดหลวงพ่อใสในเยอรมนี" />
      </section>
      <section id="forest-events" className={styles.events}>
        <h2>ก้าวต่อไปของการปฏิบัติ</h2>
        {content.events.map((event) => (
          <article key={event.title}>
            <img src={event.image} alt="" />
            <div>
              <p>{event.dateLabel}</p>
              <h3>{event.title}</h3>
              <p>{event.summary}</p>
            </div>
          </article>
        ))}
      </section>
      <section id="forest-visit" className={styles.visit}>
        <img src={content.visitImage} alt="พื้นที่ตั้งวัดในเยอรมนี" />
        <div>
          <h2>มาอย่างที่คุณเป็น</h2>
          <p>แต่งกายสุภาพ มาถึงก่อนกิจกรรม และแจ้งเราได้หากเป็นการมาเยือนครั้งแรก</p>
          <a href="#forest-top">{content.secondaryCta}</a>
        </div>
      </section>
      <footer className={styles.footer}>
        <strong>{content.templeName}</strong>
        <p>ร่วมรักษาพื้นที่แห่งการปฏิบัติให้เปิดต้อนรับทุกคน</p>
        <button type="button">ดูช่องทางสนับสนุนวัด</button>
      </footer>
    </article>
  );
}
```

Style it with:

- `#09271e` drenched hero and footer surfaces, `#d8ff55` only for actions.
- Full-bleed 100svh hero with a solid `rgb(4 20 15 / 58%)` image veil.
- Trirong display font, maximum heading `clamp(3rem, 7vw, 6rem)`, letter spacing no tighter than `-0.03em`.
- Alternating image/text story and event rows, not equal cards.
- 12px maximum content radius and no border-plus-wide-shadow combination.
- One 700ms clip-path hero reveal; disable it under reduced motion.

- [ ] **Step 2: Build the community-first component**

Implement `LivingCommunity.tsx` with the same data, but this order:

1. Compact white navigation.
2. Split hero: message and CTAs left, real community image right.
3. A blue schedule rail showing all three dates immediately.
4. “ครั้งแรกที่มาวัด” three-step preparation list.
5. A wide yellow visit CTA.
6. A compact support/footer block.

Use semantic headings, anchors to `#community-events` and `#community-visit`, and the same accessible language button pattern as Task 3 Step 1.

Style it with:

- `#244b70` blue, `#ffcf47` yellow, `#f9fbff` near-white, `#172534` ink.
- Anuphan for headings and body.
- A two-column split hero above 900px and one column below it.
- Schedule items as horizontal rows separated by blue rules, not identical cards.
- Buttons at least 44px high with a 2px blue focus ring.
- Only hover/focus transitions under 220ms; no page entrance animation.

- [ ] **Step 3: Connect the four variant components to the harness**

```tsx
import ContemporaryPractice from "./variants/ContemporaryPractice";
import ForestThreshold from "./variants/ForestThreshold";
import LivingCommunity from "./variants/LivingCommunity";
import OneBreathMinimal from "./variants/OneBreathMinimal";
import { PROTOTYPE_CONTENT } from "./prototype-data";

// Inside ThemeExploration, add:
const renderVariant = () => {
  switch (active) {
    case "forest":
      return <ForestThreshold content={PROTOTYPE_CONTENT} />;
    case "community":
      return <LivingCommunity content={PROTOTYPE_CONTENT} />;
    case "practice":
      return <ContemporaryPractice content={PROTOTYPE_CONTENT} />;
    case "minimal":
      return <OneBreathMinimal content={PROTOTYPE_CONTENT} />;
  }
};

// Render:
<div aria-live="polite">{renderVariant()}</div>
```

During this task, create these two short intermediate components so type-check remains green. Task 4 replaces both bodies completely:

```tsx
// variants/ContemporaryPractice.tsx
import type { PrototypeContent } from "../prototype-data";

export default function ContemporaryPractice({
  content,
}: {
  content: PrototypeContent;
}) {
  return (
    <section aria-labelledby="practice-heading">
      <h1 id="practice-heading">{content.templeName} · สำนักปฏิบัติร่วมสมัย</h1>
    </section>
  );
}
```

```tsx
// variants/OneBreathMinimal.tsx
import type { PrototypeContent } from "../prototype-data";

export default function OneBreathMinimal({
  content,
}: {
  content: PrototypeContent;
}) {
  return (
    <section aria-labelledby="minimal-heading">
      <h1 id="minimal-heading">{content.templeName} · หนึ่งภาพ หนึ่งลมหายใจ</h1>
    </section>
  );
}
```

- [ ] **Step 4: Run focused verification**

Run:

```bash
cd frontend && node --experimental-strip-types --test 'src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts' && ./node_modules/.bin/tsc --noEmit && npm run lint
```

Expected: 4 tests PASS; type-check and lint exit 0.

- [ ] **Step 5: Inspect forest and community at 390px and 1440px**

Run the existing dev server:

```bash
cd frontend && npm run dev
```

Open `/th/prototypes/client-theme-exploration`, switch between variants 1 and 2, and verify:

- All shared content appears.
- The picker remains reachable and does not cover the primary CTA.
- Thai headings do not overflow.
- Tab order follows visual order.
- ArrowLeft/ArrowRight switch variants instantly.
- Browser console has no errors.

- [ ] **Step 6: Commit the first two directions**

```bash
git add 'frontend/src/app/[locale]/prototypes/client-theme-exploration'
git commit -m "feat(public): add immersive and community theme mocks"
```

---

### Task 4: Implement “สำนักปฏิบัติร่วมสมัย” and “หนึ่งภาพ หนึ่งลมหายใจ”

**Files:**
- Replace: `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/ContemporaryPractice.tsx`
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/contemporary-practice.module.css`
- Replace: `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/OneBreathMinimal.tsx`
- Create: `frontend/src/app/[locale]/prototypes/client-theme-exploration/variants/one-breath-minimal.module.css`

**Interfaces:**
- Consumes: `PrototypeContent`
- Produces: completed `ContemporaryPractice({ content })`, `OneBreathMinimal({ content })`

- [ ] **Step 1: Build the architectural direction**

Implement `ContemporaryPractice.tsx` with:

1. A left-aligned masthead and compact right navigation.
2. An asymmetric hero with the heading crossing a wine surface and a documentary image without overlapping readable body copy.
3. A numbered event index where numbers represent the real chronological sequence.
4. A two-column “แนวทาง / การมาเยือน” information section.
5. A full-width oxide support action and dark footer.

Use the exact shared CTA strings, event content, and image paths from `content`.

Style it with:

- `#3a121d` wine, `#ff765d` oxide, `#d8d5cf` stone, `#171516` ink.
- Bai Jamjuree throughout, with weight and scale—not a second font—creating hierarchy.
- An intentional 12-column grid at desktop, reducing to one column below 760px.
- Square image crops and 0–8px radii; do not add decorative rounded cards.
- A 500ms masked image reveal and 180ms control transitions, both disabled under reduced motion.
- Focus indicators in `#ff765d` with at least 2px thickness.

- [ ] **Step 2: Build the essential minimal direction**

Implement `OneBreathMinimal.tsx` with:

1. A single-line navigation with a plain text temple mark.
2. A white hero containing the message, two text-forward CTAs, and one portrait image.
3. One prose introduction with a 65ch maximum.
4. Events rendered as a ruled list—date, title, summary—with no image cards.
5. One full-width real image between events and visit information.
6. A minimal visit/support footer separated by a 1px ink rule.

Style it with:

- `#ffffff` surface, `#20211f` ink, `#2457c5` lapis, `#ecece8` rule.
- Noto Sans Thai only.
- Heading maximum `clamp(2.75rem, 6vw, 5.5rem)` and letter spacing `-0.025em`.
- Lapis on links, focus, and the primary action only; keep it below 10% of the visible surface.
- No card grid, drop shadow, decorative icon, or entrance animation.
- `text-wrap: balance` for headings and `text-wrap: pretty` for prose.

- [ ] **Step 3: Run automated verification**

Run:

```bash
cd frontend && node --experimental-strip-types --test 'src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts' && ./node_modules/.bin/tsc --noEmit && npm run lint && npm run build
```

Expected: 4 tests PASS; type-check, lint, and build exit 0.

- [ ] **Step 4: Inspect all four variants and all target widths**

At `/th/prototypes/client-theme-exploration`, inspect each direction at:

- 390 × 844
- 768 × 1024
- 1440 × 1000

For every direction:

- Confirm all six homepage sections are present.
- Confirm no horizontal overflow.
- Confirm picker, navigation, and CTA touch targets are at least 44px.
- Confirm the primary and secondary CTA remain obvious without looking commercial.
- Confirm image alt text is meaningful; decorative event thumbnails use empty alt.
- Confirm reduced-motion mode preserves all content.
- Confirm the browser console remains clean.

- [ ] **Step 5: Commit the final two directions**

```bash
git add 'frontend/src/app/[locale]/prototypes/client-theme-exploration'
git commit -m "feat(public): add architectural and minimal theme mocks"
```

---

### Task 5: Capture evidence and hand off the picker

**Files:**
- Create: `docs/superpowers/specs/2026-07-30-client-theme-exploration-review.md`

**Interfaces:**
- Consumes: completed route and four variants
- Produces: visual review checklist and screenshot locations

- [ ] **Step 1: Capture eight screenshots**

Use the browser tooling to capture desktop 1440px and mobile 390px screenshots for:

- `forest`
- `community`
- `practice`
- `minimal`

Store screenshots outside source control under `.superpowers/brainstorm/` and record their absolute paths in the review document.

- [ ] **Step 2: Write the review handoff**

Create the review document with this structure:

```md
# Client Theme Exploration Review

Prototype URL: `http://localhost:<port>/th/prototypes/client-theme-exploration`

| Direction | Axis | Wins when | Cost | Desktop | Mobile |
|---|---|---|---|---|---|
| ร่มไม้ก่อนเข้าศาลา | Immersive | Atmosphere should lead | Image crop is critical | `<path>` | `<path>` |
| วัดที่มีชีวิต | Community | New visitors need fast answers | Less contemplative | `<path>` | `<path>` |
| สำนักปฏิบัติร่วมสมัย | Architectural | Distinction is the priority | Can feel serious | `<path>` | `<path>` |
| หนึ่งภาพ หนึ่งลมหายใจ | Minimal | Clarity and extensibility lead | Least emotionally dramatic | `<path>` | `<path>` |

Keyboard: ArrowLeft / ArrowRight switches direction; Tab reaches picker controls.

Verification:
- [x] 390px
- [x] 768px
- [x] 1440px
- [x] Reduced motion
- [x] Keyboard
- [x] Clean console
```

- [ ] **Step 3: Run final repository checks**

Run:

```bash
git diff --check
cd frontend && node --experimental-strip-types --test 'src/app/[locale]/prototypes/client-theme-exploration/prototype-data.test.ts' && ./node_modules/.bin/tsc --noEmit && npm run lint && npm run build
```

Expected: no whitespace errors; 4 tests PASS; type-check, lint, and build exit 0.

- [ ] **Step 4: Commit the review handoff**

```bash
git add docs/superpowers/specs/2026-07-30-client-theme-exploration-review.md
git commit -m "docs: add client theme visual review"
```

- [ ] **Step 5: Present the four choices and stop**

Provide the live prototype URL, picker keyboard controls, the four-row trade-off table, and screenshot links. Do not promote or modify production code until the user explicitly selects a direction.
