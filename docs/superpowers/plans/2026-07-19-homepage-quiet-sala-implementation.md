# Homepage Quiet Sala Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This execution stays inline because the user declined sub-agents.

**Goal:** Deliver the approved Quiet Sala homepage journey with accurate localized content, resilient branding, practical visit guidance, distinctive project imagery, accessible dialogs, and motion-safe responsive behavior.

**Architecture:** Keep `HomeContent.tsx` as the composition root and preserve existing TanStack Query data sources. Add one focused `VisitSection` and one reusable native-dialog wrapper, then refine existing home components without changing CMS schemas or adding dependencies.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict mode, Tailwind CSS 4, next-intl, TanStack Query, Framer Motion, Lucide React.

## Global Constraints

- Support Thai, English, and German with equivalent intent and complete key sets.
- Keep exactly one page `h1` and target WCAG 2.2 AA.
- Do not add or change libraries.
- Use existing Faith Gold, Forest Calm, typography, spacing, and 12–16px content radii.
- Do not use gradient text, decorative grids, side-stripe accents, glassmorphism, identical feature-card grids, or repeated uppercase kickers.
- Use verified project-owned imagery and do not add generated or external images.
- Respect `prefers-reduced-motion`; content must remain visible without animation.
- Preserve existing TanStack Query hooks and public CMS/settings fallbacks.
- Commit each task independently; never combine all work into one commit.

---

## File Map

- `frontend/src/messages/{th,en,de}.json`: complete localized hero, welcome, events, visit, donation, navigation, and accessibility copy.
- `frontend/src/config/site.config.ts`: point logo fallbacks at an existing asset.
- `frontend/src/components/layout/Navbar.tsx`: resilient logo rendering and localized control names.
- `frontend/src/app/[locale]/(client)/HomeContent.tsx`: ordered homepage composition.
- `frontend/src/components/home/HeroSection.tsx`: promise-led hero and dual CTA hierarchy.
- `frontend/src/components/home/WelcomeSection.tsx`: documentary welcome composition.
- `frontend/src/components/home/EventsSection.tsx`: localized heading/action and event path.
- `frontend/src/components/home/VisitSection.tsx`: new settings-driven arrival section.
- `frontend/src/components/home/DonationSection.tsx`: quieter support surface and accessible QR dialog.
- `frontend/src/components/home/EventAlertModal.tsx`: accessible event alert dialog.
- `frontend/src/components/public/EventCard.tsx`: remove duplicated title treatment and normalize surface styling.
- `frontend/src/components/ui/AccessibleDialog.tsx`: native modal-dialog behavior shared by homepage dialogs.

---

### Task 1: Restore Trusted Localized Content and Branding

**Files:**
- Modify: `frontend/src/messages/th.json:25-73`
- Modify: `frontend/src/messages/en.json:25-73`
- Modify: `frontend/src/messages/de.json:25-73`
- Modify: `frontend/src/config/site.config.ts:61-64`
- Modify: `frontend/src/components/layout/Navbar.tsx:1-137`

**Interfaces:**
- Consumes: existing `Site`, `HeroSection`, `WelcomeSection`, `EventsSection`, `DonationSection`, and `Navbar` translation namespaces.
- Produces: complete TH/EN/DE copy plus a Navbar logo that falls back to `/images/icon/logo.png` after a failed CMS URL.

- [ ] **Step 1: Record the failing trust signals**

Run:

```bash
cd frontend
rg -n 'สระบุรี|Supporting Wat Loung Por Sai|Upcoming Events & Ceremonies|logo-light.svg|logo-dark.svg' src/messages src/config/site.config.ts
```

Expected: matches in `th.json` and `site.config.ts`, proving the known defects are present.

- [ ] **Step 2: Correct the localized copy and add the planned keys**

Add equivalent values to all three locales:

```json
{
  "HeroSection": {
    "promise": "พื้นที่แห่งการปฏิบัติ เพื่อความสงบและความสุขที่แท้จริง",
    "planVisit": "วางแผนการเดินทางมาวัด"
  },
  "WelcomeSection": {
    "description": "วัดหลวงพ่อใสเป็นศูนย์ปฏิบัติธรรมพระพุทธศาสนาเถรวาทสายวัดป่า ณ เมือง Biebergemünd ประเทศเยอรมนี เปิดต้อนรับทั้งผู้ที่คุ้นเคยกับการปฏิบัติและผู้ที่เพิ่งเริ่มสนใจ"
  },
  "EventsSection": {
    "subtitle": "เลือกกิจกรรมที่เหมาะกับคุณ แล้วเริ่มต้นการปฏิบัติร่วมกับชุมชนของวัด"
  },
  "DonationSection": {
    "subtitle": "ร่วมสนับสนุนกิจของวัด",
    "channelHint": "เลือกช่องทางที่เหมาะกับประเทศและธนาคารของคุณ"
  },
  "Navbar": {
    "openMenu": "เปิดเมนู",
    "closeMenu": "ปิดเมนู",
    "switchTheme": "สลับโหมดสี",
    "switchLanguage": "เปลี่ยนภาษา"
  }
}
```

Use these exact EN values:

```json
{
  "HeroSection": { "promise": "A place of practice for genuine peace and lasting well-being.", "planVisit": "Plan your visit" },
  "WelcomeSection": { "description": "Wat Loung Por Sai is a Theravada forest-tradition practice center in Biebergemünd, Germany. We welcome experienced practitioners and people who are beginning to explore Buddhist practice." },
  "EventsSection": { "subtitle": "Find an activity that suits you and begin practicing with the temple community." },
  "DonationSection": { "subtitle": "Support the temple's work", "channelHint": "Choose the channel that suits your country and bank." },
  "Navbar": { "openMenu": "Open menu", "closeMenu": "Close menu", "switchTheme": "Switch color theme", "switchLanguage": "Change language" }
}
```

Use these exact DE values:

```json
{
  "HeroSection": { "promise": "Ein Ort der Praxis für echten Frieden und nachhaltiges Wohlbefinden.", "planVisit": "Besuch planen" },
  "WelcomeSection": { "description": "Wat Loung Por Sai ist ein Praxiszentrum der Theravada-Waldtradition in Biebergemünd. Willkommen sind erfahrene Praktizierende ebenso wie Menschen, die buddhistische Praxis neu kennenlernen." },
  "EventsSection": { "subtitle": "Finden Sie eine passende Veranstaltung und praktizieren Sie gemeinsam mit der Tempelgemeinschaft." },
  "DonationSection": { "subtitle": "Die Arbeit des Tempels unterstützen", "channelHint": "Wählen Sie den Zahlungsweg, der zu Ihrem Land und Ihrer Bank passt." },
  "Navbar": { "openMenu": "Menü öffnen", "closeMenu": "Menü schließen", "switchTheme": "Farbschema wechseln", "switchLanguage": "Sprache ändern" }
}
```

- [ ] **Step 3: Point static logo fallbacks at the existing asset**

Change `siteConfig.logo` to:

```ts
logo: {
  light: "/images/icon/logo.png",
  dark: "/images/icon/logo.png",
},
```

- [ ] **Step 4: Add one-step runtime fallback in Navbar**

Introduce a focused logo component/state that renders the CMS URL first and switches to the static asset on error:

```tsx
const fallbackLogo = "/images/icon/logo.png";
const [logoSrc, setLogoSrc] = useState(settings.logoUrl || fallbackLogo);

useEffect(() => {
  setLogoSrc(settings.logoUrl || fallbackLogo);
}, [settings.logoUrl]);

<Image
  src={logoSrc}
  alt={getLocalizedText(siteConfig.siteName, locale)}
  width={40}
  height={40}
  onError={() => setLogoSrc(fallbackLogo)}
  className="object-cover"
/>
```

Guard the error handler so a failed fallback cannot loop.

- [ ] **Step 5: Verify locale parity and targeted lint**

Run:

```bash
cd frontend
node -e "const fs=require('fs'); const files=['th','en','de'].map(x=>'src/messages/'+x+'.json'); const data=files.map(x=>JSON.parse(fs.readFileSync(x,'utf8'))); const keys=x=>Object.keys(x).sort().join('|'); for(const ns of ['HeroSection','WelcomeSection','EventsSection','DonationSection','Navbar']) if(new Set(data.map(x=>keys(x[ns]))).size!==1) throw new Error(ns+' key mismatch')"
npx eslint src/components/layout/Navbar.tsx src/config/site.config.ts
rg -n 'สระบุรี|logo-light.svg|logo-dark.svg' src/messages src/config/site.config.ts
```

Expected: JSON/parity and ESLint commands pass; final `rg` prints no matches.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json frontend/src/config/site.config.ts frontend/src/components/layout/Navbar.tsx
git commit -m "fix(home): restore trusted localized content and branding"
```

---

### Task 2: Guide Visitors from Discovery to Arrival

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/HomeContent.tsx`
- Modify: `frontend/src/components/home/HeroSection.tsx`
- Modify: `frontend/src/components/home/WelcomeSection.tsx`
- Modify: `frontend/src/components/home/EventsSection.tsx`
- Create: `frontend/src/components/home/VisitSection.tsx`
- Modify: `frontend/src/components/home/DonationSection.tsx`
- Modify: `frontend/src/components/public/EventCard.tsx`
- Modify: `frontend/src/messages/{th,en,de}.json`

**Interfaces:**
- Consumes: `usePublicSiteSettings()`, `useLocale()`, `useTranslations()`, `getLocalizedText()`, existing event/contact queries, and `/contact` route.
- Produces: `VisitSection(): React.JSX.Element` and the ordered Discover → Understand → Participate → Prepare → Support journey.

- [ ] **Step 1: Add complete `VisitSection` translations**

Add a `VisitSection` namespace with the same keys in every locale:

```json
{
  "VisitSection": {
    "title": "เตรียมตัวมาเยือนวัด",
    "description": "ดูที่อยู่ การเดินทาง และข้อมูลที่ควรรู้ก่อนมาร่วมกิจกรรมหรือปฏิบัติธรรม",
    "addressLabel": "ที่ตั้งวัด",
    "addressFallback": "ดูที่อยู่และข้อมูลการเดินทางฉบับเต็มได้ในหน้าติดต่อ",
    "planVisit": "วางแผนการเดินทาง",
    "contact": "ติดต่อวัด"
  }
}
```

EN:

```json
{
  "VisitSection": {
    "title": "Plan your visit",
    "description": "Find the address, travel information, and practical details before joining an event or practice session.",
    "addressLabel": "Temple address",
    "addressFallback": "See the contact page for the full address and travel information.",
    "planVisit": "Plan your journey",
    "contact": "Contact the temple"
  }
}
```

DE:

```json
{
  "VisitSection": {
    "title": "Besuch vorbereiten",
    "description": "Hier finden Sie Adresse, Anreiseinformationen und praktische Hinweise vor einer Veranstaltung oder Praxiszeit.",
    "addressLabel": "Adresse des Tempels",
    "addressFallback": "Die vollständige Adresse und Anreiseinformationen finden Sie auf der Kontaktseite.",
    "planVisit": "Anreise planen",
    "contact": "Tempel kontaktieren"
  }
}
```

- [ ] **Step 2: Implement the settings-driven Visit section**

Create a semantic, dependency-light component:

```tsx
"use client";

import { ArrowUpRight, MapPin, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { usePublicSiteSettings } from "@/features/public/settings/PublicSiteSettingsProvider";
import { getLocalizedText } from "@/utils/localizedText";

export default function VisitSection() {
  const locale = useLocale();
  const t = useTranslations("VisitSection");
  const settings = usePublicSiteSettings();
  const address = getLocalizedText(settings.address, locale) || t("addressFallback");

  return (
    <section className="bg-secondary text-white" aria-labelledby="visit-title">
      <div className="container mx-auto flex flex-col gap-10 px-4 py-16 md:px-6 lg:flex-row lg:items-end lg:justify-between lg:py-20">
        <div className="max-w-2xl">
          <h2 id="visit-title" className="text-balance font-heading text-3xl font-bold md:text-5xl">{t("title")}</h2>
          <p className="mt-5 max-w-2xl text-pretty text-lg text-white/85">{t("description")}</p>
          <div className="mt-8 flex items-start gap-3 text-white/90">
            <MapPin aria-hidden="true" className="mt-1 shrink-0" size={20} />
            <div><p className="text-sm font-semibold">{t("addressLabel")}</p><p className="mt-1 text-pretty">{address}</p></div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            {t("planVisit")}<ArrowUpRight aria-hidden="true" size={18} />
          </Link>
          <Link href="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/45 px-6 py-3 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <MessageCircle aria-hidden="true" size={18} />{t("contact")}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Recompose the homepage**

Import and place `<VisitSection />` between Events and Donation in `HomeContent.tsx`.

- [ ] **Step 4: Refine Hero into dual-action discovery**

- Replace the repeated `{title}` paragraph content with `t("promise")`.
- Add `/contact` as the secondary CTA using `t("planVisit")`.
- Replace `h-screen` with `min-h-[100svh]` and balanced/pretty wrapping.
- Keep one `h1`; keep the short welcome line as a paragraph, not a section heading.

- [ ] **Step 5: Replace Welcome cards with documentary composition**

- Use `next/image` with `/images/gallery/common/LINE_ALBUM_1262026_260208_10.jpg`.
- Use one `h2`, one body paragraph, and a semantic `ul` of the three existing themes.
- Use a two-column composition at `lg`; do not wrap the themes in cards and do not render emoji.

- [ ] **Step 6: Clarify Events and event cards**

- Add a localized “view all” link to `/events` beside/below the section heading.
- Remove the duplicated event-title chip from the image.
- Keep the event title as `h3` and use either a border or a resting shadow, not both.
- Normalize radius to `rounded-xl` or `rounded-2xl` only where it remains within 16px.

- [ ] **Step 7: Quiet the Donation section**

- Change the section title from `h1` to `h2`.
- Add `channelHint` close to the payment choices.
- Replace `rounded-3xl` with `rounded-2xl` or smaller.
- Remove decorative wide shadows and keep existing query/error/empty behavior intact.

- [ ] **Step 8: Verify composition and commit**

Run:

```bash
cd frontend
npx eslint 'src/app/[locale]/(client)/HomeContent.tsx' src/components/home/HeroSection.tsx src/components/home/WelcomeSection.tsx src/components/home/EventsSection.tsx src/components/home/VisitSection.tsx src/components/home/DonationSection.tsx src/components/public/EventCard.tsx
node -e "for (const f of ['th','en','de']) JSON.parse(require('fs').readFileSync('src/messages/'+f+'.json','utf8'))"
```

Expected: both commands pass.

Commit:

```bash
git add 'frontend/src/app/[locale]/(client)/HomeContent.tsx' frontend/src/components/home frontend/src/components/public/EventCard.tsx frontend/src/messages
git commit -m "feat(home): guide visitors from discovery to arrival"
```

---

### Task 3: Make Homepage Motion and Dialogs Accessible

**Files:**
- Create: `frontend/src/components/ui/AccessibleDialog.tsx`
- Modify: `frontend/src/components/home/EventAlertModal.tsx`
- Modify: `frontend/src/components/home/DonationSection.tsx`
- Modify: `frontend/src/components/home/HeroSection.tsx`
- Modify: `frontend/src/components/home/WelcomeSection.tsx`
- Modify: `frontend/src/components/layout/Navbar.tsx`

**Interfaces:**
- Produces: `AccessibleDialog({ isOpen, onClose, title, description?, children, className? })`.
- Consumes: the event and QR dialog states already owned by their feature components.

- [ ] **Step 1: Record current semantic failures**

Run:

```bash
cd frontend
rg -n '<h1|role="dialog"|rounded-3xl|animate=|whileInView|aria-label' src/components/home src/components/layout/Navbar.tsx
```

Expected: multiple `h1`/motion instances and custom dialog markup are present.

- [ ] **Step 2: Build the native dialog wrapper**

Implement `AccessibleDialog.tsx` with:

```tsx
"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface AccessibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeLabel: string;
  children: ReactNode;
  className?: string;
}

export function AccessibleDialog({
  isOpen,
  onClose,
  title,
  description,
  closeLabel,
  children,
  className,
}: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      dialog.showModal();
      closeButtonRef.current?.focus();

      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    if (!isOpen && dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) returnFocusRef.current?.focus();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-2xl bg-white p-0 text-zinc-950 shadow-2xl backdrop:bg-black/70 dark:bg-zinc-900 dark:text-white"
    >
      <div className={cn("relative", className)}>
        <div className="sr-only">
          <h2 id={titleId}>{title}</h2>
          {description ? <p id={descriptionId}>{description}</p> : null}
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full bg-black/55 text-white transition-colors duration-150 hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X aria-hidden="true" size={20} />
        </button>
        {children}
      </div>
    </dialog>
  );
}
```

The native modal dialog supplies focus trapping. The effect supplies scroll locking and focus restoration without adding a dependency.

- [ ] **Step 3: Migrate both homepage dialogs**

- Wrap event alert contents in `AccessibleDialog` and preserve dismissal timing/local storage.
- Wrap the QR image in the same component and keep its trigger buttons unchanged.
- Ensure each title is passed as plain localized text and each trigger regains focus after close.

- [ ] **Step 4: Make motion preference-aware**

Use `useReducedMotion()` in each Framer Motion component:

```tsx
const shouldReduceMotion = useReducedMotion();

initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
animate={{ opacity: 1, y: 0 }}
transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }}
```

Remove repeated section entrances where motion adds no information. Disable the scroll-indicator loop when reduced motion is requested.

- [ ] **Step 5: Complete navigation names and states**

- Add localized `aria-label` to the mobile menu button.
- Add `aria-expanded` and `aria-controls` to the mobile menu trigger.
- Give the mobile overlay the matching `id`.
- Localize theme and language control labels.
- Mark decorative icons `aria-hidden="true"`.
- Keep icon-only targets at least 44×44px.

- [ ] **Step 6: Verify semantics and commit**

Run:

```bash
cd frontend
npx eslint src/components/ui/AccessibleDialog.tsx src/components/home/EventAlertModal.tsx src/components/home/DonationSection.tsx src/components/home/HeroSection.tsx src/components/home/WelcomeSection.tsx src/components/layout/Navbar.tsx
rg -n '<h1' src/components/home
```

Expected: ESLint passes and `rg` returns exactly one match in `HeroSection.tsx`.

Commit:

```bash
git add frontend/src/components/ui/AccessibleDialog.tsx frontend/src/components/home/EventAlertModal.tsx frontend/src/components/home/DonationSection.tsx frontend/src/components/home/HeroSection.tsx frontend/src/components/home/WelcomeSection.tsx frontend/src/components/layout/Navbar.tsx
git commit -m "fix(a11y): make homepage motion and dialogs accessible"
```

---

### Task 4: Verify and Apply Isolated Responsive Polish

**Files:**
- Modify only files with defects demonstrated by this task's browser evidence.
- Archive: `.impeccable/critique/` snapshot already produced for the target.

**Interfaces:**
- Consumes: completed homepage implementation.
- Produces: verified responsive, multilingual homepage with no new runtime failures.

- [ ] **Step 1: Run static verification**

Run:

```bash
cd frontend
npm run lint
npm run build
node /Users/syaco/.agents/skills/impeccable/scripts/detect.mjs --json 'src/app/[locale]/(client)/HomeContent.tsx' src/components/home src/components/public/EventCard.tsx
```

Expected: lint and build pass; detector output is reviewed as evidence rather than treated as proof of quality.

- [ ] **Step 2: Inspect all supported locales and viewports**

Start the production server and inspect:

- `/th`, `/en`, `/de`
- 390×844 mobile
- 768×1024 tablet
- 1280×720 desktop

For every combination verify:

- one visible `h1`;
- no broken images;
- no horizontal overflow;
- primary and secondary CTAs remain visible;
- German titles wrap without clipping;
- Visit appears before Donation;
- dark and light theme text remains readable.

- [ ] **Step 3: Complete keyboard and dialog walkthrough**

Verify Tab order, visible focus, mobile menu state, Escape/backdrop/close-button behavior, initial dialog focus, trigger focus restoration, and cookie-consent reachability.

- [ ] **Step 4: Verify reduced motion**

Emulate `prefers-reduced-motion: reduce` and confirm content is visible immediately, the hero scroll indicator does not loop, and no section depends on an entrance animation to appear.

- [ ] **Step 5: Make only evidence-backed corrections**

If browser evidence finds spacing, wrapping, contrast, or touch-target defects, edit the owning component only. Do not introduce new sections or alter the approved journey.

- [ ] **Step 6: Re-run verification and commit only if corrections were required**

```bash
git add -p frontend/src/components/home frontend/src/components/layout/Navbar.tsx frontend/src/components/public/EventCard.tsx
git commit -m "style(home): polish responsive homepage presentation"
```

If no corrections are required, do not create an empty commit.

---

## Plan Self-Review

- **Spec coverage:** Trust/content, logo fallback, journey order, documentary imagery, Visit section, donation hierarchy, single `h1`, motion preferences, dialogs, navigation labels, responsive testing, and commit separation are each assigned to a task.
- **Placeholder scan:** No TBD/TODO, wildcard implementation instruction, or deferred code remains. Task 4 uses interactive staging so only evidence-backed corrections enter its optional commit.
- **Type consistency:** `VisitSection` uses the existing `PublicSiteSettings` and `LocalizedText` interfaces. `AccessibleDialog` has one stable prop contract consumed by both owning components.
- **Scope:** No CMS schema, backend endpoint, dependency, or unrelated public route changes are included.
