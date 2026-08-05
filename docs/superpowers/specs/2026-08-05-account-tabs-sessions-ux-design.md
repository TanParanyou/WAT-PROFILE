# Account tabs and sessions UX design

Date: 2026-08-05

## Goal

ทำให้หน้า `/account` อ่านง่ายและแก้ไขข้อมูลได้โดยไม่ต้องเลื่อนยาวทั้งหน้า พร้อม
ป้องกันข้อมูลฟอร์มหายเมื่อผู้ใช้เปลี่ยนส่วนหรือออกจากหน้า และปรับ
`/account/sessions` ให้เป็นหน้าจัดการอุปกรณ์ที่เข้าใจได้ในครั้งเดียวทั้ง desktop
และ mobile

## User experience

### Account page

หน้า account ใช้ tab ภายในหน้า 3 ส่วน:

- โปรไฟล์: รูปโปรไฟล์ ชื่อที่แสดง อีเมล และสถานะบัญชี
- การตั้งค่า: ภาษาที่ต้องการ
- ความปลอดภัย: ลิงก์จัดการ sessions, ออกจากระบบ และปิดบัญชี

Tab ใช้ปุ่ม semantic tab (`role=tablist`, `role=tab`, `aria-selected`,
`aria-controls`) และยังคง URL `/account` เดิม ไม่สร้าง query state ใหม่

เมื่อ display name หรือ preferred locale ต่างจากค่าที่โหลดจาก server:

- แสดงสถานะ “ยังไม่ได้บันทึก” ใกล้ tab/header
- แสดง action bar สำหรับ “บันทึก” และ “ยกเลิก”
- กด tab อื่นหรือ link ไป sessions ต้องยืนยันก่อนออก หากยัง dirty
- ติดตั้ง `beforeunload` เพื่อเตือนเมื่อปิด/refresh browser
- หลังบันทึกสำเร็จ baseline ใหม่ต้องตรงกับค่าปัจจุบัน และสถานะ dirty หาย
- การอัปโหลด avatar เป็น operation แยกที่บันทึกทันที จึงไม่เพิ่ม dirty ของฟอร์มชื่อ/ภาษา

การกด “ยกเลิก” คืนค่า baseline ล่าสุดจาก server โดยไม่เรียก API

### Sessions page

`/account/sessions` เป็นหน้าแยกเต็มหน้า มี:

- heading/subtitle ที่บอกชัดว่ากำลังจัดการอุปกรณ์ที่เข้าสู่ระบบ
- account back link ที่ใช้ locale-aware navigation
- current device card ที่เด่นที่สุด พร้อม badge “อุปกรณ์นี้”
- session อื่นเป็น card/list ที่แสดง device, IP prefix และเวลาที่ใช้งานล่าสุด
- ปุ่ม revoke เฉพาะ session อื่น พร้อม loading state ต่อ action
- ปุ่ม sign out everywhere แสดงเมื่อมี session มากกว่าหนึ่งรายการ และมี confirmation
- loading, error + retry, empty และ anonymous access states ครบ
- timestamp ใช้ locale ของหน้า และรูปแบบที่อ่านง่ายแทน `toLocaleString()` แบบ implicit

เมื่อ sign out everywhere สำเร็จ ต้องใช้ account session context เดียวกับ navbar
เพื่อเปลี่ยนเป็น anonymous และล้าง account/session query ทันที

## Components and hooks

- `AccountTabs`: tab presentation และ active state ของ account sections
- `useUnsavedChanges`: dirty guard สำหรับ beforeunload และ in-app navigation
- `ProfileForm`: แยก content ตาม active tab และใช้ dirty action bar
- `SessionList`: จัดการ state ของ sessions page และ action feedback
- `SessionCard`: แสดงข้อมูล device/session โดยไม่รู้เรื่อง API

Components จะเรียก query/mutation ผ่าน feature hooks เดิมเท่านั้น ไม่สร้าง Axios
หรือ remote state ใน component

## Data and error behavior

ไม่เพิ่ม backend endpoint หรือ schema ใหม่ งานนี้ใช้ `useAccountSessions`,
`useRevokeAccountSession` และ account session context เดิม

ทุก action ต้อง:

- ปิดการกดซ้ำระหว่าง request
- แสดงข้อความ error ผ่าน account error mapper และ localized message
- คงข้อมูลเดิมไว้เมื่อ request ล้มเหลว
- รองรับ keyboard focus และ touch target อย่างน้อย 44px

## Localization and visual rules

เพิ่ม/ปรับข้อความใน `th`, `en`, `de` ให้ key tree ตรงกันทั้งหมด รวมถึง dirty,
cancel, retry, device, current session, last active และ confirmation copy

ใช้ public semantic tokens จาก `DESIGN.md`, zero-radius border language เดิม,
focus-visible states, reduced-motion friendly loading indicators และ responsive
card layout โดยไม่ใช้ admin tokens

## Verification

- account message tree test ผ่านครบสามภาษา
- TypeScript และ focused ESLint ผ่านไฟล์ที่แก้
- frontend production build ผ่าน
- Go suite เดิมยังผ่าน (ไม่มี backend contract เปลี่ยน)
- ตรวจ route `/th/account` และ `/th/account/sessions` ตอบ 200
