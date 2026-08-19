import type { GuideArticle } from "@/types/adminGuide";

export const financeGuides: GuideArticle[] = [
  {
    id: "guide-members",
    slug: "members",
    category: "finance",
    title: {
      th: "ระบบบริหารสมาชิกและญาติโยม (Members Management)",
      en: "Member Directory & Verification Management",
      de: "Mitgliederverwaltung & Verifizierung",
    },
    summary: {
      th: "การค้นหา ตรวจสอบประวัติสมาชิก ตรวจสอบสถานะการยืนยันตัวตน และการระงับ/ปลดระงับบัญชี",
      en: "Searching and reviewing member accounts, identity verification status, and account suspensions.",
      de: "Suchen und Überprüfen von Mitgliedskonten, Verifizierungsstatus und Kontosperrungen.",
    },
    iconName: "UserCheck",
    resource: "members",
    routePath: "/admin/members",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/members เพื่อดูรายชื่อสมาชิกทั้งหมด",
        en: "Navigate to /admin/members to view registered members.",
        de: "Zu /admin/members gehen für die Mitgliederübersicht.",
      },
      {
        th: "ใช้ช่องค้นหาชื่อ อีเมล หรือเบอร์โทรศัพท์",
        en: "Search members by name, email, or telephone.",
        de: "Mitglieder nach Name, E-Mail oder Telefon suchen.",
      },
      {
        th: "คลิกดูประวัติการบริจาคและกิจกรรมที่เคยเข้าร่วม",
        en: "Inspect donation history and past event attendances.",
        de: "Spendenhistorie und Teilnahme an Veranstaltungen einsehen.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "success",
        label: { th: "Active", en: "Active", de: "Aktiv" },
        meaning: {
          th: "บัญชีใช้งานได้ปกติ ยืนยันอีเมลเรียบร้อยแล้ว",
          en: "Account active with verified email.",
          de: "Konto aktiv mit verifizierter E-Mail-Adresse.",
        },
      },
      {
        badgeVariant: "warning",
        label: { th: "Unverified", en: "Unverified", de: "Unverifiziert" },
        meaning: {
          th: "สมัครแล้ว แต่ยังไม่ได้กดยืนยันลิงก์ในอีเมล",
          en: "Registered but pending email confirmation.",
          de: "Registriert, aber E-Mail-Bestätigung ausstehend.",
        },
      },
      {
        badgeVariant: "danger",
        label: { th: "Suspended", en: "Suspended", de: "Gesperrt" },
        meaning: {
          th: "บัญชีถูกระงับการใช้งานชั่วคราวหรือถาวร",
          en: "Account suspended due to policy violations.",
          de: "Konto aufgrund von Verstößen gesperrt.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "ค้นหาและตรวจสอบรายละเอียดสมาชิก",
          en: "Search and inspect profile",
          de: "Mitglieder suchen und prüfen",
        },
        description: {
          th: "คลิกที่ชื่อสมาชิกเพื่อเปิดดูข้อมูลส่วนตัว วันที่สมัคร ประวัติการร่วมกิจกรรม และประวัติการทำบุญ",
          en: "Click member row to view full profile, registration date, merit activities, and donations.",
          de: "Auf Mitglied klicken für vollständige Daten, Registrierungsdatum und Spendenhistorie.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["donations", "registrations", "accounts"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-donations",
    slug: "donations",
    category: "finance",
    title: {
      th: "การเงินและตรวจสอบสลิปเงินบริจาค (Donations & Proofs)",
      en: "Donations & Transfer Slip Verification",
      de: "Spendenverwaltung & Belegprüfung",
    },
    summary: {
      th: "ขั้นตอนการตรวจสอบหลักฐานสลิปโอนเงิน ยืนยันยอดเงินเข้าบัญชีวัด ปฏิเสธสลิป และออกใบอนุโมทนาบัตร",
      en: "Verifying bank transfer slips (Donation Proof), confirming funds, handling rejections, and issuing certificates.",
      de: "Prüfung von Überweisungsbelegen, Bestätigung des Geldeingangs und Ausstellung von Spendenbescheinigungen.",
    },
    iconName: "HandCoins",
    resource: "donations",
    routePath: "/admin/donations",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/donations กรองดูเฉพาะสถานะ 'รอตรวจสอบ' (Pending)",
        en: "Go to /admin/donations and filter by 'Pending'.",
        de: "Zu /admin/donations gehen und nach 'Ausstehend' filtern.",
      },
      {
        th: "คลิกที่ไอคอนรูปสลิปเพื่อเปิดดูรูปหลักฐานการโอนเงินฉบับเต็ม",
        en: "Click the slip thumbnail to view the high-resolution transfer receipt.",
        de: "Auf das Belegsymbol klicken, um die Quittung in voller Auflösung zu sehen.",
      },
      {
        th: "เทียบยอดเงิน วันที่ และบัญชีปลายทางกับ Statement วัด แล้วกด 'ยืนยัน' (Verify)",
        en: "Match amount, timestamp, and account with temple statement, then click 'Verify'.",
        de: "Betrag und Datum mit dem Kontoauszug abgleichen und auf 'Bestätigen' klicken.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "warning",
        label: { th: "Pending", en: "Pending", de: "Ausstehend" },
        meaning: {
          th: "ผู้บริจาคแนบสลิปแล้ว รอกรรมการการเงินตรวจสอบ",
          en: "Slip submitted; awaiting finance officer verification.",
          de: "Beleg hochgeladen; wartet auf Prüfung durch Finanzbeauftragten.",
        },
      },
      {
        badgeVariant: "success",
        label: { th: "Verified", en: "Verified", de: "Verifiziert" },
        meaning: {
          th: "ยอดเงินถูกต้อง ยืนยันเข้าบัญชีวัดเรียบร้อยแล้ว",
          en: "Amount verified and matched with temple bank statement.",
          de: "Betrag verifiziert und mit dem Tempelkonto abgeglichen.",
        },
      },
      {
        badgeVariant: "danger",
        label: { th: "Rejected", en: "Rejected", de: "Abgelehnt" },
        meaning: {
          th: "สลิปไม่ถูกต้อง ยอดเงินไม่ตรง หรือสลิปซ้ำซ้อน",
          en: "Invalid slip, incorrect amount, or duplicate submission.",
          de: "Ungültiger Beleg, falscher Betrag oder doppelte Einreichung.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "เข้าสู่หน้ารายการเงินบริจาค",
          en: "Open Donations List",
          de: "Spendenliste öffnen",
        },
        description: {
          th: "เข้าเมนู 'การเงินและชุมชน' > 'เงินบริจาค' ตารางจะแสดงรายการทำบุญทั้งหมด เรียงตามวันที่ล่าสุด",
          en: "Select 'Finance' > 'Donations' from the sidebar to view all submissions sorted by date.",
          de: "Wählen Sie 'Finanzen' > 'Spenden', um alle Einreichungen chronologisch zu sehen.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "ตรวจสอบสลิปหลักฐาน (Donation Proof)",
          en: "Inspect Donation Proof Slip",
          de: "Überweisungsbeleg prüfen",
        },
        description: {
          th: "คลิกที่รูปขนาดย่อของสลิป เพื่อเปิด Modal ขยายภาพ ตรวจสอบ 3 จุดสำคัญ: 1. ยอดเงินโอน 2. วันที่-เวลา 3. บัญชีปลายทางของวัด",
          en: "Click the slip thumbnail to view full image. Verify 3 critical points: 1. Exact amount, 2. Timestamp, 3. Temple bank account.",
          de: "Öffnen Sie den Beleg. Prüfen Sie: 1. Betrag, 2. Datum/Uhrzeit, 3. Zielkonto des Tempels.",
        },
        imageCaption: {
          th: "ตรวจสอบรายละเอียดสลิปโอนเงินและการเปรียบเทียบกับ Statement วัด",
          en: "Verification of bank transfer receipt details against temple statement",
          de: "Überprüfung der Überweisungsdetails mit dem Tempel-Kontoauszug",
        },
        tip: {
          th: "หลักฐานสลิปโอนเงินเป็นข้อมูลส่วนบุคคล (Private Asset) ระบบจะเข้ารหัสและเปิดให้ดูได้เฉพาะเจ้าหน้าที่ที่มีสิทธิ์เท่านั้น",
          en: "Donation slips are private assets accessible strictly to authorized finance personnel.",
          de: "Spendenbelege sind geschützte Dokumente und nur für autorisiertes Personal einsehbar.",
        },
      },
      {
        stepNumber: 3,
        title: {
          th: "อนุมัติหรือปฏิเสธรายการ",
          en: "Verify or Reject Submission",
          de: "Spende verifizieren oder ablehnen",
        },
        description: {
          th: "หากยอดเงินถูกต้อง ให้กดปุ่ม 'อนุมัติ' (Verify) ระบบจะอัปเดตยอดเงินรวมและส่งอีเมลขอบคุณพร้อมใบเสร็จไปยังผู้บริจาค หากไม่ถูกต้อง ให้กด 'ปฏิเสธ' พร้อมระบุเหตุผล",
          en: "If valid, click 'Verify' to update total funds and send e-receipt. If invalid, click 'Reject' with reason.",
          de: "Bei Gültigkeit auf 'Bestätigen' klicken (Quittung wird versendet). Bei Ungültigkeit auf 'Ablehnen' mit Begründung.",
        },
      },
    ],
    faqs: [
      {
        question: {
          th: "หากผู้บริจาคต้องการใบอนุโมทนาบัตรสำหรับลดหย่อนภาษี ต้องทำอย่างไร?",
          en: "How are tax-deductible certificate requests handled?",
          de: "Wie werden steuerlich absetzbare Spendenbescheinigungen ausgestellt?",
        },
        answer: {
          th: "ในรายละเอียดของรายการบริจาค จะมีข้อมูลเลขประจำตัวผู้เสียภาษีและที่อยู่สำหรับออกใบอนุโมทนาบัตร เจ้าหน้าที่สามารถกดปุ่ม 'พิมพ์ใบอนุโมทนาบัตร' (PDF) ได้ทันที",
          en: "The donation record includes tax ID and mailing address. Staff can click 'Export Certificate PDF' directly.",
          de: "Der Datensatz enthält Steuernummer und Adresse. Klicken Sie direkt auf 'Spendenbescheinigung (PDF)'.",
        },
      },
    ],
    relatedSlugs: ["members", "contacts", "audit-logs"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-contacts",
    slug: "contacts",
    category: "finance",
    title: {
      th: "กล่องข้อความติดต่อและสอบถาม (Contact Inquiries)",
      en: "Contact Inquiries & Message Inbox",
      de: "Kontaktanfragen & Posteingang",
    },
    summary: {
      th: "การจัดการข้อความสอบถามจากประชาชนผ่านแบบฟอร์มหน้าเว็บ การตอบกลับ และการติดตามสถานะ",
      en: "Managing public contact form messages, responding to visitors, and tracking resolution status.",
      de: "Verwaltung von Kontaktformular-Nachrichten, Beantwortung und Statusverfolgung.",
    },
    iconName: "Mail",
    resource: "contacts",
    routePath: "/admin/contacts",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/contacts เพื่อดูกล่องข้อความทั้งหมด",
        en: "Navigate to /admin/contacts to open inquiry inbox.",
        de: "Zu /admin/contacts navigieren für den Posteingang.",
      },
      {
        th: "คลิกอ่านข้อความและเรื่องที่ญาติโยมติดต่อสอบถาม",
        en: "Click to read full inquiry text and contact details.",
        de: "Klicken, um die Nachricht und Kontaktdaten zu lesen.",
      },
      {
        th: "เปลี่ยนสถานะเป็น 'In Progress' หรือ 'Resolved' เมื่อดำเนินการเสร็จสิ้น",
        en: "Update status to 'In Progress' or 'Resolved' once handled.",
        de: "Status auf 'In Bearbeitung' oder 'Erledigt' setzen.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "danger",
        label: { th: "New", en: "New", de: "Neu" },
        meaning: {
          th: "ข้อความใหม่ที่ยังไม่มีเจ้าหน้าที่เปิดอ่าน",
          en: "Unread new inquiry.",
          de: "Ungelesene neue Nachricht.",
        },
      },
      {
        badgeVariant: "warning",
        label: { th: "In Progress", en: "In Progress", de: "In Bearbeitung" },
        meaning: {
          th: "กำลังอยู่ระหว่างดำเนินการประสานงานหรือตอบกลับ",
          en: "Being processed or awaiting further info.",
          de: "Wird derzeit bearbeitet.",
        },
      },
      {
        badgeVariant: "success",
        label: { th: "Resolved", en: "Resolved", de: "Erledigt" },
        meaning: {
          th: "ตอบกลับและแก้ไขปัญหาให้ผู้ติดต่อเรียบร้อยแล้ว",
          en: "Successfully answered and resolved.",
          de: "Erfolgreich beantwortet und abgeschlossen.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "ตรวจสอบข้อความเข้าใหม่",
          en: "Read incoming inquiries",
          de: "Eingehende Nachrichten lesen",
        },
        description: {
          th: "ดูหัวข้อ ชื่อผู้ส่ง อีเมล เบอร์โทรศัพท์ และเนื้อหาข้อความสอบถาม",
          en: "Inspect subject, sender name, email, phone number, and message body.",
          de: "Betreff, Absender, E-Mail, Telefon und Inhalt einsehen.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["contact", "community"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-privacy-requests",
    slug: "privacy-requests",
    category: "finance",
    title: {
      th: "คำขอด้านข้อมูลส่วนบุคคล (PDPA/GDPR Requests)",
      en: "Privacy & Data Subject Rights Requests",
      de: "Datenschutz- und Betroffenenrechte (DSGVO)",
    },
    summary: {
      th: "การจัดการคำขอใช้สิทธิ์ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล เช่น คำขอลบข้อมูล คำขอส่งออกข้อมูล",
      en: "Processing data subject access, export, and erasure requests under statutory compliance.",
      de: "Bearbeitung von Auskunfts-, Export- und Löschanfragen gemäß Datenschutzgesetzgebung.",
    },
    iconName: "FileKey",
    resource: "privacy_requests",
    routePath: "/admin/privacy-requests",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/privacy-requests",
        en: "Go to /admin/privacy-requests",
        de: "Zu /admin/privacy-requests navigieren",
      },
      {
        th: "ตรวจสอบประเภทคำขอ (Export / Erasure) และวันที่ยื่นคำขอ",
        en: "Inspect request type (Export / Erasure) and submission date",
        de: "Antragstyp (Export / Löschung) und Einreichungsdatum prüfen",
      },
      {
        th: "ดำเนินการส่งออกข้อมูลหรือลบข้อมูลตามกรอบเวลาของกฎหมาย",
        en: "Fulfill data export or anonymization within statutory deadline",
        de: "Datenexport oder Löschung innerhalb der gesetzlichen Frist durchführen",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "ตรวจสอบคำขอและยืนยันตัวตน",
          en: "Verify request and identity",
          de: "Antrag und Identität prüfen",
        },
        description: {
          th: "ตรวจสอบว่าผู้ยื่นคำขอเป็นเจ้าของบัญชีจริง ก่อนดำเนินการส่งออกไฟล์ JSON/PDF หรือลบข้อมูลส่วนบุคคล",
          en: "Ensure requester identity matches account owner before processing export or erasure.",
          de: "Identität vor Export oder Löschung verifizieren.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["privacy", "members", "audit-logs"],
    updatedAt: "2026-08-19",
  },
];
