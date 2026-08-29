# Design Specification: Donation Certificate & Receipt PDF Customization & Signature

## 1. Overview & Goals

ระบบออกใบอนุโมทนาบัตรและใบเสร็จรับเงินบริจาค (Donation Certificate & Receipt) สำหรับวัดหลวงพ่อสาย (Wat Loung Por Sai e.V.) ได้รับการพัฒนาเพื่อรองรับ:
1. **การปรับแต่งเทมเพลตส่วนกลาง (Central Template Customization)** ผ่านหน้า Admin Settings โดยไม่ต้องแก้ไข Source Code (ชื่อวัด, เลขทะเบียนภาษี, คำอนุโมทนาบุญ, ผู้ลงนาม, ตราประทับวัด)
2. **การตรวจทานและแก้ไขข้อมูลเฉพาะบุคคลก่อนออกเอกสาร (Live Preview & Quick Edit)** ในหน้ารายการบริจาค (ชื่อผู้บริจาค, ที่อยู่, วัตถุประสงค์, ยอดเงิน, วันที่)
3. **ฟีเจอร์ลายเซ็นดิจิทัล (Digital Signature)** ทั้งแบบใช้ลายเซ็นกลางที่บันทึกไว้ล่วงหน้า (Saved Signature) หรือวาดลายเซ็นสดด้วยเมาส์/ทัชสกรีน (Live Signature Pad) และตัวเลือกเว้นว่างสำหรับเซ็นมือจริง
4. **ความสมบูรณ์ของภาษาและฟอนต์ (Typography & Multilingual Support)** รองรับฟอนต์ภาษาไทยและภาษาเยอรมัน/อังกฤษ (TH / DE / EN) ได้อย่างถูกต้อง คมชัด และได้มาตรฐานเอกสารทางการของสมาคมวัดในประเทศเยอรมนี (§ 10b EStG)

---

## 2. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin Settings: Certificate & Receipt Config             │
│    - Saved to Database (models.Setting / JSON key-value)    │
│    - Global Template: Organization info, Tax ID, Blessing   │
│      quotes, Signatory, Seal image, Default signature image │
└──────────────────────────────┬──────────────────────────────┘
                               │ Fetch config
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Donation List Page (Admin Donations)                     │
│    - Click "Issue Certificate / Print Receipt" on record    │
│    - Opens DonationCertificateModal                         │
├──────────────────────────────┬──────────────────────────────┤
│ Left: Quick Edit Form        │ Right: Live Preview Sheet    │
│  - Donor Name & Address      │  - Dynamic HTML/CSS A4 layout│
│  - Purpose & Amount & Date   │  - Real-time updates         │
│  - Language Selector         │  - High-res Sarabun font     │
│  - Signature: Saved / Live   │  - Seal & Signature render   │
│    Canvas / None             │                              │
├──────────────────────────────┴──────────────────────────────┤
│ Actions:                                                    │
│  [Print / Save as PDF]       [Close]                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Specifications

### 3.1 Backend: Certificate Settings & Data Model

- **Settings Keys in DB (`models.Setting`)**:
  - `certificate_org_name_th`: ชื่อวัดภาษาไทย (เช่น "วัดหลวงพ่อสาย เยอรมนี")
  - `certificate_org_name_de`: ชื่อองค์กรภาษาเยอรมัน (เช่น "WAT LOUNG POR SAI e.V.")
  - `certificate_org_subtitle`: คำอธิบายองค์กร (เช่น "Theravada Buddhist Temple & Community Association e.V.")
  - `certificate_tax_number`: เลขประจำตัวผู้เสียภาษี / สมาคม (เช่น "VR 12345 / FA Frankfurt")
  - `certificate_address`: ที่อยู่วัดและช่องทางติดต่อ
  - `certificate_blessing_th`: คำอนุโมทนาบุญภาษาไทย
  - `certificate_blessing_de`: คำอนุโมทนาบุญภาษาเยอรมัน/อังกฤษ
  - `certificate_signatory_name`: ชื่อผู้ลงนาม (เช่น "พระครูวิมลธรรมวิเทศ")
  - `certificate_signatory_title`: ตำแหน่งผู้ลงนาม (เช่น "Vorstand / เจ้าอาวาส")
  - `certificate_seal_url`: URL ตราประทับวัด (PNG โปร่งใส ใน R2 Storage)
  - `certificate_signature_url`: URL รูปลายเซ็นเริ่มต้น (PNG โปร่งใส ใน R2 Storage)

- **API Endpoints**:
  - `GET /api/v1/admin/settings` & `PUT /api/v1/admin/settings` (ใช้ setting service เดิมที่รองรับ batch update)

---

### 3.2 Frontend: Admin Settings Tab (Certificate Template)

- เพิ่มแท็บใหม่ใน `frontend/src/app/[locale]/admin/settings/page.tsx`:
  - **แท็บ "ใบอนุโมทนาบัตร / Certificate"**:
    1. **Organization Details**: Input สำหรับชื่อวัด (TH/DE), ที่อยู่, เลขทะเบียนภาษี
    2. **Blessing & Acknowledgement**: Textarea สำหรับคำอนุโมทนาบุญ (TH และ DE)
    3. **Signatory Information**: Input สำหรับชื่อ-ตำแหน่งผู้มีอำนาจลงนาม
    4. **Assets**: Media Picker สำหรับเลือกรูปตราประทับวัด และรูปลายเซ็นทางการ

---

### 3.3 Frontend: Interactive Issue & Edit Modal (`DonationCertificateModal`)

- สร้างคอมโพเนนต์ใหม่ `DonationCertificateModal.tsx`:
  - **Left Column: Form Controls**:
    - `Donor Name`: ค่าเริ่มต้นดึงจากรายการบริจาค แก้ไขได้
    - `Donor Address`: ที่อยู่ผู้บริจาคสำหรับระบุบนเอกสาร
    - `Donation Date` & `Amount` & `Payment Method`
    - `Purpose / Category`: วัตถุประสงค์ เช่น ทำบุญสร้างอุโบสถ / บำรุงวัด
    - `Language Mode`:
      - `bilingual` (ไทย + เยอรมัน) - แนะนำ
      - `th` (ไทยล้วน)
      - `de` (เยอรมันล้วน)
    - `Signature Mode`:
      - `saved` (ใช้รูปลายเซ็นจาก Settings)
      - `pad` (เซ็นสดบนกระดาน Canvas - รองรับเมาส์/สัมผัส พร้อมปุ่มล้าง)
      - `none` (เว้นว่างไว้ลงนามมือจริง)
  - **Right Column: Live Printable Certificate**:
    - Render HTML Document สัดส่วน A4 มาตรฐาน
    - ใช้ Google Font `Sarabun` และ `Inter/Cinzel` สำหรับหัวเอกสารทางการ
    - แสดงตราประทับ, ลายเซ็นสด/รูป, ตารางสรุปรายการ, และข้อความรับรองสมาคมเพื่อลดหย่อนภาษี
  - **Action Bar**:
    - `Print / Save as PDF`: เรียก `window.print()` ด้วย Print CSS ที่ตัด UI ส่วนเกินออก เหลือเฉพาะหน้าเอกสาร A4 คมชัด 100%
    - `Close`: ปิดหน้าต่าง

---

## 4. Non-Functional Requirements & Polish

1. **Print Optimization**: Print CSS `@media print` กำหนดขนาดหน้า `@page { size: A4 portrait; margin: 10mm; }` ตัด header/footer ของบราวเซอร์ และซ่อน UI ควบคุม
2. **Signature Canvas Performance**: ใช้ HTML5 Canvas น้ำหนักเบา คืนค่าเป็น Base64 PNG URL ที่แทรกในเอกสารได้ทันทีโดยไม่ต้องโหลด Library หนักเกินไป
3. **Security & Data Integrity**: ข้อมูลที่แก้ไขใน Modal สำหรับการออกเอกสารเฉพาะกิจ สามารถเลือกบันทึกกลับลง DB (Update Donation) หรือใช้เฉพาะการพิมพ์ครั้งนั้นๆ ได้
4. **Responsive & Tablet Ready**: ออกแบบให้ใช้งานสะดวกบน iPad / Tablet ที่วัดใช้งาน เพื่อให้เจ้าอาวาสหรือเจ้าหน้าที่สามารถเซ็นชื่อบนหน้าจอได้ทันที

---

## 5. Verification Plan

1. **Admin Settings**: ทดสอบแก้ไขข้อความชื่อวัด, คำอวยพร, อัปโหลดรูปตราประทับและลายเซ็น แล้วกดบันทึก
2. **Donation List**: ทดสอบเปิด Modal จากรายการบริจาคจริง ตรวจสอบการดึงข้อมูลเริ่มต้น
3. **Live Edit & Signature Pad**: ทดสอบแก้ไขชื่อผู้บริจาค, วาดลายเซ็นสดบน Canvas, สลับโหมดลายเซ็น
4. **Print / PDF Export**: ทดสอบสั่งพิมพ์ออกเครื่องพิมพ์จริง และพิมพ์เป็น PDF (Save to PDF) ตรวจสอบความถูกต้องของฟอนต์ไทยและเลย์เอาต์
