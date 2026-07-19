# Public Landing HTML Mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade standalone HTML landing-page mock for Wat Loung Por Sai without modifying the current Next.js application.

**Architecture:** One self-contained document at `docs/website-cms/mockups/public-landing.html` owns semantic HTML, embedded CSS, and optional-enhancement JavaScript. It references existing image assets with paths relative to the mock file and uses anchored sections so it works directly from disk without a server.

**Tech Stack:** HTML5, modern CSS, vanilla JavaScript, existing PNG/JPG assets, browser-native accessibility APIs.

## Global Constraints

- Treat `docs/superpowers/specs/2026-07-18-public-landing-html-mock-design.md` as the visual and behavioral contract.
- Use Thai presentation copy and real project contact, schedule, and travel information.
- Keep the mock independent from Next.js, APIs, CMS state, and build tooling.
- Support widths from 320px upward; verify at 390px, 768px, and 1440px.
- Meet WCAG 2.2 AA, provide one H1, a skip link, native controls, visible focus, and reduced-motion behavior.
- Use existing imagery from `frontend/public/images`; do not introduce generated placeholders or a second icon library.
- Use Faith Gold `#C88D1E` for guidance only; do not make the body a cream or parchment field.
- Cards and ordinary containers use 12–16px radii; pills are reserved for compact actions and labels.
- Do not use gradient text, side-stripe accents, decorative grids, repeating stripes, glassmorphism, or identical card grids.

---

### Task 1: Semantic Landing Structure and Real Content

**Files:**
- Create: `docs/website-cms/mockups/public-landing.html`

**Interfaces:**
- Consumes: images under `../../../frontend/public/images/` relative to the mock file.
- Produces: section anchors `#about`, `#events`, `#visit`, and `#contact`; mobile-menu hooks `#menu-toggle` and `#primary-nav`.

- [ ] **Step 1: Write the structural smoke check before the file exists**

Run:

```bash
node -e "const fs=require('fs'); const p='docs/website-cms/mockups/public-landing.html'; if(!fs.existsSync(p)) throw new Error('landing mock missing')"
```

Expected: FAIL with `landing mock missing`.

- [ ] **Step 2: Create the complete semantic document shell**

Create the document with this exact landmark and anchor contract:

```html
<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="วัดหลวงพ่อใส ศูนย์ปฏิบัติธรรมสายวัดป่าเถรวาทในเยอรมนี">
  <title>วัดหลวงพ่อใส · พื้นที่แห่งการปฏิบัติ</title>
  <style>/* Task 2 fills the production visual system. */</style>
</head>
<body>
  <a class="skip-link" href="#main-content">ข้ามไปยังเนื้อหาหลัก</a>
  <header class="site-header" data-header>
    <a class="brand" href="#top" aria-label="วัดหลวงพ่อใส หน้าแรก">วัดหลวงพ่อใส</a>
    <button id="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">เมนู</button>
    <nav id="primary-nav" aria-label="เมนูหลัก">
      <a href="#about">รู้จักวัด</a><a href="#events">กิจกรรม</a><a href="#visit">การเดินทาง</a><a href="#contact">ติดต่อ</a>
    </nav>
  </header>
  <main id="main-content">
    <section id="top" class="hero" aria-labelledby="hero-title"></section>
    <section id="about" aria-labelledby="about-title"></section>
    <section id="events" aria-labelledby="events-title"></section>
    <section id="visit" aria-labelledby="visit-title"></section>
    <section id="contact" aria-labelledby="contact-title"></section>
  </main>
  <footer></footer>
  <script>/* Task 3 adds optional enhancement. */</script>
</body>
</html>
```

Populate each section with the exact content and hierarchy from the spec: one hero H1, one featured activity, a chronological activity list, first-visit guidance, contact links, and legal footer links. Use native `<time>`, `<address>`, `<a>`, and `<button>` elements. Use these real destinations:

```html
<a href="tel:+491601604486">0160-1604486</a>
<a href="mailto:Watloungporsai@gmail.com">Watloungporsai@gmail.com</a>
<a href="https://www.facebook.com/wat.loungporsai.9" target="_blank" rel="noopener noreferrer">Facebook</a>
```

- [ ] **Step 3: Reference real imagery with accessible metadata**

Use the exact relative-path pattern and explicit dimensions:

```html
<img src="../../../frontend/public/images/gallery/1.png" width="1200" height="900" loading="lazy" alt="ผู้มาร่วมกิจกรรมภายในบริเวณวัดหลวงพ่อใส">
```

Use `../../../frontend/public/images/hero-bg.jpg` as the CSS hero background, `gallery/1.png` for the welcome composition, and existing event images for activity content.

- [ ] **Step 4: Run semantic smoke checks**

Run:

```bash
node -e "const fs=require('fs'); const s=fs.readFileSync('docs/website-cms/mockups/public-landing.html','utf8'); const must=['<header','<nav','<main','<footer','id=\"about\"','id=\"events\"','id=\"visit\"','id=\"contact\"','skip-link']; for(const x of must) if(!s.includes(x)) throw new Error('missing '+x); const h1=(s.match(/<h1\b/g)||[]).length; if(h1!==1) throw new Error('expected one h1, found '+h1); console.log('semantic structure valid')"
```

Expected: `semantic structure valid`.

- [ ] **Step 5: Commit semantic structure**

```bash
git add docs/website-cms/mockups/public-landing.html
git commit -m "feat: add public landing mock structure"
```

### Task 2: Production Visual System and Responsive Composition

**Files:**
- Modify: `docs/website-cms/mockups/public-landing.html`

**Interfaces:**
- Consumes: semantic classes and anchors from Task 1.
- Produces: CSS tokens, desktop/tablet/mobile compositions, visible focus states, and image treatments.

- [ ] **Step 1: Add the normative CSS token block**

Add this block at the start of the embedded stylesheet:

```css
:root {
  --gold: #c88d1e;
  --gold-deep: #a97016;
  --forest: #4a6741;
  --ink: #2b1f08;
  --muted-ink: #644d26;
  --canvas: #ffffff;
  --surface: #f7f7f4;
  --line: #dedbd3;
  --night: #160e03;
  --radius-sm: 12px;
  --radius-md: 16px;
  --max-width: 1200px;
  --ease-out: cubic-bezier(.22, 1, .36, 1);
}
```

- [ ] **Step 2: Implement the hero and navigation composition**

The hero must use the real image and a contrast overlay, with visible content even when JavaScript is unavailable:

```css
.hero {
  min-height: 760px;
  display: grid;
  align-items: end;
  color: #fff;
  background:
    linear-gradient(90deg, rgba(16, 12, 5, .82) 0%, rgba(16, 12, 5, .44) 58%, rgba(16, 12, 5, .22) 100%),
    url('../../../frontend/public/images/hero-bg.jpg') center / cover no-repeat;
}
.hero h1 {
  max-width: 13ch;
  font-size: clamp(3rem, 7vw, 6rem);
  letter-spacing: -.03em;
  text-wrap: balance;
}
```

Keep the navigation transparent over the hero and apply `.is-scrolled` as a solid surface with a structural shadow no larger than `0 4px 8px rgba(22,14,3,.10)`.

- [ ] **Step 3: Implement asymmetric section rhythm**

Use two-column welcome, featured-event-plus-list, practical visit rows, and a committed closing CTA. Do not create a repeated equal-card grid. Use CSS Grid only for two-dimensional compositions and Flexbox for linear rows.

```css
.about-layout { display: grid; grid-template-columns: minmax(0, .85fr) minmax(320px, 1.15fr); gap: clamp(2rem, 6vw, 6rem); }
.events-layout { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(280px, .75fr); gap: clamp(1.5rem, 4vw, 3.5rem); }
.event-list > article { display: grid; grid-template-columns: 7rem 1fr; gap: 1rem; border-top: 1px solid var(--line); padding: 1.25rem 0; }
```

- [ ] **Step 4: Add responsive composition and reduced motion**

Use these exact behavior thresholds:

```css
@media (max-width: 900px) {
  .about-layout, .events-layout { grid-template-columns: 1fr; }
}
@media (max-width: 680px) {
  .hero { min-height: 680px; }
  #primary-nav { display: none; }
  #primary-nav.is-open { display: flex; }
  .event-list > article { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
```

- [ ] **Step 5: Run static CSS guard checks**

Run:

```bash
node -e "const s=require('fs').readFileSync('docs/website-cms/mockups/public-landing.html','utf8'); const banned=['background-clip: text','repeating-linear-gradient','border-left: 4px','feTurbulence']; for(const x of banned) if(s.includes(x)) throw new Error('banned pattern '+x); if(!s.includes('prefers-reduced-motion')) throw new Error('missing reduced motion'); if(!s.includes('@media (max-width: 680px)')) throw new Error('missing mobile composition'); console.log('CSS guards valid')"
```

Expected: `CSS guards valid`.

- [ ] **Step 6: Commit visual system**

```bash
git add docs/website-cms/mockups/public-landing.html
git commit -m "feat: style production landing mock"
```

### Task 3: Optional-Enhancement Interactions

**Files:**
- Modify: `docs/website-cms/mockups/public-landing.html`

**Interfaces:**
- Consumes: `#menu-toggle`, `#primary-nav`, `[data-header]`, and anchor links from Tasks 1–2.
- Produces: `setMenu(open: boolean): void` and scroll-state class `.is-scrolled`.

- [ ] **Step 1: Add accessible mobile menu behavior**

Add this exact interaction contract to the embedded script:

```js
const toggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#primary-nav');
const header = document.querySelector('[data-header]');

function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  if (!open) toggle.focus({ preventScroll: true });
}

toggle.addEventListener('click', () => {
  setMenu(toggle.getAttribute('aria-expanded') !== 'true');
});

nav.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false);
});

const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });
```

- [ ] **Step 2: Add non-gating reveal enhancement**

The base state must remain visible. Use `.reveal-ready` only to enhance elements currently intersecting, and skip the observer when reduced motion is requested.

```js
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .16 });
  document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
}
```

- [ ] **Step 3: Run interaction contract checks**

Run:

```bash
node -e "const s=require('fs').readFileSync('docs/website-cms/mockups/public-landing.html','utf8'); const must=['function setMenu(open)','aria-expanded','event.key === \'Escape\'','passive: true','IntersectionObserver','prefers-reduced-motion']; for(const x of must) if(!s.includes(x)) throw new Error('missing interaction '+x); console.log('interaction contract valid')"
```

Expected: `interaction contract valid`.

- [ ] **Step 4: Commit interactions**

```bash
git add docs/website-cms/mockups/public-landing.html
git commit -m "feat: add landing mock interactions"
```

### Task 4: Browser QA and Production Polish

**Files:**
- Modify if defects are found: `docs/website-cms/mockups/public-landing.html`

**Interfaces:**
- Consumes: completed standalone mock.
- Produces: verified responsive and accessible presentation.

- [ ] **Step 1: Run the Impeccable detector**

Run:

```bash
node /Users/syaco/.agents/skills/impeccable/scripts/detect.mjs --json docs/website-cms/mockups/public-landing.html
```

Expected: valid JSON output. Treat every reported finding as defect evidence; fix applicable contrast, overflow, hierarchy, slop-pattern, and accessibility findings.

- [ ] **Step 2: Serve the repository for browser inspection**

Run from the repository root:

```bash
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173/docs/website-cms/mockups/public-landing.html
```

- [ ] **Step 3: Inspect required viewports**

Check 390×844, 768×1024, and 1440×1000. At each viewport confirm:

```text
document.documentElement.scrollWidth === document.documentElement.clientWidth
document.querySelectorAll('h1').length === 1
all referenced images report naturalWidth > 0
```

Also inspect hero text contrast, navigation, section rhythm, image crops, long labels, footer, and 200% zoom.

- [ ] **Step 4: Verify keyboard interaction and console**

Use Tab, Shift+Tab, Enter, Space, and Escape. Confirm the skip link, mobile menu, CTA links, Facebook link, phone link, and email link work without traps. Confirm the browser console has zero page errors.

- [ ] **Step 5: Patch every material defect and repeat the affected viewport check**

For each defect, make the smallest source edit in `public-landing.html`, reload the browser, and repeat the check that exposed it. Do not change the approved composition unless the defect cannot be resolved within it.

- [ ] **Step 6: Run final verification**

Run:

```bash
node -e "const fs=require('fs'); const p='docs/website-cms/mockups/public-landing.html'; const s=fs.readFileSync(p,'utf8'); if((s.match(/<h1\b/g)||[]).length!==1) throw new Error('invalid h1 count'); for(const x of ['hero-bg.jpg','gallery/1.png','prefers-reduced-motion','skip-link','function setMenu(open)']) if(!s.includes(x)) throw new Error('missing '+x); console.log('landing mock source verification passed')"
git diff --check -- docs/website-cms/mockups/public-landing.html
```

Expected: `landing mock source verification passed` and no `git diff --check` output.

- [ ] **Step 7: Commit QA fixes**

```bash
git add docs/website-cms/mockups/public-landing.html
git commit -m "fix: polish responsive landing mock"
```
