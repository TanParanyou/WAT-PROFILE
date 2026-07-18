# Public Landing HTML Mock Design

Date: 2026-07-18  
Project: WAT-PROFILE  
Deliverable: `docs/website-cms/mockups/public-landing.html`

## Objective

Create a production-grade, standalone HTML mock of the Wat Loung Por Sai public landing page. The mock exists to make the approved visual direction tangible without changing the current Next.js application.

The page must communicate the product promise within ten seconds: “พื้นที่แห่งการปฏิบัติ เพื่อความสงบและความสุขที่แท้จริง.” It should then guide visitors from trust and orientation toward viewing activities, planning a visit, or contacting the temple.

## Scope

The deliverable is one self-contained HTML file with embedded CSS and minimal embedded JavaScript. It opens directly from disk, uses existing project imagery through relative paths, and remains independent of the Next.js runtime, APIs, authentication, and CMS.

The mock demonstrates visual design only. It uses Thai content as the primary presentation language and may show a non-functional language indicator, but it does not implement multilingual content switching, API loading, forms, donation transactions, or CMS editing.

## Creative Direction

**North star: “ศาลาแห่งความสงบ — The Quiet Sala.”**

The interface behaves like a welcoming sala: the entrance is visible, the atmosphere is calm, and the next meaningful action is always clear. Real temple and activity imagery carries cultural identity. Faith Gold (`#C88D1E`) guides attention but never becomes decorative luxury.

The design must feel calm, sincere, and open. It must not resemble a generic temple template, a commercial luxury landing page, or a collection of interchangeable cards.

## Page Composition

### 1. Navigation and Hero

- Transparent navigation sits over a full-bleed temple photograph and becomes visually solid when the page scrolls.
- The brand lockup uses the existing logo, temple name, and Germany location.
- Desktop navigation exposes the primary destinations. Mobile navigation becomes an accessible disclosure menu with touch targets of at least 44px.
- One H1 carries the remembered line. Supporting copy identifies Wat Loung Por Sai as a Theravada forest-tradition practice center in Germany.
- Primary CTA: “ดูกิจกรรมและเข้าร่วมปฏิบัติธรรม.”
- Secondary CTA: “วางแผนการเดินทาง.”
- The hero image receives a directional dark overlay that guarantees readable text without hiding the photograph.

### 2. Welcome and Positioning

- A concise two-column composition introduces the temple and its practice-led purpose.
- One real image or image pair provides evidence of place and community.
- Copy welcomes newcomers without assuming knowledge of Buddhist terminology.
- A short foundation fact may appear as supporting context, not as a hero metric.

### 3. Upcoming Activities

- One featured event receives the dominant visual treatment.
- Two or three upcoming activities appear as a compact chronological list or timeline rather than a repeated equal-card grid.
- Each activity exposes date, title, time, and location at a glance.
- The section ends with a clear route to all events.

### 4. First Visit

- A practical section answers the first-visit questions: opening hours, address, public transport, and the expected experience.
- Information is grouped by task, not placed in decorative cards.
- The location block uses the known Biebergemünd address and MKK64 transport guidance from project content.

### 5. Practice Invitation and Contact

- A visually committed closing section invites visitors to attend a practice session.
- Contact methods include phone, email, and Facebook from the existing project data.
- The CTA remains invitational and never pressures visitors or makes exaggerated spiritual claims.

### 6. Footer

- The footer repeats essential contact and legal navigation only.
- It remains quiet and visually distinct from the closing CTA.

## Visual System

### Color

- Faith Gold `#C88D1E`: primary actions, selected state, dates, and key links.
- Deep Faith Gold `#A97016`: hover and pressed state.
- Forest Calm `#4A6741`: limited secondary accent tied to practice and nature.
- Grounded Ink `#2B1F08`: primary light-mode text.
- True white and low-chroma brand-tinted neutrals: primary surfaces.
- The body must not become a cream or parchment field. Warmth comes from imagery, accent, and copy.

All text/background combinations must meet WCAG 2.2 AA contrast. Placeholder or muted text, if used, must also meet 4.5:1.

### Typography

- Display typography uses a serif that supports Thai and Latin convincingly; body typography uses a readable humanist sans with Thai support.
- If external web fonts are used, they must load from a stable public font provider and include robust system fallbacks.
- Display size uses a fluid clamp with a maximum no larger than 6rem and letter spacing no tighter than `-0.04em`.
- Body copy stays between 65 and 75 characters per line where practical.
- Headings use balanced wrapping; paragraphs use pretty wrapping.
- The document contains one H1.

### Shape and Elevation

- Standard card and container corners remain between 12px and 16px.
- Pills are reserved for buttons, compact navigation, dates, and status chips.
- Surfaces are flat by default. Shadows communicate sticky navigation, hover lift, or modal elevation only.
- A 1px border must not be paired with a decorative shadow blur of 16px or more.

### Imagery

- Use real assets from `frontend/public/images`.
- The hero image is decisive and full-bleed.
- Below-the-fold images use lazy loading, explicit dimensions or aspect ratios, meaningful Thai alt text, and `object-fit: cover` where cropping is intentional.
- No illustrated placeholders, hand-drawn SVG scenes, or CSS scenery substitute for required imagery.

## Interaction and Motion

- Navigation links use smooth anchor movement when motion is permitted.
- Sticky navigation changes surface treatment after the hero threshold.
- The mobile menu has an explicit button, correct `aria-expanded`, Escape-key close behavior, and focus restoration.
- Entrance motion is restrained and never gates content visibility. Default content remains visible if JavaScript fails.
- Hover and focus states are distinct. No interaction depends on hover alone.
- Every animation has a `prefers-reduced-motion: reduce` alternative.
- JavaScript remains optional enhancement; the information architecture works without it.

## Responsive Behavior

- The mock supports 320px and wider with no horizontal overflow.
- Mobile composes vertically and preserves readable image crops; it does not merely shrink the desktop composition.
- Tablet receives intentional intermediate spacing and event layout.
- Desktop uses wider asymmetric compositions without allowing body copy to become too long.
- Required verification widths: 390px, 768px, and 1440px.

## Accessibility

- Use semantic landmarks: header, nav, main, sections, and footer.
- Preserve logical heading order and one H1.
- Provide a skip link and visible `:focus-visible` states.
- All interactive elements use native links or buttons.
- Decorative icons are hidden from assistive technology; meaningful controls have visible labels or accessible names.
- Touch targets meet a minimum of 44×44px where practical.
- Content remains usable at 200% zoom.

## Content

Use real project information rather than placeholders:

- Temple: Wat Loung Por Sai / วัดหลวงพ่อใส.
- Address: Am Pflaster 11, 63599 Biebergemünd, Germany.
- Opening hours: Monday–Sunday, 09:00–21:00, subject to monks’ external duties.
- Primary transport: train to Gelnhausen, MKK64 to Bieber Rathaus.
- Phone: 0160-1604486.
- Email: Watloungporsai@gmail.com.
- Facebook: `https://www.facebook.com/wat.loungporsai.9`.
- Activities and images come from the existing public data and assets.

## Failure and Edge Handling

- Images include an intentional fallback background so broken files do not produce illegible layouts.
- Long Thai, English, or German labels may wrap without clipping their containers.
- Navigation remains operable when JavaScript is unavailable; only the enhanced mobile disclosure may degrade to visible anchor navigation.
- External links use appropriate `target` and `rel` attributes when opening a new tab.

## Verification

Before delivery:

1. Validate HTML structure and inspect browser console output.
2. Open the file in a real browser and inspect the complete page visually.
3. Check 390px, 768px, and 1440px viewports.
4. Verify mobile navigation with keyboard and pointer input.
5. Check focus visibility, reduced-motion behavior, link destinations, and image paths.
6. Check for horizontal overflow, text clipping, broken images, duplicate H1 elements, low-contrast text, and dead controls.
7. Run the Impeccable detector or equivalent static audit over the finished HTML.

## Acceptance Criteria

- The file opens directly and renders a complete landing page using real project content and images.
- The approved Quiet Sala direction is visible in the hero, color restraint, asymmetric section rhythm, and practice-led CTA sequence.
- The page is visually credible as a production landing page rather than a wireframe.
- All required viewport checks pass without overflow or unreadable content.
- The mock does not modify or depend on the live Next.js page.
