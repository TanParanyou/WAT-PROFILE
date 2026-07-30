---
target: public homepage
total_score: 21
p0_count: 0
p1_count: 4
timestamp: 2026-07-22T16-38-43Z
slug: frontend-src-app-locale-client-homecontent-tsx
---
# Impeccable Critique — Public Homepage

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Loading, error และ empty states ดี แต่การสลับภาษาไม่บอกปลายทาง |
| 2 | Match System / Real World | 1 | ภาพ placeholder และข้อมูลสถานที่บางภาษาไม่ยืนยันว่าเป็นวัดในเยอรมนี |
| 3 | User Control and Freedom | 2 | Modal ยังขาด Escape และ focus management |
| 4 | Consistency and Standards | 2 | Typography, heading semantics และรูปแบบ radius/shadow ไม่ตรงระบบเดียวกัน |
| 5 | Error Prevention | 2 | มี query-state guard แต่ CTA ที่มาจาก CMS และ modal ยังมี guardrail จำกัด |
| 6 | Recognition Rather Than Recall | 2 | ปุ่มภาษาบังคับจำลำดับการวน TH → EN → DE |
| 7 | Flexibility and Efficiency | 2 | ขาดทางลัดไปการเดินทาง การเตรียมตัว และดูกิจกรรมทั้งหมด |
| 8 | Aesthetic and Minimalist Design | 2 | ลำดับใหญ่อ่านง่าย แต่ template grammar และ decoration ซ้ำ |
| 9 | Error Recovery | 3 | มี retry ที่ดี แต่ empty state ยังเป็นปลายตัน |
| 10 | Help and Documentation | 2 | หน้าแรกยังไม่ตอบสิ่งที่ผู้มาวัดครั้งแรกต้องรู้ |
| **Total** | | **21/40** | **Acceptable — ต้องปรับอย่างมีนัยสำคัญ** |

## Anti-Patterns Verdict

### LLM assessment

หน้าแรกยังมีสัญญาณ AI-made landing page ชัด: full-screen centered hero ตามด้วยการ์ดไอคอนสามใบ event-card grid และ donation cards; ใช้ tiny tracked eyebrow, emoji ในวงกลม, pill, glass, rounded-2xl/3xl, border + shadow และ hover-scale ซ้ำกัน ภาพ hero ในโค้ดยังถูกระบุว่าเป็น placeholder และให้บรรยากาศกึ่งแฟนตาซีมากกว่าหลักฐานของสถานที่จริง ผลคือสงบในระดับผิว แต่ยังไม่จริงใจและเฉพาะตัวตาม brand promise

### Deterministic scan

Bundled detector พบ 1 advisory: `design-system-font-size` ที่ `frontend/src/components/layout/Navbar.tsx:128` เพราะใช้ `text-[10px]` นอก type ramp ของ DESIGN.md ซึ่งกำหนด label ไว้ 14px จุดนี้อาจเป็น one-off micro-label โดยเจตนา แต่ยังเป็น design-system divergence และเล็กเกินไปสำหรับกลุ่มผู้ใช้สูงอายุ

### Visual overlays

ไม่มี browser backend ที่ใช้เปิดแท็บใหม่ได้ จึงไม่ได้ทำ mutable-injection preflight, ไม่ได้ inject `detect.js` และไม่มี user-visible overlay ที่อ้างได้ ใช้ source, assets และ HTTP reachability เป็น fallback เท่านั้น

## Overall Impression

หน้าแรกมีพื้นฐานที่ดี: Hero ชัด, ข้อมูลหลายภาษาเป็นระบบ และ data states ค่อนข้างครบ แต่โอกาสใหญ่ที่สุดคือเปลี่ยนจาก “เว็บไซต์วัดที่ดูสงบ” ไปเป็น “วัดหลวงพ่อใสในเยอรมนีที่ผู้มาใหม่เชื่อถือและรู้ว่าจะเข้าร่วมอย่างไร” ด้วยภาพจริง ข้อมูลจริง และเส้นทางมาเยือนที่ชัดก่อนเสนอการบริจาค

## What's Working

- Events และ Donation แยก loading, error, empty และ success พร้อม retry ชัดเจน
- โครงสร้าง locale-aware รองรับไทย อังกฤษ และเยอรมันได้ดีกว่าการ hardcode ทั้งหน้า
- Hero มี focal point เดียวและ CTA กิจกรรมสอดคล้องกับหนึ่งในเป้าหมายหลัก

## Priority Issues

### [P1] ความจริงและความน่าเชื่อถือขัดกับ brand promise

- **Why it matters:** ภาพ placeholder และข้อมูลสถานที่ที่คลาดเคลื่อนทำให้ผู้มาใหม่ไม่แน่ใจว่านี่คือวัดจริงแห่งใด
- **Fix:** ใช้ภาพจริงของวัด ชุมชน และกิจกรรมในเยอรมนี; แก้ copy ทั้งสามภาษาให้ข้อเท็จจริงและเจตนาตรงกัน; ตัดชื่อวัดที่พิมพ์ซ้ำใน hero description
- **Suggested command:** `$impeccable clarify`

### [P1] เส้นทาง “รู้จัก → เข้าร่วม → เดินทาง” ขาดช่วง

- **Why it matters:** Hero มี CTA ไปกิจกรรมเพียงทางเดียว จาก Events กระโดดไป Donation โดยไม่มีการเตรียมตัวหรือวางแผนมาเยือน
- **Fix:** เพิ่ม secondary CTA “วางแผนการเดินทาง”; เพิ่มช่วงสำหรับผู้มาครั้งแรกและ logistics ก่อน Donation; เพิ่ม “ดูกิจกรรมทั้งหมด” และ action ให้ empty state
- **Suggested command:** `$impeccable shape`

### [P1] ยังไม่ถึง WCAG 2.2 AA

- **Why it matters:** Faith Gold `#C88D1E` กับขาวมี contrast ราว 2.88:1; modal ขาด Escape/focus trap; ไม่มี reduced-motion มาตรฐาน; หน้าใช้ H1 หลายตัว
- **Fix:** เปลี่ยนคู่สี CTA/ข้อความให้ผ่าน contrast; เพิ่ม focus-visible และ reduced-motion; ใช้ dialog primitive พร้อม focus return; ให้หน้าเหลือ H1 เดียว
- **Suggested command:** `$impeccable audit`

### [P1] Navigation เสี่ยงล้นบน tablet และหลายภาษาไม่เสมอกัน

- **Why it matters:** ที่ breakpoint `md` แสดง brand + 6 links + theme + language พร้อมกัน ข้อความเยอรมันเสี่ยงชน; mobile action บางส่วน hardcode อังกฤษ
- **Fix:** เลื่อน desktop navigation ไป breakpoint ที่กว้างกว่า; ลด top-level IA; ใช้ language menu ที่เห็นทั้งสามภาษาและ localize labels/ARIA ทั้งหมด
- **Suggested command:** `$impeccable adapt`

### [P2] Visual grammar ยังเป็น template มากกว่าตัวตนของวัด

- **Why it matters:** การ์ดเหมือนกันสามใบ emoji, glass/pill และมุมมน/เงาซ้ำ ทำให้หน้าใกล้ template เว็บไซต์วัดทั่วไป
- **Fix:** ให้ภาพและข้อมูลจริงเป็นระบบภาพ; เปลี่ยนการ์ดสามใบเป็น composition ที่เล่า “ปฏิบัติ–ชุมชน–มาเยือน” ด้วยจังหวะต่างกัน; จำกัด radius 12–16px และใช้เงาเฉพาะชั้นที่ลอยจริง
- **Suggested command:** `$impeccable polish`

## Persona Red Flags

- **ผู้มาใหม่:** ไม่พบ “มาครั้งแรกต้องทำอย่างไร”; ข้อมูลสถานที่ขัดกัน และไม่มีเส้นทางเตรียมตัวก่อน CTA
- **ผู้ใช้ keyboard/screen reader/low vision:** contrast ของ CTA ไม่ผ่าน, focus style ไม่ชัด, modal ขาด Escape/focus trap, H1 หลายตัว และ mobile menu toggle ขาด accessible label
- **ผู้ใช้มือถือ:** Hero สูงเต็มจอทำให้ข้อมูลจริงอยู่หลังการเลื่อน, auto modal อาจขัดจังหวะ และไม่มี CTA การเดินทางใน thumb flow

## Minor Observations

- Actual typography ใช้ Georgia/Inter แทน Pridi/Noto Sans Thai ที่ DESIGN.md กำหนด
- `text-[10px]` ใน Navbar หลุดจาก type ramp และอ่านยาก
- Event badge แสดงชื่อ event ซ้ำกับ heading
- Footer ใช้ตัว W แทน logo จริง และ social icon-only links ขาด accessible label
- `.glass` utility รวม blur + border + shadow ซึ่งขัดกับทิศทางที่ต้องการลด template grammar
- Empty states ไม่มี action ต่อ

## Questions to Consider

1. ถ้าตัดสีทอง emoji และภาพ hero แบบแฟนตาซีออก ผู้ใช้ยังระบุได้ไหมว่านี่คือวัดหลวงพ่อใสในเยอรมนี?
2. เหตุใดเส้นทางบริจาคจึงมาก่อนเส้นทางเดินทางมาเยือน ทั้งที่ conversion หลักคือการปฏิบัติจริง?
3. ภายใน 10 วินาที ผู้ไม่เคยเข้าวัดจะรู้หรือไม่ว่าได้รับการต้อนรับ เข้าร่วมอะไรได้ และต้องเริ่มตรงไหน?
