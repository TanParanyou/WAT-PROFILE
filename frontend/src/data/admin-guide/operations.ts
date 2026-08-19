import type { GuideArticle } from "@/types/adminGuide";

export const operationsGuides: GuideArticle[] = [
  {
    id: "guide-community",
    slug: "community",
    category: "operations",
    title: {
      th: "การดูแลชุมชนและกระดานสนทนา (Community Moderation)",
      en: "Community Board & Question Moderation",
      de: "Community-Forum & Moderation",
    },
    summary: {
      th: "วิธีตรวจสอบกระทู้คำถามธรรมะ ตอบกลับประชาชน ปักหมุด และซ่อนโพสต์ที่ไม่เหมาะสม",
      en: "Moderating community questions, answering Dharma inquiries, pinning posts, and hiding spam.",
      de: "Moderation von Fragen, Beantwortung von Dharma-Anfragen und Verbergen unangemessener Beiträge.",
    },
    iconName: "MessageCircleQuestion",
    resource: "community",
    routePath: "/admin/community",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/community เพื่อดูกระทู้ทั้งหมด",
        en: "Navigate to /admin/community to view all public threads.",
        de: "Zu /admin/community gehen, um alle öffentlichen Beiträge zu sehen.",
      },
      {
        th: "กรองกระทู้ที่ 'รอการตอบกลับ' หรือ 'รอการตรวจสอบ'",
        en: "Filter threads by 'Pending Response' or 'Pending Review'.",
        de: "Beiträge nach 'Ausstehende Antwort' oder 'Überprüfung' filtern.",
      },
      {
        th: "พิมพ์ข้อความตอบกลับในนามเจ้าหน้าที่วัด หรือกดซ่อนโพสต์หากละเมิดกฎ",
        en: "Post response as temple staff, or hide rule-violating posts.",
        de: "Als Tempel antworten oder regelwidrige Beiträge verbergen.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "warning",
        label: { th: "Pending Answer", en: "Pending Answer", de: "Unbeantwortet" },
        meaning: {
          th: "กระทู้ใหม่ที่ยังไม่มีเจ้าหน้าที่เข้ามาตอบคำถาม",
          en: "New public inquiry awaiting staff reply.",
          de: "Neue Anfrage, die noch auf eine Antwort wartet.",
        },
      },
      {
        badgeVariant: "success",
        label: { th: "Answered", en: "Answered", de: "Beantwortet" },
        meaning: {
          th: "ได้รับการตอบคำถามโดยพระสงฆ์หรือเจ้าหน้าที่วัดเรียบร้อยแล้ว",
          en: "Successfully answered by monks or authorized staff.",
          de: "Erfolgreich von Mönchen oder Mitarbeitern beantwortet.",
        },
      },
      {
        badgeVariant: "danger",
        label: { th: "Hidden / Spam", en: "Hidden / Spam", de: "Ausgeblendet / Spam" },
        meaning: {
          th: "โพสต์ถูกซ่อนจากสาธารณะเนื่องจากละเมิดกฎหรือเป็นสแปม",
          en: "Hidden from public view due to violation or spam.",
          de: "Aufgrund von Richtlinienverstößen öffentlich ausgeblendet.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "ตรวจสอบกระทู้คำถามใหม่",
          en: "Review new inquiries",
          de: "Neue Anfragen prüfen",
        },
        description: {
          th: "คลิกเข้าไปในกระทู้เพื่ออ่านข้อความ คำถามธรรมะ หรือข้อสงสัยในการร่วมงานบุญของญาติโยม",
          en: "Click on a thread to read questions or inquiries regarding ceremonies and Dharma practice.",
          de: "Klicken Sie auf einen Beitrag, um Fragen zu Zeremonien und Dharma-Praxis zu lesen.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "พิมพ์คำตอบและเผยแพร่",
          en: "Write and publish response",
          de: "Antwort verfassen und veröffentlichen",
        },
        description: {
          th: "พิมพ์คำตอบในช่องข้อความตอบกลับ แล้วกด 'ส่งคำตอบ' ข้อความจะขึ้นป้ายสัญลักษณ์ 'คำตอบจากวัด' (Official Reply)",
          en: "Compose your reply and click 'Post Reply'. It will be displayed with an official temple badge.",
          de: "Verfassen Sie Ihre Antwort; diese wird mit einem offiziellen Tempelabzeichen versehen.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["events", "contacts"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-events",
    slug: "events",
    category: "operations",
    title: {
      th: "การจัดการกิจกรรมและงานบุญ (Events Management)",
      en: "Event Creation & Publishing",
      de: "Veranstaltungsmanagement & Veröffentlichung",
    },
    summary: {
      th: "การสร้างกิจกรรม กำหนดวัน-เวลา สถานที่ อัปโหลดรูปภาพปก เปิดรับสมัคร และตั้งค่าจำกัดจำนวนคน",
      en: "Creating ceremonies, setting dates/locations, uploading cover art, and opening online registration.",
      de: "Erstellung von Veranstaltungen, Terminen, Veranstaltungsorten und Online-Registrierung.",
    },
    iconName: "CalendarDays",
    resource: "events",
    routePath: "/admin/events",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/events แล้วกดปุ่ม '+ สร้างกิจกรรม'",
        en: "Navigate to /admin/events and click '+ Create Event'.",
        de: "Zu /admin/events gehen und auf '+ Veranstaltung erstellen' klicken.",
      },
      {
        th: "กรอกชื่อ รายละเอียด วันที่-เวลา และสถานที่ (รองรับ TH/EN/DE)",
        en: "Fill in title, description, date/time, and venue (TH/EN/DE).",
        de: "Titel, Beschreibung, Datum/Uhrzeit und Ort eingeben (TH/EN/DE).",
      },
      {
        th: "เปิดตัวเลือก 'เปิดรับลงทะเบียน' หากต้องการให้คนจองที่นั่ง",
        en: "Enable 'Online Registration' if registration is required.",
        de: "Aktivieren Sie 'Online-Registrierung', falls Plätze reserviert werden sollen.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "info",
        label: { th: "Draft", en: "Draft", de: "Entwurf" },
        meaning: {
          th: "แบบร่าง ยังไม่แสดงบนหน้าเว็บหลัก",
          en: "Draft status; hidden from public site.",
          de: "Entwurf; noch nicht öffentlich sichtbar.",
        },
      },
      {
        badgeVariant: "success",
        label: { th: "Published", en: "Published", de: "Veröffentlicht" },
        meaning: {
          th: "เผยแพร่แล้ว ประชาชนสามารถดูและลงทะเบียนได้",
          en: "Published and open for public view and registration.",
          de: "Veröffentlicht und für die Öffentlichkeit zugänglich.",
        },
      },
      {
        badgeVariant: "default",
        label: { th: "Completed", en: "Completed", de: "Abgeschlossen" },
        meaning: {
          th: "กิจกรรมสิ้นสุดลงแล้ว",
          en: "Event has ended.",
          de: "Die Veranstaltung ist beendet.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "กดสร้างกิจกรรมใหม่",
          en: "Initiate Event Creation",
          de: "Veranstaltungserstellung starten",
        },
        description: {
          th: "เข้าหน้ารายการกิจกรรม แล้วคลิกปุ่ม 'สร้างกิจกรรม' ที่มุมขวาบน",
          en: "Go to the events list and click the 'Create Event' button at the top right.",
          de: "Gehen Sie zur Liste und klicken Sie oben rechts auf 'Veranstaltung erstellen'.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "ระบุข้อมูลและอัปโหลดภาพปก",
          en: "Fill event details and banner",
          de: "Details und Titelbild eingeben",
        },
        description: {
          th: "กรอกชื่อกิจกรรม รายละเอียด กำหนดการ วันเริ่มต้น-สิ้นสุด และเลือกภาพปกที่มีความคมชัด (อัตราส่วน 16:9)",
          en: "Enter title, description, start/end timestamps, venue, and a 16:9 banner image.",
          de: "Titel, Beschreibung, Beginn/Ende, Ort und ein 16:9-Bannerbild hinzufügen.",
        },
        tip: {
          th: "หากเป็นกิจกรรมสำคัญ สามารถเลือกตัวเลือก 'Featured Event' เพื่อให้แสดงเป็นไฮไลท์บนหน้าแรกของเว็บ",
          en: "Mark as 'Featured Event' to highlight on the public homepage hero section.",
          de: "Als 'Hervorgehoben' markieren, um es auf der Startseite hervorzuheben.",
        },
      },
      {
        stepNumber: 3,
        title: {
          th: "ตั้งค่าระบบรับลงทะเบียน (Optional)",
          en: "Configure Registration (Optional)",
          de: "Registrierungseinstellungen (Optional)",
        },
        description: {
          th: "เปิดสวิตช์ 'รับลงทะเบียน' กำหนดจำนวนผู้เข้าร่วมสูงสุด (Max Capacity) และวันปิดรับสมัคร",
          en: "Toggle 'Allow Registration', set max capacity limit, and registration deadline.",
          de: "Aktivieren Sie die Registrierung, maximale Teilnehmerzahl und Anmeldeschluss.",
        },
      },
      {
        stepNumber: 4,
        title: {
          th: "บันทึกและเผยแพร่",
          en: "Save and Publish",
          de: "Speichern und Veröffentlichen",
        },
        description: {
          th: "เลือกสถานะเป็น 'Published' แล้วกดบันทึก กิจกรรมจะปรากฏบนปฏิทินและหน้ากิจกรรมทันที",
          en: "Set status to 'Published' and save. The event will appear on the public calendar instantly.",
          de: "Status auf 'Veröffentlicht' setzen und speichern.",
        },
      },
    ],
    faqs: [
      {
        question: {
          th: "หากต้องการยกเลิกกิจกรรม ต้องทำอย่างไร?",
          en: "How do I cancel or postpone an event?",
          de: "Wie sage ich eine Veranstaltung ab oder verschiebe sie?",
        },
        answer: {
          th: "สามารถเข้าไปแก้ไขสถานะเป็น 'Cancelled' หรือระบุคำว่า [เลื่อนจัดงาน] นำหน้าชื่อกิจกรรม เพื่อแจ้งเตือนประชาชน",
          en: "Edit the event and set status to 'Cancelled' or prepend [Postponed] to notify attendees.",
          de: "Bearbeiten Sie die Veranstaltung und setzen Sie den Status auf 'Abgesagt' oder [Verschoben].",
        },
      },
    ],
    relatedSlugs: ["calendar", "registrations", "gallery"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-calendar",
    slug: "calendar",
    category: "operations",
    title: {
      th: "ปฏิทินงานวัดและตารางพิธีกรรม (Temple Calendar)",
      en: "Temple Calendar & Ceremony Schedule",
      de: "Tempelkalender & Zeremonienplan",
    },
    summary: {
      th: "มุมมองปฏิทินรายเดือน/สัปดาห์ การตรวจสอบคิวงานซ้อน และการค้นหากำหนดการงานบุญ",
      en: "Monthly and weekly calendar view, schedule conflict resolution, and ceremony scheduling.",
      de: "Monats- und Wochenkalenderansicht, Terminkonfliktprüfung und Zeremonienplanung.",
    },
    iconName: "Calendar",
    resource: "events",
    routePath: "/admin/calendar",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/calendar เพื่อดูตารางงานแบบปฏิทิน",
        en: "Navigate to /admin/calendar to view interactive monthly calendar.",
        de: "Zu /admin/calendar gehen für den interaktiven Monatskalender.",
      },
      {
        th: "คลิกที่ช่องวันที่เพื่อสร้างกิจกรรมใหม่ในวันนั้นได้ทันที",
        en: "Click any date cell to quickly create an event on that date.",
        de: "Klicken Sie auf ein Datum, um direkt einen Eintrag zu erstellen.",
      },
      {
        th: "สลับมุมมองระหว่าง รายเดือน (Month), รายสัปดาห์ (Week) และ รายวัน (Day)",
        en: "Switch views between Month, Week, and Day.",
        de: "Wechseln Sie zwischen Monats-, Wochen- und Tagesansicht.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "ตรวจสอบตารางงานรายเดือน",
          en: "Review Monthly Schedule",
          de: "Monatsplan prüfen",
        },
        description: {
          th: "ดูรายการงานพิธี วันพระ และกิจกรรมสำคัญทั้งหมดในแต่ละเดือน เพื่อป้องกันการจัดงานซ้อนเวลา",
          en: "Inspect all ceremonies, Buddhist holy days, and major events to prevent scheduling overlap.",
          de: "Prüfen Sie alle Zeremonien und buddhistischen Feiertage, um Überschneidungen zu vermeiden.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["events", "schedules", "registrations"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-registrations",
    slug: "registrations",
    category: "operations",
    title: {
      th: "การตรวจสอบผู้ลงทะเบียนกิจกรรม (Event Registrations)",
      en: "Event Registrations & Attendee Management",
      de: "Teilnehmerlisten & Anmeldeverwaltung",
    },
    summary: {
      th: "การตรวจสอบรายชื่อผู้ลงทะเบียน ยืนยันสิทธิ์เข้าร่วม เช็คอินหน้างาน และส่งออกไฟล์รายชื่อ",
      en: "Reviewing attendee lists, confirming attendance, on-site check-in, and exporting CSV/Excel.",
      de: "Überprüfung von Teilnehmerlisten, Anmeldebestätigungen, Check-in und CSV-Export.",
    },
    iconName: "ClipboardList",
    resource: "events",
    routePath: "/admin/registrations",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/registrations แล้วเลือกกิจกรรมที่ต้องการตรวจสอบ",
        en: "Go to /admin/registrations and select the target event.",
        de: "Zu /admin/registrations navigieren und Veranstaltung wählen.",
      },
      {
        th: "ดูจำนวนที่นั่งที่ถูกจองเทียบกับความจุสูงสุด (Capacity)",
        en: "Inspect booked seats vs total venue capacity.",
        de: "Gebuchte Plätze mit der Gesamtkapazität vergleichen.",
      },
      {
        th: "กดปุ่ม 'Export' เพื่อดาวน์โหลดรายชื่อผู้เข้าร่วมสำหรับพิมพ์เช็คชื่อ",
        en: "Click 'Export' to download attendee list for printing.",
        de: "Auf 'Exportieren' klicken, um Teilnehmerlisten herunterzuladen.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "warning",
        label: { th: "Pending", en: "Pending", de: "Ausstehend" },
        meaning: {
          th: "ลงทะเบียนแล้ว รอการยืนยันจากเจ้าหน้าที่",
          en: "Registered; awaiting staff confirmation.",
          de: "Angemeldet; wartet auf Bestätigung.",
        },
      },
      {
        badgeVariant: "success",
        label: { th: "Confirmed", en: "Confirmed", de: "Bestätigt" },
        meaning: {
          th: "ยืนยันสิทธิ์เข้าร่วมงานเรียบร้อยแล้ว",
          en: "Seat confirmed successfully.",
          de: "Teilnahme erfolgreich bestätigt.",
        },
      },
      {
        badgeVariant: "danger",
        label: { th: "Cancelled", en: "Cancelled", de: "Storniert" },
        meaning: {
          th: "ผู้สมัครยกเลิกการเข้าร่วม หรือสิทธิ์ถูกยกเลิก",
          en: "Registration cancelled by attendee or staff.",
          de: "Anmeldung storniert.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "กรองรายชื่อตามกิจกรรม",
          en: "Filter Attendees by Event",
          de: "Teilnehmer nach Veranstaltung filtern",
        },
        description: {
          th: "เลือกกิจกรรมจากเมนูดรอปดาวน์เพื่อดูเฉพาะรายชื่อผู้สมัครของงานนั้น",
          en: "Select an event from the dropdown filter to view its dedicated registration table.",
          de: "Wählen Sie eine Veranstaltung aus dem Dropdown-Menü aus.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "ยืนยันหรือแก้ไขสถานะผู้เข้าร่วม & เช็คอินผ่าน QR Code",
          en: "Confirm Status & Live QR Check-in",
          de: "Status bestätigen & Live-QR-Check-in",
        },
        description: {
          th: "คลิกที่สถานะของแต่ละแถวเพื่อเปลี่ยนเป็น 'Confirmed' หรือใช้กล้องมือถือ/แท็บเล็ตเปิดระบบสแกน QR Code หน้างานเพื่อเช็คชื่อผู้เข้าร่วมได้แบบ Real-time",
          en: "Update status to 'Confirmed' or use camera on mobile/tablet for instant real-time QR code attendance check-in.",
          de: "Status auf 'Bestätigt' setzen oder Smartphone/Tablet für den Echtzeit-QR-Check-in vor Ort nutzen.",
        },
        image: "/images/guide/attendance-qr.svg",
        imageCaption: {
          th: "ระบบสแกน QR Code เช็คชื่อผู้เข้าร่วมงานวัดแบบสด (Live QR Code Scanner)",
          en: "Live QR code camera scanner for temple event attendee check-in",
          de: "Live-Kamera-QR-Code-Scanner für den Vor-Ort-Check-in",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["events", "calendar", "members"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-schedules",
    slug: "schedules",
    category: "operations",
    title: {
      th: "ตารางวัตรปฏิบัติและกำหนดการประจำวัน (Daily Schedules)",
      en: "Daily Routine & Monastic Schedules",
      de: "Tagesablauf & Klosterzeiten",
    },
    summary: {
      th: "การจัดการตารางวัตรปฏิบัติประจำวัน เวลาทำวัตรเช้า-เย็น เวลาฉันภัตตาหาร และเวลาเปิดรับญาติโยม",
      en: "Managing daily monastic chanting routines, alms rounds, meditation, and visiting hours.",
      de: "Verwaltung der täglichen Gebetszeiten, Almosengänge, Meditation und Besucherzeiten.",
    },
    iconName: "Clock",
    resource: "schedules",
    routePath: "/admin/schedules",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/schedules",
        en: "Navigate to /admin/schedules",
        de: "Gehen Sie zu /admin/schedules",
      },
      {
        th: "เพิ่มหรือแก้ไขช่วงเวลาและชื่อกิจกรรมประจำวัน",
        en: "Add or update time intervals and routine titles",
        de: "Uhrzeiten und Bezeichnungen des Tagesablaufs bearbeiten",
      },
      {
        th: "จัดเรียงลำดับเวลาให้ถูกต้องก่อนกดบันทึก",
        en: "Order chronologically and save",
        de: "Chronologisch ordnen und speichern",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "จัดการรายการเวลา",
          en: "Manage Time Slots",
          de: "Zeitfenster verwalten",
        },
        description: {
          th: "ระบุเวลาเริ่มต้น-สิ้นสุด (เช่น 05:00 - 06:30 ทำวัตรเช้าและนั่งสมาธิ) พร้อมคำแปลภาษาอังกฤษและเยอรมัน",
          en: "Specify start/end times (e.g. 05:00 - 06:30 Morning Chanting) with multilingual titles.",
          de: "Geben Sie Beginn und Ende an (z.B. 05:00 - 06:30 Morgenandacht) mit Übersetzungen.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["calendar", "events", "monks"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-gallery",
    slug: "gallery",
    category: "operations",
    title: {
      th: "อัลบั้มรูปภาพกิจกรรมและงานบุญ (Photo Gallery)",
      en: "Photo Gallery & Album Management",
      de: "Bildergalerie & Albumverwaltung",
    },
    summary: {
      th: "การสร้างอัลบั้มภาพงานพิธี อัปโหลดชุดรูปภาพหลายรูปพร้อมกัน จัดลำดับ และตั้งรูปหน้าปก",
      en: "Creating ceremony albums, batch uploading multiple photos, sorting, and setting cover images.",
      de: "Erstellung von Fotoalben, Stapel-Upload, Sortierung und Festlegen von Titelbildern.",
    },
    iconName: "Image",
    resource: "gallery",
    routePath: "/admin/gallery",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/gallery แล้วกด '+ สร้างอัลบั้ม'",
        en: "Go to /admin/gallery and click '+ Create Album'.",
        de: "Zu /admin/gallery navigieren und '+ Album erstellen' anklicken.",
      },
      {
        th: "ตั้งชื่ออัลบั้ม ระบุวันที่จัดงาน และเลือกภาพปก",
        en: "Name album, specify event date, and pick cover image.",
        de: "Albumnamen vergeben, Datum eintragen und Titelbild wählen.",
      },
      {
        th: "ลากไฟล์รูปภาพหลายไฟล์มาวางเพื่ออัปโหลดพร้อมกัน",
        en: "Drag & drop multiple photos to batch upload.",
        de: "Mehrere Fotos per Drag & Drop gleichzeitig hochladen.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "สร้างอัลบั้มและระบุข้อมูล",
          en: "Create Album Container",
          de: "Album anlegen",
        },
        description: {
          th: "กรอกชื่ออัลบั้มงานบุญ วันที่จัดกิจกรรม และคำอธิบายสั้นๆ เกี่ยวกับงาน",
          en: "Enter album title, ceremony date, and brief description.",
          de: "Geben Sie Albumnamen, Datum der Zeremonie und Kurzbeschreibung ein.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "อัปโหลดชุดรูปภาพแบบเป็นกลุ่ม (Batch Upload)",
          en: "Batch Upload Photos",
          de: "Stapel-Upload von Fotos",
        },
        description: {
          th: "เลือกรูปภาพได้หลายสิบรูปพร้อมกัน ระบบจะทำการบีบอัดและอัปโหลดขึ้น Cloudflare R2 Storage โดยอัตโนมัติ",
          en: "Select multiple high-resolution photos; the system optimizes and uploads them automatically.",
          de: "Wählen Sie mehrere Fotos aus; das System optimiert und lädt sie automatisch hoch.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["media", "events"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-monks",
    slug: "monks",
    category: "operations",
    title: {
      th: "ทำเนียบพระสงฆ์ (Monks Directory)",
      en: "Monks Directory & Ecclesiastical Profiles",
      de: "Mönchsverzeichnis & Geistliche Profile",
    },
    summary: {
      th: "การบันทึกประวัติพระภิกษุ-สามเณร สมณศักดิ์ ตำแหน่งหน้าที่ในวัด และพรรษา",
      en: "Recording monk profiles, ecclesiastical titles (สมณศักดิ์), temple roles, and ordination seniority.",
      de: "Erfassung von Mönchsprofilen, geistlichen Titeln, Tempelämtern und Ordinationsjahren.",
    },
    iconName: "Users",
    resource: "monks",
    routePath: "/admin/monks",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/monks เพื่อดูทำเนียบพระสงฆ์ทั้งหมด",
        en: "Navigate to /admin/monks to view monk roster.",
        de: "Zu /admin/monks gehen für die Liste aller Mönche.",
      },
      {
        th: "กด '+ เพิ่มพระสงฆ์' เพื่อสร้างประวัติรูปใหม่",
        en: "Click '+ Add Monk' to register new monk profile.",
        de: "Auf '+ Mönch hinzufügen' klicken für neues Profil.",
      },
      {
        th: "ระบุฉายา สมณศักดิ์ พรรษา ตำแหน่ง และอัปโหลดรูปถ่ายทางการ",
        en: "Enter monastic name, titles, seniority, and formal portrait.",
        de: "Ordinationsnamen, Titel, Dienstjahre und Porträtbild eintragen.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "กรอกข้อมูลประวัติและสมณศักดิ์",
          en: "Enter Monastic Details",
          de: "Mönchsdaten eingeben",
        },
        description: {
          th: "ระบุชื่อ-ฉายาภาษาบาลี (เช่น พระมหา... ชินวํโส) ตำแหน่งบริหารในวัด (เจ้าอาวาส, รองเจ้าอาวาส, พระลูกวัด) และจำนวนพรรษา",
          en: "Provide Pali name, monastic administrative title (Abbot, Vice Abbot, Resident Monk), and seniority.",
          de: "Pali-Namen, Funktion im Tempel (Abt, Vize-Abt) und Anzahl der Ordinationsjahre eintragen.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "อัปโหลดรูปภาพและประวัติโดยย่อ",
          en: "Upload Portrait and Bio",
          de: "Porträt und Biografie hochladen",
        },
        description: {
          th: "เลือกรูปถ่ายครึ่งองค์ที่สุภาพ และกรอกประวัติการศึกษาธรรมะเพื่อเผยแพร่บนหน้าทำเนียบพระสงฆ์สาธารณะ",
          en: "Upload formal portrait and provide Dharma education bio for public profile page.",
          de: "Laden Sie ein Porträtfoto hoch und fügen Sie eine kurze Biografie hinzu.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["about", "media"],
    updatedAt: "2026-08-19",
  },
];
