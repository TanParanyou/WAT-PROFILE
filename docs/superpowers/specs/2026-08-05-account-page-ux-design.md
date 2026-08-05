# Account Page UX Adjustment Design

## Goal

ปรับ `/th/account` และ locale เดียวกันให้ผู้ใช้เข้าใจสถานะ auth ได้ทันที ใช้งาน account form ได้เป็นกลุ่ม และเข้าถึง cookie consent ได้ดีบนมือถือ โดยคง public register, square controls, flat surfaces และ localization `th/en/de` ของโปรเจกต์

## Scope

- Account anonymous access gate
- Authenticated account form information architecture
- Locale option labels and close-account cancellation copy
- Cookie consent mobile layout and dialog accessibility
- `AccountSessionProvider` / `ProfileForm` type contract alignment

ไม่เปลี่ยน API, backend contract, account data model หรือ navigation architecture อื่น

## Design

### Anonymous account state

`ProfileForm` แยก `status === "anonymous"` จาก authenticated query failure:

- แสดง heading และคำอธิบายว่าต้องเข้าสู่ระบบเพื่อจัดการบัญชี
- primary action ไป `/account/login`
- secondary action ไป `/account/register`
- ไม่ใช้ `role="alert"` กับ expected signed-out state

### Authenticated account state

คงหน้าเดียวและ flat register styling แต่แบ่งเนื้อหาเป็นลำดับ:

1. ข้อมูลบัญชี: email, status
2. โปรไฟล์: display name, avatar URL
3. ภาษา: preferred locale พร้อมชื่อภาษาเต็ม
4. เซสชัน: link ไปจัดการ sessions และ logout
5. ความปลอดภัย: close account เป็น danger zone ท้ายหน้า

Save ยังคงเป็น primary action ของ profile form. Close-account confirmation ใช้ข้อความยืนยันและปุ่ม `cancel` แยกจาก `logout`

### Cookie consent

คง accept/decline/privacy actions แต่ทำ panel ให้กะทัดรัดบน mobile, เพิ่ม accessible dialog naming/semantics, จัด focus เมื่อเปิดและคืน focus เมื่อปิด, รองรับ Escape ตาม behavior ที่ปลอดภัย และปิด animation เมื่อผู้ใช้ตั้งค่า reduced motion

### Type contract

เพิ่ม `accountLoading` ใน `AccountSessionValue` ให้ตรงกับการใช้งานของ `ProfileForm` หรือปรับ component ให้ใช้สถานะจาก provider contract เดียวกัน โดยไม่สร้าง duplicate server state

## Data and error flow

- `loading`: แสดง loading status
- `anonymous`: แสดง access gate
- `authenticated` + account loading: แสดง loading status
- `authenticated` + account missing/error: แสดง error พร้อม retry ถ้า query contract รองรับ
- `authenticated` + account data: แสดง grouped form
- mutation errors/success: คง `role="alert"` และ `role="status"`

## Localization

เพิ่มหรือปรับข้อความใน `frontend/src/messages/th.json`, `en.json`, `de.json` พร้อมกัน ได้แก่ access gate, register CTA, cancel CTA และภาษาเต็มใน select หากจำเป็น

## Verification

- Type-check frontend
- Lint touched frontend files
- ตรวจ route ที่ `th`, `en`, `de`
- ตรวจ anonymous, loading, authenticated, close-account confirmation
- ตรวจ mobile 390px และ desktop 1440px
- ตรวจ keyboard focus, Escape cookie consent และ reduced motion

## Acceptance criteria

- Signed-out visitor เข้าใจทันทีว่าต้อง login และเห็น register action
- Authenticated account page แยก routine profile actions จาก security actions
- Locale selector ไม่แสดง raw locale codes
- Close-account cancel button ไม่ใช้ logout copy
- Cookie consent ไม่บังเนื้อหาหลักเกินจำเป็นบน mobile และมี accessible dialog behavior
- ไม่มี TypeScript contract mismatch ระหว่าง provider กับ `ProfileForm`
