import type { GuideArticle } from "@/types/adminGuide";

export const systemGuides: GuideArticle[] = [
  {
    id: "guide-users",
    slug: "users",
    category: "system",
    title: {
      th: "การจัดการผู้ดูแลระบบและเจ้าหน้าที่ (Admin Users)",
      en: "Admin User Management & Invitations",
      de: "Administrator- und Mitarbeiterverwaltung",
    },
    summary: {
      th: "การสร้างบัญชีเจ้าหน้าที่วัด การกำหนดบทบาท (Role) และการรีเซ็ตรหัสผ่าน",
      en: "Creating staff accounts, assigning RBAC roles, and resetting credentials.",
      de: "Erstellung von Mitarbeiterkonten, Rollenzuweisung und Passwortrücksetzung.",
    },
    iconName: "UserCog",
    resource: "users",
    routePath: "/admin/users",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/users เพื่อดูรายชื่อเจ้าหน้าที่ทั้งหมด",
        en: "Go to /admin/users to view all administrative staff.",
        de: "Zu /admin/users gehen für alle Administratoren.",
      },
      {
        th: "กด '+ เพิ่มผู้ดูแลระบบ' กรอกชื่อ อีเมล และเลือกบทบาท (Role)",
        en: "Click '+ Add User', fill name, email, and assign role.",
        de: "Auf '+ Benutzer hinzufügen' klicken, Name, E-Mail und Rolle eingeben.",
      },
      {
        th: "เจ้าหน้าที่จะได้รับอีเมลพร้อมลิงก์ตั้งรหัสผ่านเข้าใช้งานระบบ",
        en: "Staff receives invitation email to set password.",
        de: "Mitarbeiter erhält Einladungs-E-Mail zur Passworterstellung.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "success",
        label: { th: "Active", en: "Active", de: "Aktiv" },
        meaning: {
          th: "เจ้าหน้าที่สามารถเข้าสู่ระบบและทำงานได้ปกติ",
          en: "Account active with full operational access.",
          de: "Konto aktiv mit normalem Zugriff.",
        },
      },
      {
        badgeVariant: "danger",
        label: { th: "Disabled", en: "Disabled", de: "Deaktiviert" },
        meaning: {
          th: "ปิดการเข้าถึงระบบชั่วคราว ไม่สามารถล็อกอินได้",
          en: "Access revoked; cannot sign in.",
          de: "Zugriff gesperrt; keine Anmeldung möglich.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "เพิ่มเจ้าหน้าที่ใหม่",
          en: "Add New Admin User",
          de: "Neuen Benutzer hinzufügen",
        },
        description: {
          th: "คลิกปุ่ม 'เพิ่มผู้ดูแลระบบ' กรอกชื่อ นามสกุล อีเมลทางการ และเลือกบทบาท เช่น Super Admin, เจ้าหน้าที่การเงิน, ผู้ดูแลกิจกรรม",
          en: "Click 'Add User', provide full name, official email, and select role (Super Admin, Finance, Event Staff).",
          de: "Name, offizielle E-Mail und Rolle (Super Admin, Finanzen, Event-Team) festlegen.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["roles", "accounts", "audit-logs"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-accounts",
    slug: "accounts",
    category: "system",
    title: {
      th: "การควบคุมความปลอดภัยบัญชี (Account Operations)",
      en: "Account Security Operations & Session Control",
      de: "Kontosicherheit & Sitzungssteuerung",
    },
    summary: {
      th: "การตรวจสอบสถานะความปลอดภัย การบังคับออกจากระบบ (Force Logout) และการปลดล็อคบัญชี",
      en: "Monitoring security events, revoking compromised sessions, and unlocking locked accounts.",
      de: "Überwachung von Sicherheitsereignissen, Sitzungsbeendigung und Kontoentsperrung.",
    },
    iconName: "UserRoundCheck",
    resource: "account_operations",
    routePath: "/admin/accounts",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/accounts",
        en: "Navigate to /admin/accounts",
        de: "Zu /admin/accounts navigieren",
      },
      {
        th: "ตรวจสอบประวัติการพยายามเข้าสู่ระบบที่ล้มเหลว",
        en: "Inspect failed login attempts and lockout flags",
        de: "Fehlgeschlagene Anmeldeversuche einsehen",
      },
      {
        th: "กด 'Force Logout' เพื่อยกเลิกเซสชันอุปกรณ์ที่น่าสงสัย",
        en: "Trigger 'Force Logout' to invalidate suspicious sessions",
        de: "Sitzungen bei Verdacht sofort beenden",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "จัดการเซสชันและความปลอดภัย",
          en: "Manage Active Sessions",
          de: "Aktive Sitzungen verwalten",
        },
        description: {
          th: "สามารถสั่งตัดการเชื่อมต่อของอุปกรณ์ทั้งหมดของบัญชีที่สงสัยว่าถูกแฮกหรือรหัสผ่านรั่วไหลได้ทันที",
          en: "Instantly revoke all active refresh tokens for compromised or lost devices.",
          de: "Alle aktiven Sitzungen für gefährdete Konten sofort widerrufen.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["users", "audit-logs"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-roles",
    slug: "roles",
    category: "system",
    title: {
      th: "บทบาทและสิทธิ์การใช้งาน (Roles & RBAC Permissions)",
      en: "Roles & Granular RBAC Permissions",
      de: "Rollen & Detaillierte Berechtigungen (RBAC)",
    },
    summary: {
      th: "การสร้างบทบาทและกำหนดสิทธิ์แบบละเอียด (Create, Read, Update, Delete) รายโมดูล",
      en: "Configuring roles and granular permissions (Create, Read, Update, Delete) per resource.",
      de: "Konfiguration von Rollen und granularen Zugriffsrechten (Erstellen, Lesen, Bearbeiten, Löschen).",
    },
    iconName: "Shield",
    resource: "users",
    routePath: "/admin/roles",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/roles เพื่อดูตารางบทบาททั้งหมด",
        en: "Navigate to /admin/roles to view role matrix.",
        de: "Zu /admin/roles gehen für die Rollenmatrix.",
      },
      {
        th: "กด '+ สร้างบทบาท' หรือคลิกแก้ไขบทบาทที่มีอยู่",
        en: "Click '+ Create Role' or edit an existing one.",
        de: "Auf '+ Rolle erstellen' klicken oder bestehende bearbeiten.",
      },
      {
        th: "ติ๊กเลือกสิทธิ์ Create/Read/Update/Delete ในแต่ละโมดูลอย่างระมัดระวัง",
        en: "Check Create/Read/Update/Delete boxes per module carefully.",
        de: "Berechtigungen pro Modul sorgfältig auswählen.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "สร้างหรือแก้ไขบทบาท",
          en: "Create or Edit Role",
          de: "Rolle anlegen oder bearbeiten",
        },
        description: {
          th: "ตั้งชื่อบทบาท เช่น 'ผู้ช่วยฝ่ายพิธีสงฆ์' พร้อมคำอธิบายหน้าที่ความรับผิดชอบ",
          en: "Define role name (e.g. 'Ceremony Coordinator') and operational scope.",
          de: "Rollenname (z.B. 'Zeremonienkoordinator') und Aufgabenbereich definieren.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "กำหนดสิทธิ์ตามหลักความจำเป็นขั้นต่ำ (Least Privilege)",
          en: "Apply Least Privilege Principle",
          de: "Prinzip der geringsten Rechte anwenden",
        },
        description: {
          th: "เลือกเปิดเฉพาะสิทธิ์ที่เจ้าหน้าที่ตำแหน่งนั้นต้องใช้งานจริง เช่น เจ้าหน้าที่กิจกรรมควรได้สิทธิ์เฉพาะ Events, Calendar, Registrations เท่านั้น โดยไม่ต้องเข้าถึงโมดูลการเงินหรือสิทธิ์ระบบ",
          en: "Grant only permissions essential for the duty (e.g. event staff need access to events/calendar, not finance).",
          de: "Gewähren Sie nur notwendige Berechtigungen (z.B. Event-Team benötigt keinen Zugriff auf Finanzen).",
        },
        image: "/images/guide/rbac-matrix.svg",
        imageCaption: {
          th: "ตัวอย่างตารางการกำหนดสิทธิ์แบบละเอียด (RBAC Granular Permissions Matrix)",
          en: "Role-Based Access Control granular permissions matrix preview",
          de: "Rollenbasierte granulare Berechtigungsmatrix",
        },
        warning: {
          th: "บทบาท Super Admin ควรสงวนไว้สำหรับเจ้าอาวาสหรือผู้ดูแลระบบหลักเท่านั้น",
          en: "Super Admin role should be strictly reserved for Abbot and chief system administrators.",
          de: "Die Super-Admin-Rolle sollte ausschließlich der Tempelleitung vorbehalten sein.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["users", "audit-logs"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-audit-logs",
    slug: "audit-logs",
    category: "system",
    title: {
      th: "ประวัติการใช้งานระบบ (Audit Logs)",
      en: "Audit Trail & Activity Logs",
      de: "Aktivitätsprotokolle & Audit-Logs",
    },
    summary: {
      th: "การตรวจสอบประวัติการแก้ไขข้อมูลย้อนหลัง ตรวจสอบใครทำอะไร เมื่อไหร่ จาก IP Address ไหน",
      en: "Inspecting immutable mutation logs, tracking who changed what, timestamps, and IP addresses.",
      de: "Prüfung unveränderlicher Änderungsprotokolle: Wer hat was, wann und von welcher IP geändert.",
    },
    iconName: "Activity",
    resource: "audit_logs",
    routePath: "/admin/audit-logs",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/audit-logs เพื่อดูบันทึกกิจกรรมย้อนหลัง",
        en: "Navigate to /admin/audit-logs to inspect audit trail.",
        de: "Zu /admin/audit-logs gehen für das Audit-Protokoll.",
      },
      {
        th: "กรองตามชื่อผู้กระทำ (Actor), โมดูล (Resource), หรือช่วงเวลา",
        en: "Filter by Actor, Resource, Action, or Date range.",
        de: "Nach Benutzer, Modul, Aktion oder Zeitraum filtern.",
      },
      {
        th: "คลิกดูความเปลี่ยนแปลงของข้อมูล (Data Diff / Changes)",
        en: "Click row to view full JSON payload and diff before/after.",
        de: "Zeile anklicken für Details und Vorher-/Nachher-Vergleich.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "ค้นหาและตรวจสอบบันทึก",
          en: "Search Audit Records",
          de: "Protokolleinträge durchsuchen",
        },
        description: {
          th: "บันทึกในระบบเป็นข้อมูลแบบอ่านอย่างเดียว (Read-Only) ไม่สามารถแก้ไขหรือลบได้ เพื่อความโปร่งใสและตรวจสอบได้ 100%",
          en: "Audit logs are strictly immutable and tamper-proof for complete operational transparency.",
          de: "Audit-Logs sind unveränderlich und manipulationssicher für maximale Transparenz.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["users", "roles", "settings"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-settings",
    slug: "settings",
    category: "system",
    title: {
      th: "การตั้งค่าระบบทั่วไป (System Settings)",
      en: "System Settings & Notification Config",
      de: "Systemeinstellungen & Benachrichtigungen",
    },
    summary: {
      th: "การตั้งค่าระบบแจ้งเตือนอีเมล (SMTP), โหมดปิดปรับปรุงชั่วคราว, และการเชื่อมต่อภายนอก",
      en: "Configuring email notifications (SMTP), maintenance mode, and global system parameters.",
      de: "Konfiguration von E-Mail-Benachrichtigungen (SMTP), Wartungsmodus und Grundeinstellungen.",
    },
    iconName: "Settings",
    resource: "settings",
    routePath: "/admin/settings",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/settings",
        en: "Open /admin/settings",
        de: "Zu /admin/settings navigieren",
      },
      {
        th: "กำหนดค่าระบบอีเมลและข้อความแจ้งเตือนอัตโนมัติ",
        en: "Configure email dispatch settings and alert templates",
        de: "E-Mail-Versand und Benachrichtigungsvorlagen einrichten",
      },
      {
        th: "บันทึกและทดสอบส่งอีเมลทดสอบ (Test Email)",
        en: "Save changes and send test email",
        de: "Speichern und Test-E-Mail versenden",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "ตั้งค่าเซิร์ฟเวอร์อีเมลและระบบแจ้งเตือน",
          en: "Configure SMTP Server",
          de: "SMTP-Server einrichten",
        },
        description: {
          th: "กรอก Host, Port, Username, Password และชื่อผู้ส่งของวัด เพื่อให้ระบบส่งใบเสร็จและแจ้งเตือนไปยังญาติโยมได้อย่างราบรื่น",
          en: "Set SMTP host, port, credentials, and sender name to ensure seamless receipt delivery.",
          de: "SMTP-Daten eintragen für zuverlässigen Versand von Bestätigungen und Quittungen.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["contact", "audit-logs", "environment-config"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-environment-config",
    slug: "environment-config",
    category: "system",
    title: {
      th: "การตั้งค่าสภาพแวดล้อมระบบ (Environment Variables Config)",
      en: "System Environment Variables & Deployment Config",
      de: "System-Umgebungsvariablen & Deployment-Konfiguration",
    },
    summary: {
      th: "คู่มือการตั้งค่า .env สำหรับ Backend และ Frontend การจัดการ Secret, การเชื่อมต่อ Cloudflare R2, ฐานข้อมูล PostgreSQL และกฎความปลอดภัย",
      en: "Complete guide for configuring Backend and Frontend .env, managing secrets, Cloudflare R2 storage, PostgreSQL, and security rules.",
      de: "Vollständiger Leitfaden zur Konfiguration von Backend- und Frontend-.env, Secret-Management, Cloudflare R2, PostgreSQL und Sicherheit.",
    },
    iconName: "Server",
    resource: "settings",
    superAdminOnly: true,
    routePath: "/admin/settings",
    quickSteps: [
      {
        th: "คัดลอกไฟล์ .env.example เป็น .env (Backend) และ .env.local (Frontend)",
        en: "Copy .env.example to .env (Backend) and .env.local (Frontend).",
        de: "Kopieren Sie .env.example nach .env (Backend) und .env.local (Frontend).",
      },
      {
        th: "กำหนดค่า Frontend: NEXT_PUBLIC_API_URL และ NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS",
        en: "Set Frontend configs: NEXT_PUBLIC_API_URL and NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS.",
        de: "Frontend-Werte setzen: NEXT_PUBLIC_API_URL und NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS.",
      },
      {
        th: "กำหนดค่า Backend: DATABASE_URL, JWT_SECRET (32+ bytes), และ Cloudflare R2 Storage",
        en: "Set Backend configs: DATABASE_URL, JWT_SECRET (32+ bytes), and Cloudflare R2 storage credentials.",
        de: "Backend-Werte setzen: DATABASE_URL, JWT_SECRET (32+ Bytes) und Cloudflare R2-Zugangsdaten.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "success",
        label: { th: "Production Ready", en: "Production Ready", de: "Produktionsbereit" },
        meaning: {
          th: "ค่าคอนฟิกถูกต้องครบถ้วน ใช้ HTTPS และเชื่อมต่อระบบคลาวด์ปลอดภัย",
          en: "All variables configured securely with HTTPS and valid cloud credentials.",
          de: "Alle Variablen sicher mit HTTPS und gültigen Cloud-Zugangsdaten konfiguriert.",
        },
      },
      {
        badgeVariant: "warning",
        label: { th: "Development", en: "Development", de: "Entwicklung" },
        meaning: {
          th: "ค่าคอนฟิกสำหรับเครื่องคอมพิวเตอร์นักพัฒนา (Localhost)",
          en: "Configuration parameters tuned for local development and testing.",
          de: "Konfigurationsparameter für die lokale Entwicklung und Tests.",
        },
      },
      {
        badgeVariant: "danger",
        label: { th: "Security Risk", en: "Security Risk", de: "Sicherheitsrisiko" },
        meaning: {
          th: "ความเสี่ยง: เผลอใส่ Secret ในตัวแปร NEXT_PUBLIC_* หรือ Commit ไฟล์ .env ขึ้น Git",
          en: "Critical risk: Secrets exposed in NEXT_PUBLIC_* or .env committed to Git.",
          de: "Kritisches Risiko: Secrets in NEXT_PUBLIC_* oder .env in Git eingecheckt.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "การตั้งค่าฝั่ง Frontend (frontend/.env.local)",
          en: "Frontend Environment Configuration (frontend/.env.local)",
          de: "Frontend-Umgebungskonfiguration (frontend/.env.local)",
        },
        description: {
          th: "สร้างไฟล์ frontend/.env.local จาก .env.example กำหนดค่า NEXT_PUBLIC_API_URL ชี้ไปยัง Backend (ใน Production ต้องเป็น HTTPS เสมอ) และ NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS สำหรับ Cloudflare R2 Domain",
          en: "Create frontend/.env.local from .env.example. Set NEXT_PUBLIC_API_URL (must be HTTPS in production) and NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS for Cloudflare R2.",
          de: "Erstellen Sie frontend/.env.local aus .env.example. Setzen Sie NEXT_PUBLIC_API_URL (HTTPS in Produktion) und NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS für Cloudflare R2.",
        },
        tip: {
          th: "กฎเหล็ก: ตัวแปรที่ขึ้นต้นด้วย NEXT_PUBLIC_* จะถูกฝังลงใน JavaScript bundle ของผู้เยี่ยมชม ห้ามใส่รหัสผ่านหรือ Private Key ใดๆ ในฟิลด์นี้เด็ดขาด",
          en: "Critical Rule: Variables prefixed with NEXT_PUBLIC_* are bundled into client-side JS. Never put passwords or private keys in these variables.",
          de: "Wichtige Regel: Variablen mit NEXT_PUBLIC_* sind im Client-JS sichtbar. Niemals Passwörter oder private Schlüssel hier eintragen.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "การตั้งค่าฝั่ง Backend (backend/.env)",
          en: "Backend Environment Configuration (backend/.env)",
          de: "Backend-Umgebungskonfiguration (backend/.env)",
        },
        description: {
          th: "กำหนดค่าการเชื่อมต่อฐานข้อมูล PostgreSQL (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME), ค่าความปลอดภัย JWT (JWT_SECRET สุ่ม 32 ตัวอักษรขึ้นไป), Cloudflare R2 Storage (R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET), และ SMTP Mail",
          en: "Configure PostgreSQL connection, JWT security parameters (random 32+ bytes string), Cloudflare R2 storage credentials, and SMTP email settings.",
          de: "Konfigurieren Sie PostgreSQL, JWT-Sicherheitsparameter (zufällige 32+ Zeichen), Cloudflare R2-Zugangsdaten und SMTP-E-Mail.",
        },
        image: "/images/guide/env-config.svg",
        imageCaption: {
          th: "โครงสร้างตัวแปรสภาพแวดล้อม Frontend vs Backend และกฎความปลอดภัย",
          en: "Frontend vs Backend environment variable architecture and security rules",
          de: "Architektur der Frontend- und Backend-Umgebungsvariablen und Sicherheitsregeln",
        },
        tip: {
          th: "สามารถสร้าง JWT Secret สุ่มที่มีความปลอดภัยสูงได้ด้วยคำสั่ง: openssl rand -base64 32",
          en: "Generate a cryptographically secure random JWT secret using: openssl rand -base64 32",
          de: "Erzeugen Sie ein kryptografisch sicheres JWT-Secret mit: openssl rand -base64 32",
        },
      },
      {
        stepNumber: 3,
        title: {
          th: "แนวปฏิบัติด้านความปลอดภัยและการ Deployment",
          en: "Security Best Practices & Deployment Rules",
          de: "Sicherheits-Best-Practices & Deployment-Regeln",
        },
        description: {
          th: "ตรวจสอบไฟล์ .gitignore ให้แน่ใจว่า .env, .env.local, .env.production ถูกละเว้นจากการ commit ในเซิร์ฟเวอร์จริง ให้กำหนดค่าผ่าน Secret Manager หรือ Environment Injection ของแพลตฟอร์มคลาวด์",
          en: "Ensure .env, .env.local, and .env.production are excluded in .gitignore. On production servers, inject variables via cloud secret managers.",
          de: "Stellen Sie sicher, dass .env-Dateien in .gitignore ignoriert werden. Auf Produktionsservern Variablen über Secret Manager einbinden.",
        },
        warning: {
          th: "ห้าม Commit ไฟล์ .env ที่มีรหัสผ่านจริงขึ้น Git repository โดยเด็ดขาด หากเผลอหลุดให้ทำการ Rotate Key และเปลี่ยนรหัสผ่านทันที",
          en: "Never commit .env files with real credentials to Git. If accidentally leaked, immediately rotate all affected keys and passwords.",
          de: "Checken Sie niemals .env-Dateien mit echten Zugangsdaten in Git ein. Bei versehentlichem Leak Zugangsdaten sofort erneuern.",
        },
      },
    ],
    faqs: [
      {
        question: {
          th: "ทำไมระบบถึงไม่อนุญาตให้ใช้ HTTP ใน Production สำหรับ NEXT_PUBLIC_API_URL?",
          en: "Why does the production build enforce HTTPS for NEXT_PUBLIC_API_URL?",
          de: "Warum erzwingt der Produktions-Build HTTPS für NEXT_PUBLIC_API_URL?",
        },
        answer: {
          th: "เพื่อป้องกันการดักจับข้อมูลและการโจมตีแบบ Man-in-the-Middle (MitM) โดยเฉพาะข้อมูลการเข้าสู่ระบบและข้อมูลส่วนบุคคลของญาติโยม",
          en: "To prevent data interception and Man-in-the-Middle (MitM) attacks on user credentials and personal data.",
          de: "Um Datenabfang und Man-in-the-Middle-Angriffe auf Anmeldedaten und personenbezogene Daten zu verhindern.",
        },
      },
      {
        question: {
          th: "ตัวแปร NEXT_PUBLIC_SKIP_ADMIN_AUTH มีไว้เพื่ออะไร?",
          en: "What is NEXT_PUBLIC_SKIP_ADMIN_AUTH used for?",
          de: "Wofür wird NEXT_PUBLIC_SKIP_ADMIN_AUTH verwendet?",
        },
        answer: {
          th: "มีไว้สำหรับการทดสอบ UI แอดมินในสภาพแวดล้อม Local แบบแยกส่วนเท่านั้น โดยระบบจะปิดกั้นไม่ให้เปิดใช้งานใน Production อย่างเด็ดขาด",
          en: "It is exclusively for isolated local UI testing and is strictly forbidden on production builds.",
          de: "Es dient ausschließlich lokalen UI-Tests und ist im Produktionsbetrieb strengstens untersagt.",
        },
      },
    ],
    relatedSlugs: ["settings", "audit-logs", "users"],
    updatedAt: "2026-08-19",
  },
];
