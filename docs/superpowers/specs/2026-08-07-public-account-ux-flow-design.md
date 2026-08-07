# Public Account Journey UX/Flow Design

วันที่: 2026-08-07
สถานะ: Draft สำหรับ review
ขอบเขต: Frontend Account UX/flow ก่อนทำ automated test และ CI

## เป้าหมาย

ทำให้ Account auth รู้สึกเป็น journey เดียวที่มีบริบทต่อเนื่อง ตั้งแต่เข้าสู่ระบบ สมัครสมาชิก กู้คืนบัญชี จัดการ Security ไปจนถึงปิดหรือเปิดบัญชีกลับมา โดยทุกหน้าต้องตอบได้ว่า:

1. ตอนนี้ผู้ใช้อยู่ขั้นไหน
2. ทำอะไรต่อได้
3. กลับไปจุดก่อนหน้าอย่างปลอดภัยได้อย่างไร

ไม่เพิ่ม login method ใหม่ และไม่เปลี่ยน auth/security semantics ที่ backend มีอยู่แล้ว เว้นแต่จำเป็นต่อ safe return navigation

## ปัญหาจากโครงสร้างปัจจุบัน

- `AccountShell` ใช้ title/subtitle กลางกับทุก route ทำให้ Login, Reset, Verify และ Reopen ไม่มี visible page context ที่ตรงกับงานปัจจุบัน
- `AccountBackButton` ตัดสินใจจาก `window.history.length` จึงอาจย้อนออกนอก Account journey หรือย้อนกลับไปหน้าที่ไม่เกี่ยวข้องเมื่อเปิด deep link โดยตรง
- confirmation/success บาง state แสดงข้อความแล้วไม่มี next action ที่ชัดเจน
- Login/Register/Recovery แยก pattern ของ Google, password, divider, footer links และ error state กันเอง
- Account tabs เก็บด้วย local state เท่านั้น จึงไม่ deep-link และไม่คงตำแหน่งหลัง refresh หรือ OAuth callback
- Sessions มี page header ของตัวเองซ้อนกับ header ของ Account shell

## ตัวเลือกที่พิจารณา

### A. แก้เฉพาะข้อความและปุ่ม

เพิ่ม title, back link และ success CTA ให้แต่ละหน้า โดยคงโครงสร้างเดิมไว้

- ข้อดี: เปลี่ยนเล็กและเสี่ยงต่ำ
- ข้อเสีย: ยังมี pattern ซ้ำและ flow จะไม่เป็นระบบเมื่อเพิ่ม state ใหม่

### B. Journey contract บน route เดิม (แนะนำ)

คง URL และ backend flow เดิม แต่สร้าง shared shell, page metadata, deterministic navigation, common form states และ URL-synced account tabs

- ข้อดี: แก้ continuity ครบ รองรับ email/OAuth deep link และไม่ต้องย้าย route ครั้งใหญ่
- ข้อเสีย: ต้องปรับ component หลายตัวและข้อความทุกภาษาให้ใช้ contract เดียวกัน

### C. รวมเป็น wizard route เดียว

เปลี่ยน Login/Register/Recovery/Reopen เป็น state machine ในหน้าเดียว

- ข้อดี: คุมลำดับได้จากศูนย์กลาง
- ข้อเสีย: ทำ deep link และ email callback ยากขึ้น เพิ่มความเสี่ยงต่อ refresh, SEO และ backward compatibility

เลือก B

## Journey contract

| Flow | Entry | Main transition | Success destination |
|---|---|---|---|
| Sign in | `/account/login` | password หรือ Google | `/account` |
| Register | `/account/register` | register → verify email | `/account/login` |
| Forgot password | `/account/forgot-password` | email → reset link → new password | `/account/login` |
| Verify email | `/account/verify-email` | verify หรือ resend | `/account/login` |
| Reopen account | `/account/reopen-request` | email → single-use reopen link | `/account/login` |
| Email change | `/account?tab=security` | recent auth → confirmation link | `/account?tab=security` |
| Google linking | `/account?tab=security` | Google callback | `/account?tab=security` |
| Sessions | `/account/sessions` | revoke หรือ logout all | `/account?tab=security` หรือ `/account/login` |

ทุก transition ต้องมี explicit destination และ fallback ที่กำหนดไว้ ไม่ใช้ browser history เป็น source เดียวของความหมาย

## Page architecture

### `AuthShell`

ใช้กับ Login, Register, Forgot password, Reset password, Verify email, Reopen request และ token confirmation pages

รับค่า:

- `title` และ `subtitle` เฉพาะหน้า
- `backHref` และ `backLabel` ที่ deterministic
- optional `step` เช่น `1/2` สำหรับ flow ที่มีลำดับ
- optional `footerActions`

มี visible `h1` เพียงหนึ่งตัว และ layout/spacing/button contract เดียวกันทุก auth page

### `AccountShell`

ใช้กับ Account overview และ Sessions

รับค่า:

- page title/subtitle ของ route ปัจจุบัน
- account navigation context
- back destination

ไม่แสดง title กลางซ้ำกับ page header ของ child component

### Route composition

`frontend/src/app/[locale]/(client)/account/layout.tsx` จะเหลือหน้าที่เป็น feature gate และ provider boundary เท่านั้น แต่จะไม่ render shell ครอบทุก route แบบเดียวกัน

แต่ละ `page.tsx` จะเลือก shell ให้ตรงกับ route:

- auth และ token routes → `AuthShell`
- `/account` และ `/account/sessions` → `AccountShell`

วิธีนี้ป้องกันการซ้อน header และทำให้ page title ของ route เป็น source of truth เดียว

### Shared interaction primitives

สร้างหรือรวม pattern กลางสำหรับ:

- `AuthMethodPanel` สำหรับ Google/password และ divider ที่มีข้อความ “หรือ”
- `AccountField` สำหรับ label, input, inline error, `aria-invalid`, `aria-describedby`
- `AccountFeedback` สำหรับ loading, error และ success
- `AccountFlowFooter` สำหรับ next/back/help actions
- `AccountPageHeader` สำหรับ eyebrow, h1, subtitle และ optional step

ใช้ existing design tokens ใน `DESIGN.md`; ไม่สร้าง visual language ใหม่

## Navigation rules

### Back behavior

`AccountBackButton` จะรับ `href` หรือ navigation intent จาก page contract แทนการตรวจ `window.history.length`

ค่าเริ่มต้น:

- Login/Register → `/`
- Forgot/Verify/Reset → `/account/login` หรือ parent ตาม step
- Reopen request → `/account/login`
- Token confirmation → destination ของ flow หลัง success หรือ `/account/login` เมื่อ invalid
- Account overview → `/`
- Sessions → `/account?tab=security`

ใช้ `router.back()` ได้เฉพาะกรณีที่มี internal account return state ที่ตรวจสอบแล้ว ไม่ใช้เป็น fallback ทั่วไป

### Return context

ถ้าจำเป็นต้องส่ง `returnTo`:

- allow-list เฉพาะ public Account routes
- preserve locale ผ่าน navigation helper
- ห้ามรับ absolute URL หรือ external origin
- OAuth callback ต้องคืนสู่ page/tab เดิม เช่น `/account?tab=security`

## Auth flow behavior

### Login

ลำดับบนหน้า:

1. page-specific title/subtitle
2. Google sign-in
3. divider พร้อมคำว่า “หรือ”
4. email/password form
5. primary sign-in button
6. grouped links: create account, forgot password, restore closed account

ข้อผิดพลาด field อยู่ข้าง field และ generic error ใช้เฉพาะกรณีที่ไม่มี field mapping

### Register

แสดง password requirements และ verification expectation ก่อน submit อย่างคงที่

หลังสำเร็จแสดง:

- ตรวจสอบกล่องจดหมาย
- ส่ง verification link อีกครั้ง
- กลับเข้าสู่ระบบ

### Recovery

- Forgot password success ต้องมี CTA กลับ Login
- Reset password ต้องแยก invalid/expired token จาก password validation
- Reset success ต้องมี CTA Login ด้วย password ใหม่
- Verify email ต้องมี resend state, invalid token state และ CTA กลับ Login

### Reopen

- Request success ต้องบอกว่าระบบส่งลิงก์แล้วและมี CTA กลับ Login
- Confirmation success ต้องบอกว่า account active แล้วและมี CTA Login
- Invalid/expired token ต้องมี CTA ขอ reopen ใหม่และกลับ Login

### Google OAuth

ทุกจุดที่ redirect ไป Google ต้องระบุเหตุผลของ action และหลัง callback ต้องกลับสู่ context เดิม พร้อม success/error action ที่ผู้ใช้เลือกต่อได้ ไม่ redirect เงียบโดยไม่มี feedback

## Authenticated account behavior

### Account tabs

เปลี่ยนจาก local-only state เป็น URL state โดยใช้ `useSearchParams` อ่านค่าและ `router.replace` เปลี่ยนค่าโดยไม่ reload:

```text
/account?tab=profile
/account?tab=preferences
/account?tab=security
```

ค่า default คือ `profile`; ค่า invalid fallback เป็น `profile` โดยไม่ทำให้ page error

เมื่อเปลี่ยน tab ให้ย้าย focus ไปยัง tab panel heading เพื่อให้ keyboard/screen-reader user รู้ว่าบริบทเปลี่ยนแล้ว

### Security hierarchy

เรียง section เป็น:

1. Sign-in methods
2. Change password
3. Change email
4. Active sessions
5. Close account

แต่ละ sectionต้องมีคำอธิบาย, primary action, loading state, local success state และ error ใกล้ action นั้น

### Sessions

ใช้ page header เดียวกับ shell และมี explicit link กลับ Security tab เสมอ

หลัง `logout all` ให้พาไป Login พร้อมข้อความอธิบายว่าต้องเข้าสู่ระบบใหม่

### Close/reopen

หลัง close สำเร็จต้องแสดงสถานะปิด, วัน purge และ link ไป Reopen request โดยไม่ทำให้ผู้ใช้เข้าใจว่ามี session เดิมเหลืออยู่

## Feedback, accessibility และ content

- field errors แสดง inline และ focus ช่องแรกเมื่อ submit ไม่ผ่าน
- async status ใช้ `aria-live="polite"`
- ทุก input มี label, `name`, `autocomplete` และ type ที่ถูกต้อง
- ทุก action มี focus indicator และ touch target อย่างน้อย 44px
- destructive action ต้องมี confirmation
- heading hierarchy มี `h1` หนึ่งตัวต่อหน้า และ `h2/h3` ตาม section
- loading copy ใช้รูปแบบเดียวกัน เช่น “กำลังส่ง…” / “กำลังตรวจสอบ…”
- error copy ต้องบอกวิธีแก้หรือ next step ไม่ใช่เพียงบอกว่าผิด
- ตรวจข้อความ TH/EN/DE ให้มีเจตนาเดียวกันและรองรับ German wrapping/Thai line breaks

## Files ที่คาดว่าจะเปลี่ยน

- `frontend/src/features/public/account/components/AccountShell.tsx`
- `frontend/src/features/public/account/components/AccountBackButton.tsx`
- `frontend/src/features/public/account/components/AccountTabs.tsx`
- `frontend/src/features/public/account/components/LoginForm.tsx`
- `frontend/src/features/public/account/components/RegisterForm.tsx`
- `frontend/src/features/public/account/components/RecoveryForms.tsx`
- `frontend/src/features/public/account/components/LifecycleForms.tsx`
- `frontend/src/features/public/account/components/LinkAccount.tsx`
- `frontend/src/features/public/account/components/ProfileForm.tsx`
- `frontend/src/features/public/account/components/SessionList.tsx`
- `frontend/src/app/[locale]/(client)/account/layout.tsx`
- Account route `page.tsx` files ที่ต้องส่ง page metadata เข้า shell
- `frontend/src/messages/th.json`, `en.json`, `de.json`

Backend/API/OpenAPI จะเปลี่ยนเฉพาะเมื่อจำเป็นต่อ safe `returnTo` contract; ไม่เพิ่ม auth capability ใหม่ในงานนี้

## Manual acceptance scope

ยังไม่เพิ่ม CI หรือ automated test ในรอบนี้ ตรวจด้วย browser ที่ `http://localhost:3002` และ backend `8082`:

- เปิดทุก route โดยตรงใน tab ใหม่แล้ว back ได้ตาม contract
- ทดสอบ Login → Register → Verify → Login
- ทดสอบ Login → Forgot → Reset → Login
- ทดสอบ Login → Reopen request → Reopen confirmation → Login
- ทดสอบ Security → email/password change → confirmation → กลับ Security context เดิม
- ทดสอบ Security → Sessions → กลับ Security
- ตรวจ mobile และ desktop ใน TH/EN/DE
- ตรวจ keyboard focus, first-error focus, loading/success/error และ expired token

## Out of scope

- เพิ่ม login provider หรือ auth capability ใหม่
- เปลี่ยน retention, token policy หรือ backend security semantics
- CI, GitHub Actions, integration test และ browser E2E
- Docker release path และ scheduler automation
- redesign public site นอก Account surface
