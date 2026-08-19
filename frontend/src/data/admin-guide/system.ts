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
    relatedSlugs: ["contact", "audit-logs"],
    updatedAt: "2026-08-19",
  },
];
