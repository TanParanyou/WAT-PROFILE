# คู่มือการนำระบบขึ้น Production (WAT-PROFILE)

เอกสารนี้คือคู่มือสำหรับนำโปรเจกต์ WAT-PROFILE ขึ้นระบบจริง (Production) โดยใช้ Tech Stack ดังนี้:
- **Frontend**: โฮสต์บน Vercel (เหมาะกับ Next.js)
- **Backend**: โฮสต์บน Render แบบ Web Service (รัน Go Fiber)
- **Database**: Supabase (ให้บริการ PostgreSQL)
- **Image Storage**: Cloudflare R2 (สำหรับเก็บรูปภาพ)
- **Email System**: Resend (สำหรับส่งอีเมลจากระบบ)

---

## 1. สิ่งที่ต้องเตรียม (Environment Variables)

ก่อนเริ่มการ Deploy ให้คุณสมัครบริการเหล่านี้ให้เรียบร้อย และจดค่าต่างๆ ไว้เพื่อนำไปตั้งค่า (**ห้าม** นำค่าเหล่านี้ไปใส่ในไฟล์โค้ดเด็ดขาด)

### 1.1 Database (Supabase)
- สมัครใช้งานและสร้าง Project บน Supabase
- ไปที่ **Project Settings > Database**
- คัดลอก **Connection string (URI)** (ให้ใช้ Port `5432` สำหรับการเชื่อมต่อตรง เพราะ Backend จัดการ Connection Pool เอง)
- **ค่าที่ต้องใช้**: `DATABASE_URL` (เช่น `postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`)

### 1.2 Image Storage (Cloudflare R2)
- สร้าง Bucket ใหม่บน Cloudflare R2
- ไปที่ **Manage R2 API Tokens** เพื่อสร้าง Token ใหม่ (ให้สิทธิ์ Object Read & Write)
- **ค่าที่ต้องใช้**: 
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET_NAME`
  - `R2_PUBLIC_URL`

### 1.3 Email System (Resend)
- สมัครใช้งานและผูกโดเมนของคุณเข้ากับ Resend
- สร้าง API Key
- **ค่าที่ต้องใช้**:
  - `RESEND_API_KEY`
  - `ACCOUNT_EMAIL_FROM` (อีเมลผู้ส่ง เช่น `no-reply@yourdomain.com`)

---

## 2. ขั้นตอน Deploy ฝั่ง Backend (Render)

1. ไปที่ Dashboard ของ Render -> กดปุ่ม **New** -> เลือก **Web Service**
2. เลือกเชื่อมต่อกับ GitHub Repository ของโปรเจกต์นี้
3. ตั้งค่า Service พื้นฐานดังนี้:
   - **Root Directory**: `backend` *(ต้องระบุ เพื่อให้ Render รู้ว่าโค้ดอยู่ที่ไหน)*
   - **Environment**: `Go`
   - **Build Command**: `go build -o bin/server ./cmd/app`
   - **Start Command**: `go run cmd/migrate/main.go up && ./bin/server` *(คำสั่งนี้จะทำการสร้างตารางฐานข้อมูลอัตโนมัติก่อนเริ่มเซิร์ฟเวอร์)*
4. กดกางเมนู **Advanced > Add Environment Variable** และใส่ค่าเหล่านี้ลงไป:
   - `ENV`: `production`
   - `PORT`: `8080`
   - `DATABASE_URL`: *(URI จาก Supabase)*
   - `DB_AUTO_MIGRATE`: `false`
   - `JWT_SECRET`: *(สุ่มตัวอักษรมั่วๆ ความยาว 32+ ตัวอักษร)*
   - `ALLOWED_ORIGINS`: `*` *(ใส่ `*` ไปก่อน เดี๋ยวเรากลับมาแก้ทีหลัง)*
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`: *(จาก Cloudflare)*
   - `AUTH_EMAIL_DELIVERY_MODE`: `resend`
   - `RESEND_API_KEY`: *(จาก Resend)*
   - `ACCOUNT_EMAIL_FROM`: *(จาก Resend)*
   - `ADMIN_EMAIL`: *(ใส่อีเมลสำหรับล็อคอินแอดมินคนแรก)*
   - `ADMIN_PASSWORD`: *(รหัสผ่านแอดมิน)*
   - `ADMIN_NAME`: *(ชื่อแอดมิน)*
5. กด **Create Web Service** แล้วรอจนกว่า Render จะทำการ Build เสร็จ 
6. เมื่อเสร็จสิ้น คุณจะได้ **URL ของ Backend** (เช่น `https://wat-profile-api.onrender.com`) มาเก็บไว้

---

## 3. ขั้นตอน Deploy ฝั่ง Frontend (Vercel)

1. ไปที่ Dashboard ของ Vercel -> กด **Add New...** -> เลือก **Project**
2. เลือกเชื่อมต่อกับ GitHub Repository ของโปรเจกต์
3. ตั้งค่าโปรเจกต์:
   - **Framework Preset**: Next.js (ระบบจะเลือกให้อัตโนมัติ)
   - **Root Directory**: `frontend` *(อย่าลืมเปลี่ยน)*
4. เปิดเมนู **Environment Variables** และตั้งค่าตัวแปร:
   - `NEXT_PUBLIC_API_URL`: *(ใส่ URL ของ Backend จากข้อ 2 แล้วเติม `/api/v1` ต่อท้าย เช่น `https://wat-profile-api.onrender.com/api/v1`)*
5. กด **Deploy** และรอจนกว่า Vercel จะ Build เสร็จ
6. เมื่อเสร็จสิ้น คุณจะได้ **URL ของ Frontend** (เช่น `https://wat-profile.vercel.app`)

---

## 4. ขั้นตอนสุดท้าย: การตั้งค่าความปลอดภัย (CORS)

หลังจากที่ได้ URL จาก Vercel มาแล้ว:
1. กลับไปที่หน้า Dashboard ของ Backend บน **Render**
2. ไปที่เมนู **Environment**
3. แก้ไขค่า `ALLOWED_ORIGINS` จากเดิมที่เป็น `*` ให้เปลี่ยนเป็น **URL ของ Vercel** (เช่น `https://wat-profile.vercel.app`)
4. กดบันทึก (Render จะทำการ Restart ระบบเพื่อใช้ค่าใหม่)

### **ข้อควรระวังเพิ่มเติม (Public Accounts)**
- หากในอนาคตคุณเปิดใช้งานระบบสมาชิก (ตั้งค่า `PUBLIC_ACCOUNT_AUTH_ENABLED=true` ฝั่ง Backend)
- อย่าลืมไปเพิ่ม Environment Variable ที่ชื่อ `PUBLIC_ACCOUNT_FRONTEND_URL` ใน Render ให้ชี้มาที่ URL ของ Vercel ด้วย เพื่อให้อีเมลยืนยันตัวตนต่างๆ ส่งลิงก์กลับมาถูกที่
