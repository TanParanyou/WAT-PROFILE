# Donation Transfer Time Design

**Date:** 2026-08-11

## Goal

ให้ผู้ใช้ระบุวันและเวลาโอนในการแจ้งการบริจาค โดยเวลาเป็นฟิลด์บังคับสำหรับการสร้างรายการใหม่ทั้งฟอร์ม Public และ Staff/Admin และยังรองรับข้อมูลบริจาคเดิมที่ไม่มีเวลา

## Decisions

- เพิ่ม `donation_time` แยกจาก `donation_date` ในรูปแบบ `HH:mm` และเก็บใน PostgreSQL ชนิด `TIME` แบบ nullable
- บังคับ `donation_time` ใน public multipart endpoint และ admin staff-create endpoint
- ไม่เปลี่ยน `donation_date` จาก `DATE` เป็น timestamp เพราะจะเปลี่ยนความหมายของ date filter และเสี่ยง timezone conversion
- รายการเก่าจะมี `donation_time = null` และยังแสดง/ส่งออกได้ตามเดิม
- ไม่แปลงเวลาเป็น UTC; ค่านี้คือเวลาที่ผู้แจ้งเห็นจากหลักฐานการโอน
- ใช้ shared date/time picker ที่รองรับ public และ admin theme; public ต้องมีข้อความ `th`, `en`, `de`

## Data and API

1. เพิ่ม migration `000037_add_donation_time` ที่เพิ่ม `donations.donation_time TIME NULL`; down migration ลบเฉพาะคอลัมน์นี้
2. เพิ่ม `DonationTime *models.TimeOfDay` ใน GORM model และ JSON response เป็น `donation_time`, โดยรายการเก่าเป็น `null`
3. เพิ่ม `DonationTime` ใน `StaffInput` และ `PublicInput`; backend ตรวจ regex `^([01][0-9]|2[0-3]):[0-5][0-9]$` และคืน field error ที่ `donation_time`
4. เพิ่ม `donation_time` เป็น required ใน OpenAPI ของ public multipart และ `StaffDonationInput`; schema ของ `Donation`/`MemberDonation` ระบุเป็น string เวลาและ nullable สำหรับข้อมูลเก่า
5. เพิ่มเวลาใน member donation response, admin list response/model และเอกสารใบเสร็จเมื่อมีค่า

## Frontend

- Public donation schema จะมี `donation_time` เป็น string ที่ต้องตรง `HH:mm` พร้อมข้อความ validation ครบสามภาษา
- Public form ใช้ `DatePicker` และ `TimePicker` ผ่าน `Controller`; `TimePicker` จะส่งค่า `HH:mm`, ใช้ช่วง 15 นาทีเหมือน Admin และรองรับ public theme/locale
- Staff/Admin form ใช้ shared pickers เช่นเดียวกันและต้องกรอกทั้งวันและเวลา
- ตาราง Admin และ CSV export แสดงเวลาเมื่อมีค่า โดยไม่เติมค่าปลอมให้รายการเก่า

## Error handling and compatibility

- Validation error ต้อง map กลับไปที่ `donation_time` เช่นเดียวกับ `donation_date`
- รายการเก่าไม่ถูก backfill เดาเวลา เพราะเวลาจาก `created_at` ไม่ใช่เวลาโอนจริง
- หาก client เก่าไม่ส่งเวลาใน create endpoint จะได้รับ `400` พร้อม field error; read endpoints ยังอ่านรายการเก่าได้

## Testing

- เพิ่ม Go unit tests สำหรับเวลาที่ถูกต้อง, ว่าง, ชั่วโมง/นาทีเกินช่วง และรูปแบบผิด
- รัน frontend targeted lint, TypeScript, production build และตรวจ locale parity
- รัน `go test ./internal/donations` และชุด backend ที่เกี่ยวข้อง
- ตรวจ migration diff และ `git diff --check`
