# Community Q&A production runbook

ใช้เอกสารนี้กับ staging/disposable PostgreSQL ก่อนเปิด member-write ใน production
เท่านั้น ค่า `PUBLIC_COMMUNITY_READ_ENABLED`, `PUBLIC_COMMUNITY_WRITE_ENABLED` และ
`COMMUNITY_EMAIL_ENABLED` ต้องเริ่มจาก `false` และ secrets ต้องมาจาก secret manager

## 1. Schema and rollback

```bash
cd backend
go run ./cmd/migrate/main.go up
go run ./cmd/migrate/main.go version
```

Expected: migrations `000046` และ `000047` สำเร็จ, categories มี `th/en/de` ครบ,
และ Admin role มี permission `community` เฉพาะ environment ทดสอบ การทดสอบ down
ให้ใช้ disposable database เท่านั้น:

```bash
go run ./cmd/migrate/main.go down
go run ./cmd/migrate/main.go down
go run ./cmd/migrate/main.go up
```

ห้ามใช้ destructive down migration เป็น production rollback; ใช้ feature flags แทน

## 2. Automated gates

```bash
GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
GOCACHE=/private/tmp/wat-profile-go-cache go build -o /private/tmp/wat-profile-api ./cmd/app
GOCACHE=/private/tmp/wat-profile-go-cache go build -o /private/tmp/wat-profile-worker ./cmd/operations-worker
GOCACHE=/private/tmp/wat-profile-go-cache go build -o /private/tmp/community-load-fixture ./cmd/community-load-fixture

cd ../frontend
npm run test:community
./node_modules/.bin/tsc --noEmit
npm run lint
```

Expected: ทุกคำสั่งผ่าน และไม่มี Community file lint error

สถานะ repository ณ วันทำงานนี้: `npm run lint` ยัง fail จาก baseline นอก Community
(เช่น `src/app/[locale]/admin/login/page.tsx` `no-explicit-any`,
`src/components/admin/website/WebsitePageEditorShell.tsx`
`react-hooks/set-state-in-effect`, และ `src/components/public/media/PublicImage.tsx`
กฎเดียวกัน) ส่วน targeted Community lint ต้องผ่านก่อน merge

## 3. Browser acceptance matrix

- Anonymous: เปิด `/th/community`, ค้นหา, เปลี่ยน category/locale, เปิดคำถามที่ published;
  pending/hidden/deleted ต้องไม่แสดงและ response ต้องไม่เปิดเผย email, IP, report หรือ body_text
- Verified member: สมัคร/ยืนยันอีเมล, ถาม/ตอบ/comment, refresh แล้ว idempotency ไม่สร้างซ้ำ
- New member: post แรกเป็น `202 pending_review`; trusted member เห็น published ทันที
- Restricted/banned member: mutation ได้ `403`, ไม่มี bypass ผ่าน UI หรือ API
- Question owner: รับคำตอบ/comment, ยอมรับคำตอบได้ครั้งเดียว; Accepted + Official + Helpful อยู่ร่วมกันได้
- Admin: queue/revision/category/report/member restriction ใช้ RBAC จริง; reporter identity/details ไม่ออก public
- Notification: badge poll ทุก 60 วินาทีเฉพาะ authenticated/visible tab, mark one/all, preference ครบ 8 event types

ตรวจทุก flow ใน `th`, `en`, `de`, mobile/desktop, keyboard-only, screen reader,
200% zoom, reduced motion และ light/dark mode; controls ต้องกดได้อย่างน้อย 44px

## 4. Abuse, security, and race checks

- ส่ง rich text ที่มี script, event handler, iframe, unsafe URL และ JSON node แปลกปลอม: ต้อง `400`
- ยิง question/answer/comment/vote/report/search เกิน limit: ต้อง `429` พร้อม `Retry-After`
- ลองแก้/ลบ/mark-read/report ด้วย UUID ของผู้ใช้อื่น: ต้อง `403/404` และไม่เปลี่ยนข้อมูล
- ยิง helpful PUT/DELETE พร้อมกัน: count ต้องเท่ากับจำนวน vote จริง; รัน reconciliation แล้วไม่ drift
- ส่ง report ซ้ำ target เดิม: ต้อง `409` และมี report เดียว
- ตรวจ outbox ด้วย worker สอง process: ไม่มี email ซ้ำ; failure retry และ dead-letter ทำงาน

## 5. Privacy and maintenance

สร้าง privacy request แบบ access/erasure หลัง verify แล้วตรวจว่า export มีเฉพาะ
questions, answers, comments, votes, notifications และ restriction ของ subject; ไม่มี
ข้อมูล reporter/สมาชิกอื่น/outbox payload เมื่อปิดบัญชี public author ต้องเป็น
`Former member` ทันที ไม่มี avatar

รัน worker ซ้ำได้ทุกวัน (job key deterministic):

```bash
go run ./cmd/operations-worker
```

ตรวจ count-only logs ของ author anonymization 90 วัน, tombstone/soft-delete 90 วัน,
read notifications 180 วัน, moderation audit 24 เดือน และ expired rate buckets

## 6. Load, backup, and rollback rehearsal

บน disposable staging เท่านั้น:

```bash
ENV=staging COMMUNITY_FIXTURE_CONFIRM=generate \
  COMMUNITY_FIXTURE_QUESTIONS=100000 COMMUNITY_FIXTURE_ANSWERS_PER_QUESTION=5 \
  go run ./cmd/community-load-fixture
```

คำสั่งนี้ปฏิเสธ `ENV=production`, ใช้ deterministic fixture accounts/IDs และไม่ส่ง
notification เอง ลบ fixture ด้วย transaction ที่ระบุ IDs เท่านั้น ห้าม `TRUNCATE` ตาราง
production วัด public read p95 < 400ms และ mutation p95 < 700ms ที่ 100 concurrent users;
email 95% ต้อง dispatch ภายใน 60 วินาที

ทำ backup/restore บน disposable database, ตรวจ migration version/row counts/indexes,
แล้วซ้อม rollback โดยปิด frontend flag ก่อน backend flag จากนั้นเปิด public read ใน
staging, เปิด member-write เฉพาะ designated accounts, และเปิด email เป็นขั้นสุดท้าย

## 7. Release monitoring

ติดตาม API p95/error, rate-limit counts, moderation age/report backlog, outbox lag and
dead letters, reconciliation drift, retention failures, worker liveness และการส่ง email
ที่ไม่มี content/report detail ใน logs ก่อนเปิด production member-write
