# Donation Report Form Density Design

## Goal

ทำให้หน้า `/{locale}/donate/report` กระชับขึ้นทั้งความกว้างและความยาว โดยยังคงข้อมูลที่จำเป็น, validation, dirty state, proof preview และการเข้าถึงได้ครบถ้วน

## Approved direction: compact single-page

คงฟอร์มแบบหน้าเดียวเพื่อไม่เพิ่ม flow ใหม่ แต่ปรับโครงสร้างให้เป็น register ที่อ่านเป็นกลุ่ม:

```text
ข้อมูลการบริจาค
  จำนวนเงิน        สกุลเงิน
  วันที่โอน        เวลาที่โอน
  ช่องทาง          วัตถุประสงค์

ข้อมูลติดต่อและหลักฐาน
  ชื่อผู้บริจาค     อีเมล
  เบอร์โทรศัพท์เต็มแถว
  หลักฐานการโอนเต็มแถว
  ตัวเลือกใบเสร็จ/ความเป็นส่วนตัว
  ส่งข้อมูล
```

## Layout decisions

- ลด page/form measure จาก `max-w-3xl` เป็น `max-w-2xl` เพื่อให้บรรทัดอ่านง่ายและลดความรู้สึกเป็นแผงใหญ่
- ลด section padding จาก `p-6 sm:p-8` เป็น `p-4 sm:p-6`
- ลด sibling gaps จาก `gap-6` เป็น `gap-4`; ให้ section description ใช้ `leading-6`
- คง 2-column grid ตั้งแต่ `md` สำหรับคู่ข้อมูลที่มีความสัมพันธ์กัน และให้ phone/proof/consent เต็มแถว
- คงความสูง input 44px และ reserved error/helper slots เพื่อป้องกัน layout shift เมื่อ validation แสดง
- ลด heading ของ fieldset เป็น `text-xl` และคง page title/CTA semantics เดิม
- mobile ใช้หนึ่งคอลัมน์, padding 16px, touch target อย่างน้อย 44px

## Out of scope

- ไม่แยกเป็น wizard/stepper
- ไม่เปลี่ยน field, API payload, validation rule หรือ localized copy
- ไม่เปลี่ยน proof preview drawer behavior

## Verification

- TypeScript และ targeted ESLint ผ่าน
- production build ผ่าน
- ตรวจ source ว่า public form ยังมีทุก field, stable min-height และไม่มี horizontal overflow จาก layout ใหม่
