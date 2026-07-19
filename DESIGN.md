---
name: "Wat Loung Por Sai"
description: "A calm, trustworthy digital sanctuary that guides people from discovery to Dharma practice."
colors:
  faith-gold: "#C88D1E"
  faith-gold-deep: "#A97016"
  faith-gold-soft: "#FCF9F2"
  forest-calm: "#4A6741"
  morning-amber: "#EEA111"
  warm-ground: "#FCF3E9"
  clear-surface: "#FFFFFF"
  grounded-ink: "#2B1F08"
  quiet-text: "#563F10"
  night-ground: "#160E03"
typography:
  display:
    fontFamily: "Pridi, Georgia, Times New Roman, serif"
    fontSize: "clamp(3rem, 7vw, 6rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Pridi, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Pridi, Georgia, Times New Roman, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Noto Sans Thai, Inter, Segoe UI, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Noto Sans Thai, Inter, Segoe UI, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.faith-gold}"
    textColor: "{colors.clear-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "12px 32px"
  button-primary-hover:
    backgroundColor: "{colors.faith-gold-deep}"
    textColor: "{colors.clear-surface}"
  button-secondary:
    backgroundColor: "{colors.clear-surface}"
    textColor: "{colors.faith-gold}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  input-default:
    backgroundColor: "{colors.clear-surface}"
    textColor: "{colors.grounded-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  content-card:
    backgroundColor: "{colors.clear-surface}"
    textColor: "{colors.grounded-ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Wat Loung Por Sai

## 1. Overview

**Creative North Star: "ศาลาแห่งความสงบ — The Quiet Sala"**

ระบบภาพทำหน้าที่เหมือนศาลาที่เปิดรับผู้มาเยือน: สงบ มองเห็นทางเข้า และมีจุดหมายถัดไปชัดเจน ภาพจริงของวัด พระสงฆ์ และกิจกรรมเป็นผู้เล่าเรื่องหลัก ส่วนสีทองแห่งศรัทธาทำหน้าที่นำสายตาไปยังข้อมูลและการกระทำที่สำคัญ

ความสงบไม่ใช่ความว่างเปล่าหรือความหรูหรา แต่คือการจัดลำดับข้อมูลอย่างจริงใจ ใช้พื้นที่ว่างให้เนื้อหาหายใจ และทำให้ภาษาไทย อังกฤษ และเยอรมันอ่านง่ายเท่าเทียมกัน ระบบนี้ปฏิเสธความเชิงพาณิชย์ที่โอ้อวด การตกแต่งด้วยทองหรือลายไทยเกินจำเป็น และหน้าที่แน่นจนองค์ประกอบแข่งขันกัน

**Key Characteristics:**

- ภาพสถานที่และกิจกรรมจริงนำอารมณ์ของหน้า
- สีทองใช้เพื่อการนำทาง ไม่ใช้เป็นเครื่องประดับทั่วทั้งหน้า
- พื้นผิวสงบและโครงสร้างข้อมูลชัดเจนบนทุกขนาดหน้าจอ
- การเคลื่อนไหวสุภาพและเคารพ `prefers-reduced-motion`
- เว็บไซต์สาธารณะอบอุ่นและเล่าเรื่อง ส่วน CMS คงความเงียบและเน้นประสิทธิภาพ

## 2. Colors

พาเลตต์ผสานทองอมน้ำตาล เขียวป่า และพื้นผิวโทนอุ่นจากระบบปัจจุบัน โดยให้ภาพถ่ายจริงรับหน้าที่สร้างบรรยากาศส่วนใหญ่

### Primary

- **ทองแห่งศรัทธา — Faith Gold** (`#C88D1E`): ใช้กับ CTA หลัก ลิงก์สำคัญ สถานะที่เลือก และหัวเรื่องที่ต้องนำสายตา
- **ทองแห่งศรัทธาเข้ม — Deep Faith Gold** (`#A97016`): ใช้สำหรับ hover และสถานะที่ต้องเพิ่มความชัดโดยไม่เปลี่ยนบุคลิก
- **เงาทองอ่อน — Soft Gold Wash** (`#FCF9F2`): ใช้เป็นพื้นหลังสถานะหรือพื้นที่เน้นขนาดเล็ก ไม่ใช้เป็นพื้นหลังหลักทุกส่วน

### Secondary

- **เขียวป่าอันสงบ — Forest Calm** (`#4A6741`): ใช้กับข้อมูลรองที่เชื่อมกับธรรมชาติ การปฏิบัติ และความสงบ

### Tertiary

- **แสงอำพัน — Morning Amber** (`#EEA111`): ใช้กับการแจ้งเตือนหรือจุดเน้นที่จำเป็นเท่านั้น ห้ามแข่งขันกับ CTA หลัก

### Neutral

- **พื้นดินอุ่น — Warm Ground** (`#FCF3E9`): พื้นหลังสว่างของระบบปัจจุบัน
- **พื้นผิวใส — Clear Surface** (`#FFFFFF`): พื้นผิวเนื้อหา ช่องกรอกข้อมูล และชั้นที่ต้องการความชัดสูง
- **หมึกหยั่งราก — Grounded Ink** (`#2B1F08`): ข้อความหลักบนพื้นสว่าง
- **ข้อความสงบ — Quiet Text** (`#563F10`): ข้อความรองที่ยังต้องผ่านเกณฑ์คอนทราสต์
- **พื้นราตรี — Night Ground** (`#160E03`): พื้นหลักของโหมดมืด

**The Guiding Gold Rule.** สีทองคือป้ายบอกทาง ใช้กับการกระทำหรือข้อมูลที่สำคัญจริงเท่านั้น ไม่ราดทั่วพื้นผิวเพื่อสร้างความรู้สึกหรูหรา

**The Image Carries Culture Rule.** ถ่ายทอดความเป็นวัดไทยผ่านภาพจริง เนื้อหา และบริบท ห้ามพึ่งสีทอง ลายไทย หรือสัญลักษณ์ทางศาสนาซ้ำ ๆ เป็นทางลัด

## 3. Typography

**Display Font:** Pridi (fallback: Georgia, Times New Roman, serif)
**Body Font:** Noto Sans Thai (fallback: Inter, Segoe UI, Arial, sans-serif)

**Character:** Pridi ให้หัวเรื่องภาษาไทยมีความหนักแน่นและความเคารพ ขณะที่ Noto Sans Thai ช่วยให้ข้อมูลหลายภาษาและรายละเอียดกิจกรรมอ่านง่าย; เมื่อภาษาไม่ได้รับการรองรับ ให้ใช้ fallback ที่กำหนดตามลำดับ

### Hierarchy

- **Display** (700, `clamp(3rem, 7vw, 6rem)`, 1.2): ชื่อวัดและข้อความหลักใน hero เท่านั้น ต้องใช้ `text-wrap: balance`
- **Headline** (700, `clamp(1.875rem, 4vw, 3rem)`, 1.2): หัวเรื่องหลักของแต่ละช่วงและหน้า
- **Title** (700, `1.5rem`, 1.3): ชื่อกิจกรรม บุคคล และกลุ่มเนื้อหา
- **Body** (400, `1.125rem`, 1.75): เนื้อหาหลัก จำกัดความยาวบรรทัดไว้ที่ 65–75ch และใช้ `text-wrap: pretty`
- **Label** (500, `0.875rem`, 1.5): เมนู ปุ่ม วันที่ และข้อมูลกำกับ ใช้อักษรตัวพิมพ์ใหญ่เฉพาะป้ายสั้นที่มีเหตุผล

**The Read Before Reverence Rule.** ความน่าเคารพต้องไม่แลกกับการอ่านยาก ข้อความทุกภาษาต้องมีขนาด ระยะบรรทัด และคอนทราสต์เพียงพอก่อนพิจารณาความงาม

**The One H1 Rule.** แต่ละหน้ามี H1 เพียงหนึ่งตัว ห้ามใช้ H1 ซ้ำเพื่อจัดขนาดหัวเรื่องในแต่ละ section

## 4. Elevation

ระบบใช้การแบ่งชั้นแบบพอดี: สีพื้น ช่องว่าง และเส้นขอบบางสร้างโครงสร้างหลัก เงาปรากฏเฉพาะเมื่อพื้นผิวลอยจริง เช่น navigation ที่ติดด้านบน modal หรือสถานะ hover ห้ามจับคู่เส้นขอบ 1px กับเงาฟุ้งกว้างเพื่อการตกแต่ง

### Shadow Vocabulary

- **Resting Surface** (`box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)`): ใช้กับพื้นผิวที่ต้องแยกจากฉากหลังเพียงเล็กน้อย
- **Interactive Lift** (`box-shadow: 0 4px 8px rgba(43, 31, 8, 0.10)`): ใช้ระหว่าง hover ขององค์ประกอบที่คลิกได้เท่านั้น
- **Modal Layer** (`box-shadow: 0 8px 24px rgba(22, 14, 3, 0.18)`): สงวนไว้สำหรับ dialog และ overlay ที่ลอยเหนือเนื้อหา

**The Flat-at-Rest Rule.** พื้นผิวทั่วไปแบนราบ เงาเกิดขึ้นเพราะลำดับชั้นหรือสถานะโต้ตอบ ไม่ใช่เพื่อทำให้ทุกกล่องดูเป็นการ์ด

## 5. Components

คอมโพเนนต์ต้องให้ความรู้สึกเรียบสงบ ชัดเจน และสัมผัสนุ่มโดยไม่ฟุ่มเฟือย

### Buttons

- **Shape:** CTA หลักเป็นทรง pill (`9999px`); ปุ่มใช้งานทั่วไปใช้มุมโค้งสุภาพ (`8px`)
- **Primary:** พื้นทองแห่งศรัทธา ตัวอักษรขาว ระยะภายใน `12px 32px` สำหรับ hero CTA
- **Hover / Focus:** hover เปลี่ยนเป็นทองเข้มภายใน 200–300ms; focus ใช้วงแหวนที่เห็นชัดอย่างน้อย 2px และห้ามพึ่งสีอย่างเดียว
- **Secondary / Ghost:** พื้นขาวหรือโปร่ง ตัวอักษรสีทองหรือหมึกหลัก ใช้เมื่อความสำคัญรองจาก CTA หลักอย่างชัดเจน

### Chips

- **Style:** ข้อมูลวันที่หรือหมวดหมู่ใช้พื้นอ่อน ตัวอักษรเข้ม และมุม pill โดยไม่มีเงาฟุ้ง
- **State:** สถานะเลือกใช้พื้นทองและข้อความขาว; สถานะไม่เลือกใช้พื้น neutral พร้อม hover ที่ชัดเจน

### Cards / Containers

- **Corner Style:** การ์ดทั่วไปใช้ `12–16px`; ห้ามเกิน `16px` สำหรับการ์ดเนื้อหาปกติ
- **Background:** พื้นผิวขาวบนพื้นดินอุ่นหรือ neutral ที่ต่างกันอย่างเห็นได้ชัด
- **Shadow Strategy:** แบนราบเป็นค่าเริ่มต้น ใช้ Resting Surface เมื่อจำเป็นและ Interactive Lift เฉพาะ hover
- **Border:** ใช้เส้น neutral บาง 1px เมื่อช่วยแบ่งโครงสร้าง ห้ามใช้เส้นแถบสีด้านข้าง
- **Internal Padding:** `24px` เป็นค่าหลัก; เนื้อหาขนาดใหญ่ใช้ `32px` เมื่อพื้นที่อนุญาต

### Inputs / Fields

- **Style:** พื้นขาว เส้น neutral 1px มุม `8px` ระยะ `8px 12px` และ placeholder ต้องมีคอนทราสต์อย่างน้อย 4.5:1
- **Focus:** เส้นขอบทองพร้อมวงแหวนโปร่ง 2px โดยไม่ทำให้ layout ขยับ
- **Error / Disabled:** error มีข้อความอธิบายและไอคอน ไม่ใช้สีแดงอย่างเดียว; disabled ยังคงอ่านได้และแสดงเหตุผลเมื่อจำเป็น

### Navigation

Desktop ใช้ navigation แบบ pill ที่ลอยเหนือ hero และเปลี่ยนเป็นพื้นทึบเมื่อ scroll; active item ใช้พื้นขาวกับข้อความทอง Mobile ใช้เมนูเต็มหน้าจอ ลิงก์ขนาดใหญ่ และ touch target อย่างน้อย 44px การเปลี่ยนสถานะอยู่ที่ 200–500ms และต้องมี reduced-motion alternative

### Hero

ภาพจริงของวัดเต็มพื้นที่เป็นแกนหลัก มี overlay ที่รักษาคอนทราสต์ข้อความ ชื่อวัดจำกัดขนาดสูงสุด 6rem และ CTA หลักพาไปยังกิจกรรม การเปิดหน้าต้องแสดงเนื้อหาได้ทันทีแม้ motion ไม่ทำงาน

## 6. Do's and Don'ts

### Do:

- **Do** ใช้ภาพวัด พระสงฆ์ และกิจกรรมจริงเป็นหลักฐานและตัวสร้างอารมณ์ของหน้า
- **Do** ใช้ Faith Gold (`#C88D1E`) เพื่อชี้การกระทำหรือข้อมูลที่สำคัญจริง
- **Do** จำกัดการ์ดทั่วไปที่มุม `12–16px` และใช้พื้นที่ว่างสร้างลำดับชั้น
- **Do** รักษา body text ที่ `1.125rem/1.75` และความยาวบรรทัด 65–75ch สำหรับเนื้อหายาว
- **Do** ออกแบบและทดสอบภาษาไทย อังกฤษ และเยอรมันบนมือถือ แท็บเล็ต และเดสก์ท็อป
- **Do** รองรับคีย์บอร์ด โปรแกรมอ่านหน้าจอ การซูม และ `prefers-reduced-motion`

### Don't:

- **Don't** ทำให้เว็บไซต์ดูหรูหราหรือเชิงพาณิชย์จนกลบความเรียบสงบของวัด
- **Don't** ใช้ลวดลายไทย สีทอง หรือสัญลักษณ์ทางศาสนามากเกินไป
- **Don't** จัดเนื้อหาแน่น อ่านยาก หรือปล่อยให้องค์ประกอบแข่งขันกัน
- **Don't** ทำให้เว็บไซต์ดูเหมือนเทมเพลตเว็บไซต์วัดทั่วไปจนขาดตัวตนของวัดหลวงพ่อใส
- **Don't** ใช้ภาพหรือถ้อยคำที่โอ้อวดเกินจริง
- **Don't** ใช้ gradient text, side-stripe border, decorative grid, repeating stripes หรือ glassmorphism เป็นค่าเริ่มต้น
- **Don't** จับคู่เส้นขอบ 1px กับเงาฟุ้งที่ blur ตั้งแต่ 16px ขึ้นไปบนการ์ดหรือปุ่ม
- **Don't** ใช้มุมโค้งเกิน `16px` บนการ์ดเนื้อหาปกติ หรือปล่อยหัวเรื่องล้นกรอบบนหน้าจอแคบ
- **Don't** ใช้ H1 ซ้ำหลายตัวในหน้าเดียว หรือใช้ tiny uppercase eyebrow ซ้ำเหนือทุก section
