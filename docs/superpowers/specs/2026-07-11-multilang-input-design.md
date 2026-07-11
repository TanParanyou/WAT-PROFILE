# Spec: Localized Tabbed Input Components with Translation Assistance

**Date**: 2026-07-11  
**Status**: Pending Review  

---

## 1. Goal

ปรับปรุงคอมโพเนนต์กรอกข้อมูลหลายภาษา (Localized Input Components) ในระบบ CMS จากเดิมที่แสดงผลแบบ 3 ภาษาพร้อมกันในรูปแบบ Grid (TH, EN, DE) ให้เปลี่ยนเป็นระบบ **Tabs รายคอมโพเนนต์ (Inline Tabbed Input)** เพื่อประหยัดพื้นที่หน้าจอ เพิ่มความสะอาดตา พร้อมแก้ปัญหาการแจ้งเตือน Error หลายภาษา และเพิ่มฟังก์ชันช่วยแปลข้อมูลระหว่างภาษาเพื่อลดระยะเวลาการทำงานของผู้ใช้

---

## 2. Key Features & Requirements

### 2.1 UI/UX: Inline Tabbed Header
*   แต่ละคอมโพเนนต์จะแสดง **Label** (เช่น "Page title") ทางด้านซ้าย และแถบเลือกภาษา **[ TH ] [ EN ] [ DE ]** ทางด้านขวา
*   สลับแสดงเฉพาะ Input ของภาษาที่ผู้ใช้งานกำลังเลือกกรอกอยู่

### 2.2 Smart Syncing & System Locale
*   **System Locale Fallback**: เมื่อเริ่มต้นเปิดใช้ฟอร์ม แท็บภาษาที่เลือกอยู่จะเป็นไปตาม `useLocale()` ของระบบ `next-intl` (เช่น ภาษาของแอดมินขณะนั้น)
*   **Global Syncing**: หากมีการส่ง Prop สำหรับควบคุมภาษาร่วมกันจาก Zustand Store (`activeLocale` และ `onActiveLocaleChange`) เมื่อผู้ใช้คลิกเปลี่ยนแท็บภาษาในคอมโพเนนต์ตัวใดตัวหนึ่ง ช่องกรอกข้อมูลอื่น ๆ ทั้งหน้าจะสลับเป็นภาษานั้น ๆ ตามโดยอัตโนมัติ เพื่อรักษาโฟกัสการป้อนข้อมูล

### 2.3 Localized Validation Errors & Indicators
*   **Error Dot Indicator**: หากภาษาที่ผู้ใช้ไม่ได้เลือกอยู่ ณ ขณะนั้นมี Validation Error (เช่น ลืมกรอกข้อมูลที่กำหนดไว้ว่าต้องการ หรือกรอกข้อมูลผิดฟอร์แมต) จะแสดง **จุดแจ้งเตือนสีแดงเล็ก ๆ (Red Dot)** บริเวณแท็บภาษานั้น ๆ เพื่อให้แอดมินทราบว่ามีปัญหานอกสายตา
*   **At Least One Language Validation**: 
    *   ดึง Error ระดับ Object (`errors[name]?.message`) มาสลับและแสดงผลข้อความแจ้งเตือนแดง ๆ เช่น *"กรุณากรอกข้อมูลอย่างน้อย 1 ภาษา"*
    *   ข้อความ Error นี้จะได้รับการรองรับการแปลหลายภาษา (i18n) โดยอ่านจากไฟล์คำแปล `Admin.website.atLeastOneLanguageRequired`

### 2.4 Translation Helper Tools
บริเวณใกล้เคียงกับแถบภาษาหรือช่องกรอกข้อมูล จะมีฟังก์ชันช่วยทุ่นแรง:
1.  **Auto-Translate**: ปุ่มช่วยแปลอัตโนมัติจากภาษาหลักที่มีเนื้อหาอยู่แล้ว (เช่น แปลจาก TH เป็น EN) โดยผ่าน Mock Translation Function (รองรับการขยายเป็น API จริงในอนาคต)
2.  **Copy Content**: ปุ่มช่วยคัดลอกค่าจากภาษาหลักมาวางตรง ๆ สำหรับข้อความเฉพาะที่ไม่จำเป็นต้องแปล (เช่น ลิงก์รูปภาพ, ชื่อแบรนด์ภาษาอังกฤษ, หรือชื่อเฉพาะ)

---

## 3. Proposed Changes

### Component 1: [LocalizedTextFields](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/components/forms/LocalizedTextFields.tsx)
*   ปรับเปลี่ยนจาก Grid เค้าโครงเดิมเป็น Inline Tabbed Header
*   แสดงผล Input ทีละภาษาตามแท็บที่เลือก
*   เพิ่มสถานะจุดแดง (Error Dot) และปุ่มช่วยคัดลอก/แปลภาษาด่วน

### Component 2: [LocalizedTextareaFields](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/components/forms/LocalizedTextareaFields.tsx)
*   ปรับลักษณะเดียวกับ `LocalizedTextFields` แต่รองรับฟิลด์ textarea
*   แสดงผลการสลับภาษา และฟังก์ชันตัวช่วยป้อนข้อมูล

### Component 3: [LocalizedInputGrid](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/components/forms/LocalizedInputGrid.tsx) [DELETE]
- ลบไฟล์ทิ้งเนื่องจากไม่มีการเรียกใช้งานในโค้ดเบส เพื่อลดความซ้ำซ้อนของคอมโพเนนต์และลดขนาดโค้ด (Dead code cleanup)

### Translations Files
*   เพิ่มคีย์ `"atLeastOneLanguageRequired"` สำหรับการแสดงผลความผิดพลาดที่แปลตามความเหมาะสมใน:
    *   [th.json](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/messages/admin/th.json)
    *   [en.json](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/messages/admin/en.json)
    *   [de.json](file:///Users/syaco/Documents/development/WAT-PROFILE/frontend/src/messages/admin/de.json)

---

## 4. Verification Plan

### Manual Verification
1.  **ทดสอบการประหยัดพื้นที่**: เปิดหน้า CMS Editor และตรวจสอบว่าหน้าตาฟอร์มสั้นลงและเป็นระเบียบเรียบร้อยขึ้นจริง
2.  **ทดสอบการซิงค์ภาษา**: คลิกเปลี่ยนภาษาที่คอมโพเนนต์หนึ่ง แล้วเช็กว่าช่องป้อนข้อมูลและตัวอย่างพรีวิวข้าง ๆ เปลี่ยนตาม
3.  **ทดสอบการตรวจจับ Error**: กดบันทึกโดยปล่อยช่องฟิลด์ว่างทั้งหมด แล้วทดสอบดูว่ามีจุดแดงเตือนในแท็บ และมีตัวหนังสือแจ้งเตือนแบบแปลภาษาด้านล่างฟิลด์ว่าต้องการอย่างน้อย 1 ภาษาจริง
4.  **ทดสอบปุ่มช่วยแปลและคัดลอก**: กรอกข้อความภาษาไทย แล้วกดปุ่ม Auto-Translate เพื่อตรวจว่ามีการแปลไปภาษาอังกฤษและเยอรมัน และปุ่ม Copy ทำงานถูกต้อง
