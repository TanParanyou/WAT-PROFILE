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
      th: "บทบาทและสิทธิ์การใช้งาน (Roles & Pure Flag RBAC Architecture)",
      en: "Roles & Pure Flag RBAC Permissions Architecture",
      de: "Rollen & Pure-Flag-RBAC-Berechtigungsarchitektur",
    },
    summary: {
      th: "การกำหนดสิทธิ์แบบ Pure Flag (is_system & admin_access), สิทธิ์ Super Admin อัตโนมัติ, การคุ้มครอง System Role และระบบป้องกัน Super Admin คนสุดท้าย (Lockout Protection)",
      en: "Pure Flag RBAC architecture (is_system & admin_access), automatic Super Admin bypass, System Role immutability, and Last Active Super Admin lockout protection.",
      de: "Pure-Flag-RBAC-Architektur (is_system & admin_access), automatischer Super-Admin-Bypass, System-Rollen-Schutz und Lockout-Schutz für den letzten Super-Admin.",
    },
    iconName: "Shield",
    resource: "users",
    routePath: "/admin/roles",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/roles เพื่อดูตารางบทบาททั้งหมด สังเกต Badge [System] บนบทบาทของระบบ",
        en: "Navigate to /admin/roles and look for the [System] badge on protected system roles.",
        de: "Zu /admin/roles gehen und auf das [System]-Badge für geschützte Systemrollen achten.",
      },
      {
        th: "กด '+ สร้างบทบาท' สำหรับ Custom Role หรือแก้ไขสิทธิ์ในบทบาทที่เปิดให้ปรับแต่ง",
        en: "Click '+ Create Role' for custom roles or edit configurable permissions.",
        de: "Auf '+ Rolle erstellen' klicken für eigene Rollen oder Berechtigungen anpassen.",
      },
      {
        th: "กำหนดสิทธิ์ Resource + Action โดย Super Admin และ Global Wildcard (*: all) จะมีสิทธิ์ทุกโมดูลอัตโนมัติ",
        en: "Configure resource actions; Super Admin and Global Wildcard (*: all) inherit all permissions automatically.",
        de: "Ressourcenrechte festlegen; Super-Admin und Wildcard (*: all) erhalten automatisch alle Rechte.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "info",
        label: { th: "System Role", en: "System Role", de: "System-Rolle" },
        meaning: {
          th: "บทบาทของระบบ (is_system: true) ถูกล็อกห้ามลบ ห้ามเปลี่ยนชื่อ และห้ามปิดการใช้งาน",
          en: "Protected system role (is_system: true); immutable against deletion, renaming, or deactivation.",
          de: "Geschützte Systemrolle (is_system: true); geschützt vor Löschung, Umbenennung oder Deaktivierung.",
        },
      },
      {
        badgeVariant: "success",
        label: { th: "Super Admin", en: "Super Admin", de: "Super-Admin" },
        meaning: {
          th: "ผู้ดูแลระบบสูงสุด (is_system: true && admin_access: true) ได้รับสิทธิ์ทุกโมดูลอัตโนมัติ 100%",
          en: "Chief administrator (is_system: true && admin_access: true); granted all module permissions automatically.",
          de: "Hauptadministrator (is_system: true && admin_access: true); erhält automatisch alle Modulrechte.",
        },
      },
      {
        badgeVariant: "default",
        label: { th: "Custom Role", en: "Custom Role", de: "Benutzerdefinierte Rolle" },
        meaning: {
          th: "บทบาทที่สร้างขึ้นเอง สามารถปรับแต่งสิทธิ์ สร้าง แก้ไข หรือลบได้ตามต้องการ",
          en: "Custom user-created role; fully configurable, editable, and deletable.",
          de: "Benutzerdefinierte Rolle; voll konfigurierbar, bearbeitbar und löschbar.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "โครงสร้าง Pure Flag Architecture & System Role Immutability",
          en: "Pure Flag Architecture & System Role Immutability",
          de: "Pure-Flag-Architektur & Unveränderlichkeit von Systemrollen",
        },
        description: {
          th: "ระบบเปลี่ยนจากการเช็คชื่อ String มาใช้ Flag is_system และ admin_access ใน Database โดย System Role จะมี Badge [System] กำกับ และถูกล็อกในระดับ API ห้ามลบ ห้ามเปลี่ยนชื่อ หรือปิดสถานะ Active",
          en: "The system relies on is_system and admin_access database flags rather than hardcoded string names. System roles display a [System] badge and are guarded at the API layer against deletion or renaming.",
          de: "Das System nutzt is_system und admin_access Flags anstelle von String-Vergleichen. Systemrollen tragen das [System]-Badge und sind auf API-Ebene vor Löschung geschützt.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "กำหนดสิทธิ์ตามหลัก Least Privilege & Global Wildcard",
          en: "Least Privilege Principle & Global Wildcard",
          de: "Prinzip der geringsten Rechte & Globaler Wildcard-Zugriff",
        },
        description: {
          th: "เลือกเปิดเฉพาะสิทธิ์ที่เจ้าหน้าที่ตำแหน่งนั้นต้องใช้งานจริง สำหรับ Super Admin (is_system = true && admin_access = true) หรือบทบาทที่มี Global Wildcard (*: all) ระบบจะมอบสิทธิ์ในทุกโมดูลอัตโนมัติ แม้จะมีโมดูลใหม่เพิ่มเข้ามาในอนาคต",
          en: "Grant only essential permissions. Super Admin accounts and roles with Global Wildcard (*: all) automatically inherit access to all current and future modules.",
          de: "Vergeben Sie nur notwendige Rechte. Super-Admins und Rollen mit Wildcard (*: all) erhalten automatisch Vollzugriff auf alle aktuellen und zukünftigen Module.",
        },
        image: "/images/guide/rbac-matrix.svg",
        imageCaption: {
          th: "ตัวอย่างตารางการกำหนดสิทธิ์แบบละเอียด (RBAC Granular Permissions Matrix)",
          en: "Role-Based Access Control granular permissions matrix preview",
          de: "Rollenbasierte granulare Berechtigungsmatrix",
        },
      },
      {
        stepNumber: 3,
        title: {
          th: "ระบบป้องกัน Super Admin คนสุดท้าย (Last Active Super Admin Lockout Protection)",
          en: "Last Active Super Admin Lockout Protection",
          de: "Schutz des letzten aktiven Super-Admins (Lockout-Schutz)",
        },
        description: {
          th: "เพื่อป้องกันไม่ให้ระบบล็อกตัวเอง (System Lockout) หากในระบบเหลือ Super Admin ที่ Active อยู่เพียง 1 บัญชีสุดท้าย ระบบจะปฏิเสธการลบ, การปิดการใช้งาน หรือการเปลี่ยนบทบาทของบัญชีนั้นโดยอัตโนมัติ",
          en: "To prevent system lockout, if only 1 active Super Admin remains, the system strictly blocks deletion, deactivation, or role demotion of that final account.",
          de: "Um System-Aussperrungen zu verhindern, blockiert das System automatisch das Löschen, Deaktivieren oder Herabstufen des letzten verbleibenden aktiven Super-Admins.",
        },
        tip: {
          th: "หากต้องการเปลี่ยนบทบาทของ Super Admin คนเดิม ให้สร้างหรือตั้งค่า Super Admin บัญชีใหม่ให้เรียบร้อยก่อน",
          en: "To reassign roles for the current Super Admin, ensure another active Super Admin account is provisioned first.",
          de: "Um die Rolle des aktuellen Super-Admins zu ändern, erstellen Sie zuerst ein weiteres aktives Super-Admin-Konto.",
        },
      },
    ],
    faqs: [
      {
        question: {
          th: "ทำไมปุ่มลบ (Delete) ถึงเป็นสีเทาหรือไม่สามารถกดได้ในบางบทบาท?",
          en: "Why is the Delete button disabled on certain roles?",
          de: "Warum ist die Schaltfläche 'Löschen' bei manchen Rollen deaktiviert?",
        },
        answer: {
          th: "เพราะบทบาทนั้นเป็น System Role (is_system: true) ซึ่งเป็นรากฐานความปลอดภัยของระบบ จึงไม่อนุญาตให้ลบได้",
          en: "Because the role is a protected System Role (is_system: true) essential for system operation.",
          de: "Weil es sich um eine geschützte Systemrolle (is_system: true) handelt, die für die Systemsicherheit unverzichtbar ist.",
        },
      },
    ],
    relatedSlugs: ["users", "audit-logs", "environment-config"],
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
          th: "สร้างไฟล์ frontend/.env.local จาก .env.example กำหนดค่า NEXT_PUBLIC_API_URL ชี้ไปยัง Backend (ใน Production ต้องเป็น HTTPS เสมอ), NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS สำหรับ Cloudflare R2 Domain, และ NEXT_PUBLIC_CHATBOT_ENABLED สำหรับเปิด/ปิด Floating Widget แชทบอทบนหน้าเว็บ",
          en: "Create frontend/.env.local from .env.example. Set NEXT_PUBLIC_API_URL (must be HTTPS in production), NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS for Cloudflare R2, and NEXT_PUBLIC_CHATBOT_ENABLED for the visitor chat widget.",
          de: "Erstellen Sie frontend/.env.local aus .env.example. Setzen Sie NEXT_PUBLIC_API_URL (HTTPS in Produktion), NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS für Cloudflare R2 und NEXT_PUBLIC_CHATBOT_ENABLED für das Chat-Widget.",
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
          th: "กำหนดค่าการเชื่อมต่อฐานข้อมูล PostgreSQL (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME), ค่าความปลอดภัย JWT (JWT_SECRET สุ่ม 32 ตัวอักษรขึ้นไป), Cloudflare R2 Storage (R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET), SMTP Mail, และ GEMINI_API_KEY สำหรับระบบ AI Translation และ Chatbot Assistant",
          en: "Configure PostgreSQL connection, JWT security parameters (random 32+ bytes string), Cloudflare R2 storage credentials, SMTP email settings, and GEMINI_API_KEY for AI translation and chatbot assistant.",
          de: "Konfigurieren Sie PostgreSQL, JWT-Sicherheitsparameter (zufällige 32+ Zeichen), Cloudflare R2-Zugangsdaten, SMTP-E-Mail und GEMINI_API_KEY für KI-Übersetzung und Chatbot-Assistenten.",
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
          th: "การเข้าสู่ระบบ Admin Panel มีระบบป้องกันความปลอดภัยอย่างไร?",
          en: "How is Admin Panel authentication secured?",
          de: "Wie ist die Admin-Panel-Authentifizierung gesichert?",
        },
        answer: {
          th: "ระบบบังคับยืนยันตัวตนผ่าน JWT + HttpOnly Cookie แบบ 100% ในทุกสภาพแวดล้อม โดยไม่มีช่องทางข้าม (Bypass) เพื่อความปลอดภัยสูงสุดของข้อมูลภายในวัด",
          en: "The system strictly enforces JWT + HttpOnly cookie authentication in all environments without any bypass mechanisms for maximum security.",
          de: "Das System erzwingt die Authentifizierung über JWT + HttpOnly-Cookies in allen Umgebungen für maximale Sicherheit.",
        },
      },
    ],
    relatedSlugs: ["settings", "audit-logs", "users"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-analytics",
    slug: "analytics",
    category: "system",
    title: {
      th: "สถิติและการใช้งานเว็บไซต์ (Web Analytics & Insights)",
      en: "Web Traffic Analytics & Insights",
      de: "Web-Analytics & Besucherstatistiken",
    },
    summary: {
      th: "การดูสถิติผู้เข้าชมเว็บไซต์ ยอดวิวหน้าเว็บ สัดส่วนอุปกรณ์ (Desktop vs Mobile vs Tablet) และหน้ายอดนิยม (กิจกรรม, บทสวดมนต์, ข่าวสาร)",
      en: "Viewing total pageviews, unique visitors, device breakdown (Desktop/Mobile/Tablet), and top content trends.",
      de: "Übersicht über Seitenaufrufe, Besucher, Geräteverteilung (Desktop/Mobil/Tablet) und beliebte Inhalte.",
    },
    iconName: "BarChart3",
    resource: "analytics",
    routePath: "/admin/analytics",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/analytics เพื่อดูแดชบอร์ดสถิติรวม",
        en: "Navigate to /admin/analytics to open the insights dashboard.",
        de: "Zu /admin/analytics gehen für das Statistik-Dashboard.",
      },
      {
        th: "เลือกช่วงเวลาที่ต้องการดู (7 วัน, 30 วัน, หรือ 1 ปี)",
        en: "Select time range filter (7 days, 30 days, or 1 year).",
        de: "Zeitraum auswählen (7 Tage, 30 Tage oder 1 Jahr).",
      },
      {
        th: "สลับแท็บเพื่อดูสถิติแยกตามหมวดหมู่ เช่น กิจกรรม บทสวดมนต์ พระสงฆ์",
        en: "Switch resource tabs to inspect Events, Chanting, or Monk views.",
        de: "Reiter wechseln für Statistiken zu Events, Gesängen oder Mönchen.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "success",
        label: { th: "Real-time Metrics", en: "Real-time Metrics", de: "Echtzeit-Metriken" },
        meaning: {
          th: "สถิติผู้เข้าชมอัปเดตต่อเนื่องแบบ Real-time",
          en: "Visitor statistics updated continuously in real time.",
          de: "Besucherstatistiken werden in Echtzeit aktualisiert.",
        },
      },
      {
        badgeVariant: "info",
        label: { th: "Privacy-first", en: "Privacy-first", de: "Datenschutzkonform" },
        meaning: {
          th: "การเก็บสถิติไม่ใช้ Third-party Cookie และไม่เก็บข้อมูลระบุตัวตนส่วนบุคคล (GDPR compliant)",
          en: "Cookie-less and GDPR compliant analytics with zero personally identifiable data.",
          de: "Cookielose und DSGVO-konforme Analyse ohne Erfassung persönlicher Daten.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "การดูภาพรวมสถิติผู้เข้าชม (Total Pageviews & Visitors)",
          en: "Overview Metrics & Trends",
          de: "Gesamtübersicht & Besuchertrends",
        },
        description: {
          th: "ตรวจสอบการ์ดสถิติสรุป: ยอดเปิดดูหน้ารวม (Pageviews), จำนวนผู้เข้าชมที่ไม่ซ้ำ (Unique Visitors), และแนวโน้มการเติบโตเปรียบเทียบกับช่วงเวลาก่อนหน้า",
          en: "Review high-level KPI cards: Total Pageviews, Unique Visitors, and growth trends compared to the previous period.",
          de: "Überprüfen Sie Kennzahlen: Gesamtaufrufe, eindeutige Besucher und Trendvergleiche.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "การวิเคราะห์อุปกรณ์ผู้ใช้งาน (Device Breakdown)",
          en: "Analyze Device Distribution",
          de: "Geräteverteilung analysieren",
        },
        description: {
          th: "ดูกราฟวงกลมแสดงสัดส่วนผู้ใช้สมาร์ทโฟน (Mobile), คอมพิวเตอร์ (Desktop), และแท็บเล็ต (Tablet) เพื่อช่วยในการออกแบบเนื้อหาให้เหมาะสมกับอุปกรณ์ที่ญาติโยมใช้งานจริง",
          en: "Inspect the donut chart showing smartphone, desktop, and tablet distribution to tailor layout and media sizes effectively.",
          de: "Prüfen Sie das Kreisdiagramm zur mobilen und Desktop-Nutzung zur optimalen Gestaltung von Inhalten.",
        },
      },
      {
        stepNumber: 3,
        title: {
          th: "การจัดอันดับเนื้อหายอดนิยม (Top Content)",
          en: "Top Visited Pages & Resources",
          de: "Beliebteste Seiten & Inhalte",
        },
        description: {
          th: "ตรวจสอบตาราง 10 อันดับแรกของหน้าเว็บ กิจกรรม บทสวดมนต์ หรือข่าวสารที่มีผู้สนใจเข้าอ่านมากที่สุด ช่วยให้วัดจัดเตรียมข้อมูลและกิจกรรมได้อย่างตรงจุด",
          en: "Explore the Top 10 list of most engaged events, chanting verses, and news announcements to plan future temple activities.",
          de: "Erkennen Sie die 10 beliebtesten Veranstaltungen und Gesänge für eine gezielte Planung.",
        },
      },
    ],
    faqs: [
      {
        question: {
          th: "ระบบ Analytics มีการส่งข้อมูลให้ Google หรือภายนอกหรือไม่?",
          en: "Does the analytics engine share data with external third parties?",
          de: "Werden Analysedaten an Dritte oder Google weitergegeben?",
        },
        answer: {
          th: "ไม่เลย ระบบ Analytics นี้ทำงานอยู่บนเซิร์ฟเวอร์ของวัดเอง 100% จึงปลอดภัย เป็นส่วนตัว และสอดคล้องตามมาตรฐาน GDPR สหภาพยุโรปอย่างเคร่งครัด",
          en: "No, all analytics processing runs 100% on self-hosted temple infrastructure, ensuring complete GDPR privacy.",
          de: "Nein, die Analyse läuft vollständig auf eigener Infrastruktur nach strengen DSGVO-Richtlinien.",
        },
      },
    ],
    relatedSlugs: ["dashboard", "events", "news"],
    updatedAt: "2026-08-30",
  },
  {
    id: "guide-backup",
    slug: "backup",
    category: "system",
    title: {
      th: "การสำรองและกู้คืนฐานข้อมูล (Backup & Disaster Recovery)",
      en: "Database Backup & Disaster Recovery",
      de: "Datenbank-Backup & Systemwiederherstellung",
    },
    summary: {
      th: "ขั้นตอนการสร้าง Database Snapshot สำรองข้อมูลคำสอน บทสวด สมาชิก และประวัติการทำบุญ พร้อมแนวทางกู้คืนระบบเมื่อเกิดเหตุฉุกเฉิน",
      en: "Creating PostgreSQL database snapshots, downloading encrypted archives, and disaster recovery procedures.",
      de: "Erstellung von PostgreSQL-Datenbank-Snapshots, Archiv-Downloads und Notfall-Wiederherstellung.",
    },
    iconName: "Database",
    resource: "settings",
    superAdminOnly: true,
    routePath: "/admin/settings",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/settings ไปที่หัวข้อ 'การสำรองข้อมูล' (Database Backup)",
        en: "Navigate to /admin/settings > Database Backup section.",
        de: "Zu /admin/settings > Bereich Datenbank-Backup gehen.",
      },
      {
        th: "กดปุ่ม 'สร้าง Snapshot สำรองข้อมูลทันที'",
        en: "Click 'Create Database Snapshot Now'.",
        de: "Auf 'Jetzt Datenbank-Snapshot erstellen' klicken.",
      },
      {
        th: "ดาวน์โหลดไฟล์ .sql.gz สำรองเก็บไว้ในพื้นที่ปลอดภัยภายนอก",
        en: "Download the encrypted .sql.gz archive to secure external storage.",
        de: "Laden Sie das .sql.gz Archiv auf einen sicheren externen Speicher herunter.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "success",
        label: { th: "Backup Complete", en: "Backup Complete", de: "Backup abgeschlossen" },
        meaning: {
          th: "การสำรองข้อมูลสำเร็จ ไฟล์ Snapshot พร้อมดาวน์โหลด",
          en: "Snapshot created successfully and verified.",
          de: "Snapshot erfolgreich erstellt und verifiziert.",
        },
      },
      {
        badgeVariant: "danger",
        label: { th: "Super Admin Only", en: "Super Admin Only", de: "Nur Super-Admin" },
        meaning: {
          th: "การสำรองและกู้คืนฐานข้อมูลสงวนสิทธิ์เฉพาะผู้ดูแลระบบสูงสุดเท่านั้น",
          en: "Access to raw database backups is restricted exclusively to Super Administrators.",
          de: "Zugriff auf Datenbank-Backups ist ausschließlich Super-Administratoren vorbehalten.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "การสร้างไฟล์สำรองฐานข้อมูลแบบ On-demand",
          en: "Create On-demand Database Snapshot",
          de: "Datenbank-Snapshot manuell erstellen",
        },
        description: {
          th: "กดปุ่ม 'สร้างสำรองข้อมูล' ระบบจะเรียกคำสั่ง pg_dump เพื่อสำรองตารางข้อมูลทั้งหมดในฐานข้อมูล PostgreSQL รวมถึงบทสวดมนต์ บัญชีสมาชิก สถิติ และการตั้งค่าระบบ",
          en: "Trigger an on-demand snapshot. The system runs pg_dump across all PostgreSQL tables including members, chanting texts, donations, and RBAC configs.",
          de: "Erstellen Sie ein Backup aller PostgreSQL-Tabellen inklusive Mitglieder, Gesänge, Spenden und Rollen.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "การดาวน์โหลดและจัดเก็บตามหลักความปลอดภัย (3-2-1 Backup Rule)",
          en: "Secure Off-site Archiving (3-2-1 Rule)",
          de: "Sichere externe Archivierung (3-2-1-Regel)",
        },
        description: {
          th: "ดาวน์โหลดไฟล์สำรองที่บีบอัด (.sql.gz) ไปเก็บไว้ในพื้นที่จัดเก็บปลอดภัยภายนอก เช่น ฮาร์ดดิสก์เข้ารหัสของวัด หรือ Cloud Storage ที่มีการเข้ารหัสลับ",
          en: "Download compressed .sql.gz archive and store off-site on encrypted temple drives following the 3-2-1 backup strategy.",
          de: "Speichern Sie das komprimierte Archiv auf verschlüsselten externen Medien nach der 3-2-1-Backup-Strategie.",
        },
        warning: {
          th: "ไฟล์สำรองฐานข้อมูลมีข้อมูลส่วนบุคคลของญาติโยม ห้ามส่งต่อผ่านแชทสาธารณะหรืออีเมลที่ไม่เข้ารหัสเด็ดขาด",
          en: "Database backups contain sensitive personal data. Never share via unencrypted channels.",
          de: "Backups enthalten personenbezogene Daten. Niemals über unverschlüsselte Kanäle weitergeben.",
        },
      },
      {
        stepNumber: 3,
        title: {
          th: "ขั้นตอนการกู้คืนระบบเมื่อเกิดเหตุฉุกเฉิน (Disaster Recovery)",
          en: "Disaster Recovery Restoration",
          de: "Wiederherstellung im Notfall",
        },
        description: {
          th: "ในกรณีที่เซิร์ฟเวอร์เสียหาย สามารถใช้คำสั่ง pg_restore เพื่อนำเข้าไฟล์สำรองล่าสุดกลับคืนสู่ฐานข้อมูลใหม่ได้ในเวลาไม่กี่นาที ตามคู่มือ docs/PRODUCTION_RUNBOOK.md",
          en: "In case of server failure, restore the latest backup using pg_restore within minutes following docs/PRODUCTION_RUNBOOK.md.",
          de: "Im Notfall kann das System über pg_restore gemäß docs/PRODUCTION_RUNBOOK.md innerhalb weniger Minuten wiederhergestellt werden.",
        },
      },
    ],
    faqs: [
      {
        question: {
          th: "ระบบมีการสำรองข้อมูลอัตโนมัติประจำวันหรือไม่?",
          en: "Is there an automated daily backup schedule?",
          de: "Gibt es ein automatisiertes tägliches Backup?",
        },
        answer: {
          th: "มี ระบบคลาวด์และเซิร์ฟเวอร์หลักมี Cronjob สำรองข้อมูลอัตโนมัติทุกเที่ยงคืน (00:00 UTC) ควบคู่กับการกดสำรองข้อมูลแบบ Manual ผ่านหน้านี้",
          en: "Yes, the production server runs an automated nightly cronjob snapshot alongside manual on-demand triggers.",
          de: "Ja, der Produktionsserver führt jede Nacht um 00:00 Uhr automatische Backups durch.",
        },
      },
    ],
    relatedSlugs: ["settings", "environment-config", "audit-logs"],
    updatedAt: "2026-08-30",
  },
];
