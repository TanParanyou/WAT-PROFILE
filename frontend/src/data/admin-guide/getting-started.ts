import type { GuideArticle } from "@/types/adminGuide";

export const gettingStartedGuides: GuideArticle[] = [
  {
    id: "guide-dashboard",
    slug: "dashboard",
    category: "getting-started",
    title: {
      th: "ภาพรวมแดชบอร์ดและการเริ่มต้นใช้งาน",
      en: "Dashboard Overview & Getting Started",
      de: "Dashboard-Übersicht & Erste Schritte",
    },
    summary: {
      th: "ทำความเข้าใจสถิติสำคัญ เมนูด่วน การเปลี่ยนภาษา และการตั้งค่าธีมในระบบแอดมิน",
      en: "Understand key metrics, quick actions, language switcher, and theme settings in the admin panel.",
      de: "Verstehen Sie wichtige Kennzahlen, Schnellaktionen, Sprachumschaltung und Designeinstellungen im Admin-Bereich.",
    },
    iconName: "LayoutDashboard",
    routePath: "/admin",
    quickSteps: [
      {
        th: "ตรวจสอบตัวเลขสรุปยอดบริจาค กิจกรรม และผู้ลงทะเบียนใหม่",
        en: "Review donation summaries, active events, and new member registrations.",
        de: "Überprüfen Sie Spendenzusammenfassungen, aktive Veranstaltungen und neue Registrierungen.",
      },
      {
        th: "ใช้แถบ Quick Actions เข้าถึงงานที่ต้องทำประจำวันได้ทันที",
        en: "Use Quick Actions to jump directly to daily operational tasks.",
        de: "Nutzen Sie Schnellaktionen, um direkt zu täglichen Aufgaben zu gelangen.",
      },
      {
        th: "สลับภาษา (TH/EN/DE) หรือเปลี่ยนธีม (Light/Dark) ได้ที่แถบ Header ด้านบน",
        en: "Switch locale (TH/EN/DE) or toggle theme (Light/Dark) via the top header.",
        de: "Wechseln Sie die Sprache (TH/EN/DE) oder das Design über die obere Kopfzeile.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "info",
        label: { th: "Real-time Metrics", en: "Real-time Metrics", de: "Echtzeit-Metriken" },
        meaning: {
          th: "สถิติแสดงข้อมูลปัจจุบัน อัปเดตอัตโนมัติเมื่อมีการบันทึกข้อมูลใหม่",
          en: "Metrics display current records and update automatically on new submissions.",
          de: "Die Metriken zeigen aktuelle Datensätze an und werden bei neuen Einträgen aktualisiert.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "เข้าสู่ระบบและสำรวจแดชบอร์ด",
          en: "Sign in and explore the dashboard",
          de: "Anmelden und Dashboard erkunden",
        },
        description: {
          th: "เมื่อเข้าสู่ระบบ Admin หน้าแรกจะแสดงภาพรวมของวัด สถิติผู้ใช้งาน ยอดบริจาคประจำเดือน และจำนวนกิจกรรมที่กำลังจัดขึ้น",
          en: "Upon signing in, the home dashboard displays key temple metrics, monthly donation totals, and ongoing events.",
          de: "Nach der Anmeldung zeigt das Dashboard Tempelkennzahlen, monatliche Spenden und laufende Veranstaltungen.",
        },
        tip: {
          th: "สามารถคลิกที่การ์ดสถิติเพื่อเปิดหน้ารายการของแต่ละโมดูลได้โดยตรง",
          en: "Click on any metric card to navigate directly to its corresponding list view.",
          de: "Klicken Sie auf eine Metrikkarte, um direkt zur entsprechenden Listenansicht zu gelangen.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "การปรับแต่งการแสดงผลและภาษา",
          en: "Customizing display theme and language",
          de: "Anpassen von Design und Sprache",
        },
        description: {
          th: "คลิกปุ่มลูกโลกที่ Header เพื่อเปลี่ยนภาษาของระบบ (ไทย, English, Deutsch) และคลิกไอคอนดวงอาทิตย์/พระจันทร์เพื่อสลับโหมดมืด-สว่าง",
          en: "Click the globe icon in the header to switch languages (TH/EN/DE) and use the sun/moon icon to toggle dark mode.",
          de: "Klicken Sie auf das Globussymbol, um Sprachen zu wechseln (TH/EN/DE), und das Sonnen-/Mondsymbol für den Dunkelmodus.",
        },
      },
      {
        stepNumber: 3,
        title: {
          th: "การค้นหาคู่มือและการช่วยเหลือ",
          en: "Searching user guides and contextual help",
          de: "Suche in Anleitungen und kontextbezogene Hilfe",
        },
        description: {
          th: "กดปุ่ม (?) ที่ Header หรือกดคีย์ลัด Ctrl+K / ⌘+K เพื่อเปิดหน้าต่างค้นหาคู่มือและขั้นตอนการทำงานได้อย่างรวดเร็ว",
          en: "Click the (?) button in the header or press Ctrl+K / ⌘+K to quickly search operational guides and help topics.",
          de: "Klicken Sie auf (?) oder drücken Sie Strg+K / ⌘+K, um Anleitungen und Hilfethemen schnell zu durchsuchen.",
        },
      },
    ],
    faqs: [
      {
        question: {
          th: "หากตัวเลขสถิติไม่ตรงกับความเป็นจริง ต้องทำอย่างไร?",
          en: "What should I do if dashboard metrics look outdated?",
          de: "Was tun, wenn Dashboard-Zahlen veraltet wirken?",
        },
        answer: {
          th: "สามารถกดรีเฟรชหน้าเบราว์เซอร์ หรือเข้าไปตรวจสอบสถานะรายการในแต่ละโมดูล (เช่น หน้ารายการบริจาค หรือผู้ลงทะเบียน)",
          en: "Refresh your browser page or check the specific module tables directly to verify record statuses.",
          de: "Aktualisieren Sie die Browserseite oder prüfen Sie die jeweiligen Modultabellen direkt.",
        },
      },
    ],
    relatedSlugs: ["profile", "events", "donations"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-profile",
    slug: "profile",
    category: "getting-started",
    title: {
      th: "การจัดการโปรไฟล์และความปลอดภัยบัญชี",
      en: "Profile & Account Security Management",
      de: "Profil- und Kontosicherheitsverwaltung",
    },
    summary: {
      th: "วิธีแก้ไขข้อมูลส่วนตัว เปลี่ยนรหัสผ่าน อัปเดตรูปภาพประจำตัว และตรวจสอบความปลอดภัย",
      en: "How to edit profile details, change passwords, update avatars, and review active sessions.",
      de: "So bearbeiten Sie Profildetails, ändern Passwörter, aktualisieren Avatare und prüfen aktive Sitzungen.",
    },
    iconName: "User",
    routePath: "/admin/profile",
    quickSteps: [
      {
        th: "เข้าหน้า /admin/profile จากเมนูโปรไฟล์มุมบนขวา",
        en: "Navigate to /admin/profile via the top-right user menu.",
        de: "Navigieren Sie über das Benutzermenü oben rechts zu /admin/profile.",
      },
      {
        th: "แก้ไขชื่อ นามสกุล และอัปโหลดรูปภาพโปรไฟล์",
        en: "Update name, contact info, and upload avatar.",
        de: "Aktualisieren Sie Name, Kontaktdaten und laden Sie ein Profilbild hoch.",
      },
      {
        th: "เปลี่ยนรหัสผ่านใหม่โดยระบุรหัสผ่านเดิมและยืนยันรหัสผ่านใหม่",
        en: "Change password by providing current password and confirming new one.",
        de: "Passwort ändern, indem das aktuelle und das neue Passwort eingegeben werden.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "เข้าสู่หน้าจัดการโปรไฟล์",
          en: "Open profile settings",
          de: "Profileinstellungen öffnen",
        },
        description: {
          th: "คลิกที่ชื่อหรือรูปโปรไฟล์ของคุณที่มุมบนขวาของหน้าจอ แล้วเลือก 'โปรไฟล์'",
          en: "Click your profile name or avatar at the top right of the screen and select 'Profile'.",
          de: "Klicken Sie oben rechts auf Ihren Namen oder Avatar und wählen Sie 'Profil'.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "แก้ไขข้อมูลส่วนตัว",
          en: "Update personal information",
          de: "Persönliche Daten aktualisieren",
        },
        description: {
          th: "กรอกข้อมูลชื่อ เบอร์โทร และอัปโหลดรูปภาพประจำตัว จากนั้นกด 'บันทึกการเปลี่ยนแปลง'",
          en: "Fill in your display name, phone number, and avatar image, then click 'Save Changes'.",
          de: "Geben Sie Namen, Telefonnummer und Profilbild ein und klicken Sie auf 'Änderungen speichern'.",
        },
        tip: {
          th: "รูปโปรไฟล์ควรอัปโหลดเป็นไฟล์สี่เหลี่ยมจัตุรัส (1:1) เช่น 500x500 พิกเซล",
          en: "Use a square (1:1) image aspect ratio (e.g. 500x500px) for best appearance.",
          de: "Verwenden Sie ein quadratisches Bild (1:1, z.B. 500x500px) für die beste Darstellung.",
        },
      },
      {
        stepNumber: 3,
        title: {
          th: "เปลี่ยนรหัสผ่านเพื่อความปลอดภัย",
          en: "Change password securely",
          de: "Passwort sicher ändern",
        },
        description: {
          th: "ในส่วน 'เปลี่ยนรหัสผ่าน' ให้กรอกรหัสผ่านปัจจุบัน ตามด้วยรหัสผ่านใหม่อย่างน้อย 12 ตัวอักษรที่มีตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และสัญลักษณ์",
          en: "In the password section, enter your current password followed by a strong new password (minimum 12 chars with mixed case, numbers, and symbols).",
          de: "Geben Sie Ihr aktuelles Passwort und ein sicheres neues Passwort (mind. 12 Zeichen mit Groß-/Kleinbuchstaben, Zahlen und Symbolen) ein.",
        },
        warning: {
          th: "ห้ามบอกรหัสผ่านแก่ผู้อื่น ระบบแอดมินจะไม่ถามรหัสผ่านของคุณผ่านช่องทางใดๆ",
          en: "Never share your password. Administrators will never ask for your credentials.",
          de: "Teilen Sie Ihr Passwort niemals mit anderen Personen.",
        },
      },
    ],
    faqs: [
      {
        question: {
          th: "หากลืมรหัสผ่านเดิม ต้องทำอย่างไร?",
          en: "What if I forgot my current password?",
          de: "Was tun, wenn das aktuelle Passwort vergessen wurde?",
        },
        answer: {
          th: "ติดต่อ Super Administrator ของวัดเพื่อขอให้ทำการรีเซ็ตรหัสผ่านในเมนู 'ผู้ดูแลระบบ' (/admin/users)",
          en: "Contact your temple's Super Administrator to initiate a password reset in /admin/users.",
          de: "Wenden Sie sich an den Super-Administrator, um das Passwort in /admin/users zurückzusetzen.",
        },
      },
    ],
    relatedSlugs: ["dashboard", "users", "accounts"],
    updatedAt: "2026-08-19",
  },
];
