import type { GuideArticle } from "@/types/adminGuide";

export const websiteCmsGuides: GuideArticle[] = [
  {
    id: "guide-about",
    slug: "about",
    category: "website",
    title: {
      th: "การแก้ไขข้อมูลเกี่ยวกับวัด (About Temple)",
      en: "About Temple Content Management",
      de: "Verwaltung der Tempelinformationen (Über uns)",
    },
    summary: {
      th: "ขั้นตอนการแก้ไขประวัติวัด วิสัยทัศน์ วัตถุประสงค์ และโครงสร้างบริหารแบบ 3 ภาษา",
      en: "How to edit temple history, vision, objectives, and organizational structure across 3 languages.",
      de: "Bearbeitung von Tempelgeschichte, Vision, Zielen und Organisationsstruktur in 3 Sprachen.",
    },
    iconName: "BookOpen",
    resource: "website",
    routePath: "/admin/about",
    quickSteps: [
      {
        th: "เข้าสู่เมนู 'เกี่ยวกับวัด' (/admin/about)",
        en: "Navigate to 'About Temple' (/admin/about)",
        de: "Gehen Sie zu 'Über den Tempel' (/admin/about)",
      },
      {
        th: "แก้ไขเนื้อหาประวัติและวิสัยทัศน์ผ่าน Rich Text Editor",
        en: "Edit narrative and history using the Rich Text Editor",
        de: "Bearbeiten Sie die Tempelgeschichte mit dem Rich-Text-Editor",
      },
      {
        th: "ตรวจสอบและกรอกครบทั้ง 3 ภาษา (TH, EN, DE) ก่อนกดบันทึก",
        en: "Ensure all 3 language tabs (TH, EN, DE) are filled before saving",
        de: "Stellen Sie sicher, dass alle 3 Sprachen (TH, EN, DE) vor dem Speichern ausgefüllt sind",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "เปิดหน้าแก้ไขเกี่ยวกับวัด",
          en: "Open About Temple Page",
          de: "Über-uns-Seite öffnen",
        },
        description: {
          th: "เข้าเมนู 'ข้อมูลเว็บไซต์' > 'เกี่ยวกับวัด' ในแถบเมนูด้านซ้าย",
          en: "Select 'Website Content' > 'About Temple' from the left sidebar.",
          de: "Wählen Sie 'Website-Inhalte' > 'Über den Tempel' in der linken Seitenleiste.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "กรอกเนื้อหาและจัดรูปแบบข้อความ",
          en: "Enter and format rich text",
          de: "Inhalte eingeben und formatieren",
        },
        description: {
          th: "ใช้แถบเครื่องมือ Rich Text ในการจัดหัวข้อ ตัวหนา ตัวเอียง รายการหัวข้อย่อย และแทรกลิงก์อ้างอิง",
          en: "Use the Rich Text toolbar to format headings, bold/italic text, lists, and external links.",
          de: "Nutzen Sie die Rich-Text-Symbolleiste für Überschriften, Listen und Links.",
        },
        image: "/images/guide/cms-multilang.svg",
        imageCaption: {
          th: "การจัดการเนื้อหาและสลับแท็บภาษา 3 ภาษา (TH, EN, DE)",
          en: "Multilingual content editor with 3-language tab switching (TH, EN, DE)",
          de: "Mehrsprachiger Editor mit Sprachwechsel (TH, EN, DE)",
        },
        tip: {
          th: "สลับแท็บภาษา TH/EN/DE ที่แถบด้านบนของกล่องข้อความเพื่อใส่คำแปลให้ครบถ้วน",
          en: "Switch between TH/EN/DE tabs above each field to provide complete translations.",
          de: "Wechseln Sie die Reiter TH/EN/DE, um vollständige Übersetzungen einzupflegen.",
        },
      },
      {
        stepNumber: 3,
        title: {
          th: "บันทึกและตรวจสอบบนหน้าเว็บสาธารณะ",
          en: "Save and preview on public site",
          de: "Speichern und auf der öffentlichen Website prüfen",
        },
        description: {
          th: "กดปุ่ม 'บันทึกข้อมูล' ที่แถบด้านล่าง จากนั้นเปิดหน้าเว็บสาธารณะ (/about) เพื่อดูผลลัพธ์",
          en: "Click 'Save Changes' on the bottom action bar, then visit the public /about page to verify.",
          de: "Klicken Sie auf 'Änderungen speichern' und prüfen Sie die öffentliche Seite (/about).",
        },
      },
    ],
    faqs: [
      {
        question: {
          th: "จำเป็นต้องกรอกภาษาอังกฤษและเยอรมันเสมอหรือไม่?",
          en: "Are English and German translations required?",
          de: "Sind englische und deutsche Übersetzungen erforderlich?",
        },
        answer: {
          th: "แนะนำให้กรอกให้ครบทุกภาษาเพื่อประสบการณ์ที่ดีของผู้เยี่ยมชมต่างชาติ หากไม่มีคำแปล ระบบจะใช้ภาษาไทยเป็นค่าเริ่มต้น",
          en: "Filling all languages is strongly recommended for international visitors; Thai acts as fallback.",
          de: "Es wird empfohlen, alle Sprachen auszufüllen; Thai dient als Fallback.",
        },
      },
    ],
    relatedSlugs: ["contact", "impressum", "media"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-contact",
    slug: "contact",
    category: "website",
    title: {
      th: "การตั้งค่าข้อมูลติดต่อวัด (Contact Information)",
      en: "Contact Information & Map Coordinates",
      de: "Kontaktinformationen & Kartenkoordinaten",
    },
    summary: {
      th: "วิธีจัดการที่อยู่วัด เบอร์โทรศัพท์ อีเมล เวลาทำการ และพิกัดแผนที่ Google Maps",
      en: "How to manage temple address, phone, email, opening hours, and Google Maps location.",
      de: "Verwaltung von Tempeladresse, Telefon, E-Mail, Öffnungszeiten und Google Maps Koordinaten.",
    },
    iconName: "Phone",
    resource: "website",
    routePath: "/admin/contact",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/contact เพื่อจัดการข้อมูลการติดต่อ",
        en: "Navigate to /admin/contact to manage contact data.",
        de: "Gehen Sie zu /admin/contact für Kontaktdaten.",
      },
      {
        th: "อัปเดตที่อยู่ เบอร์โทรศัพท์ อีเมล และเวลาเปิด-ปิดทำการ",
        en: "Update physical address, phone, email, and visiting hours.",
        de: "Aktualisieren Sie Adresse, Telefon, E-Mail und Öffnungszeiten.",
      },
      {
        th: "กำหนดพิกัดละติจูด/ลองจิจูดสำหรับหมุด Google Maps",
        en: "Set Latitude and Longitude for accurate Google Maps pin.",
        de: "Legen Sie Breiten- und Längengrad für die Kartenmarkierung fest.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "ระบุที่อยู่วัดและช่องทางติดต่อ",
          en: "Provide address and channels",
          de: "Adresse und Kanäle angeben",
        },
        description: {
          th: "กรอกชื่อวัด ที่อยู่ทั้งภาษาไทยและสากล พร้อมระบุเบอร์โทรศัพท์สายตรงและอีเมลทางการของวัด",
          en: "Enter official temple name, bilingual address, direct telephone, and administrative email.",
          de: "Geben Sie Tempelname, Adresse, Telefonnummer und E-Mail-Adresse ein.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "ตั้งค่าพิกัดแผนที่ (Maps)",
          en: "Configure Map Pin",
          de: "Kartenmarkierung einstellen",
        },
        description: {
          th: "ใส่ค่า Latitude และ Longitude จาก Google Maps เพื่อให้ระบบแสดงแผนที่แบบอินเทอร์แอคทีฟบนหน้าเว็บ",
          en: "Paste Latitude and Longitude values from Google Maps for interactive map rendering.",
          de: "Fügen Sie Breiten- und Längengrade aus Google Maps ein.",
        },
        tip: {
          th: "สามารถคลิกขวาที่ตำแหน่งวัดบน Google Maps แล้วเลือก 'คัดลอกพิกัด' มาวางได้ทันที",
          en: "Right-click the temple location in Google Maps and select 'Copy coordinates' to paste directly.",
          de: "Klicken Sie in Google Maps mit der rechten Maustaste auf den Ort und kopieren Sie die Koordinaten.",
        },
      },
      {
        stepNumber: 3,
        title: {
          th: "บันทึกและทดสอบการนำทาง",
          en: "Save and verify navigation",
          de: "Speichern und Navigation prüfen",
        },
        description: {
          th: "กดบันทึก แล้วทดสอบคลิกปุ่ม 'นำทาง' บนหน้าติดต่อของเว็บไซต์สาธารณะ",
          en: "Save changes and test the 'Get Directions' button on the public contact page.",
          de: "Speichern und testen Sie die Routenführung auf der Kontaktseite.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["about", "contacts", "settings"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-impressum",
    slug: "impressum",
    category: "website",
    title: {
      th: "การจัดการข้อมูลทางกฎหมาย (Impressum)",
      en: "Legal Notice & Impressum Management",
      de: "Impressum & Gesetzliche Pflichtangaben",
    },
    summary: {
      th: "การจัดการข้อมูลผู้รับผิดชอบเว็บไซต์ เลขทะเบียนนิติบุคคล และข้อกำหนดตามมาตรฐานสากล/EU",
      en: "Managing legal representatives, registered non-profit numbers, and EU regulatory notices.",
      de: "Verwaltung der gesetzlichen Vertreter, Vereinsregisternummern und EU-Pflichtangaben.",
    },
    iconName: "FileText",
    resource: "website",
    routePath: "/admin/impressum",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/impressum",
        en: "Go to /admin/impressum",
        de: "Zu /admin/impressum navigieren",
      },
      {
        th: "ระบุรายนามผู้มีอำนาจลงนามและตัวแทนทางกฎหมายของวัด",
        en: "Provide authorized temple representatives and legal board members",
        de: "Vertretungsberechtigte Personen und Vereinsvorstand eintragen",
      },
      {
        th: "บันทึกและตรวจสอบบนหน้า /impressum",
        en: "Save and review on public /impressum route",
        de: "Speichern und auf /impressum prüfen",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "กรอกข้อมูลนิติบุคคลและผู้รับผิดชอบ",
          en: "Enter Legal Entity Information",
          de: "Rechtsträger und Verantwortliche angeben",
        },
        description: {
          th: "ระบุชื่อสมาคม/มูลนิธิวัด เลขทะเบียนนิติบุคคล ที่อยู่จดทะเบียน และชื่อประธานกรรมการหรือเจ้าอาวาส",
          en: "Enter temple association name, registration number, registered office address, and board president.",
          de: "Tragen Sie Vereinsname, Registernummer, Vereinssitz und Vorstand ein.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "บันทึกข้อมูล",
          en: "Save Legal Notice",
          de: "Impressum speichern",
        },
        description: {
          th: "ตรวจสอบความถูกต้องของข้อมูลตามกฎหมายท้องถิ่นแล้วกดบันทึก",
          en: "Review compliance with local regulatory requirements and save.",
          de: "Prüfen Sie die Angaben und speichern Sie das Impressum ab.",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["privacy", "about", "contact"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-privacy",
    slug: "privacy",
    category: "website",
    title: {
      th: "การจัดการนโยบายความเป็นส่วนตัว (Privacy Policy)",
      en: "Privacy Policy & Cookie Consent Management",
      de: "Datenschutzerklärung & Cookie-Richtlinien",
    },
    summary: {
      th: "การจัดการข้อกำหนดคุ้มครองข้อมูลส่วนบุคคล (PDPA/GDPR) และนโยบายคุกกี้",
      en: "Managing data protection policies, PDPA/GDPR compliance terms, and cookie rules.",
      de: "Verwaltung der Datenschutzbestimmungen gemäß DSGVO und Cookie-Richtlinien.",
    },
    iconName: "ShieldCheck",
    resource: "website",
    routePath: "/admin/privacy",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/privacy",
        en: "Navigate to /admin/privacy",
        de: "Gehen Sie zu /admin/privacy",
      },
      {
        th: "แก้ไขรายละเอียดการเก็บรวบรวม การใช้งาน และการปกป้องข้อมูลส่วนบุคคล",
        en: "Edit data collection, processing purpose, and storage security terms",
        de: "Richtlinien zu Datenerhebung, Verwendungszweck und Speicherdauer anpassen",
      },
      {
        th: "บันทึกและเผยแพร่บนหน้าเว็บสาธารณะ",
        en: "Save and publish to public website",
        de: "Speichern und veröffentlichen",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "อัปเดตข้อกำหนดความเป็นส่วนตัว",
          en: "Update Privacy Clauses",
          de: "Datenschutzklauseln aktualisieren",
        },
        description: {
          th: "ระบุวัตถุประสงค์ในการเก็บข้อมูล (เช่น การลงทะเบียนกิจกรรม การออกใบอนุโมทนาบัตร) และสิทธิของเจ้าของข้อมูล",
          en: "Detail the purposes of data collection (e.g. event registration, donation receipts) and user rights.",
          de: "Erläutern Sie den Zweck der Datenerhebung (z.B. Veranstaltungsanmeldung, Spendenquittungen).",
        },
      },
    ],
    faqs: [],
    relatedSlugs: ["privacy-requests", "impressum"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-media",
    slug: "media",
    category: "website",
    title: {
      th: "คลังสื่อ รูปภาพ และไฟล์เอกสาร (Media Library)",
      en: "Media Library & File Management",
      de: "Mediathek & Dateiverwaltung",
    },
    summary: {
      th: "การอัปโหลดไฟล์ภาพ ตัดครอบรูปภาพ (Crop) คัดลอก URL และกู้คืนไฟล์จากถังขยะ",
      en: "Uploading assets, image cropping, copying CDN URLs, and restoring from Recycle Bin.",
      de: "Hochladen von Bildern, Zuschnitt, Kopieren von URLs und Wiederherstellen aus dem Papierkorb.",
    },
    iconName: "FolderOpen",
    resource: "website",
    routePath: "/admin/media",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/media เพื่อดูไฟล์ทั้งหมดใน Cloud Storage",
        en: "Open /admin/media to view all stored assets in Cloud Storage.",
        de: "Öffnen Sie /admin/media für alle Dateien im Cloud-Speicher.",
      },
      {
        th: "ลากไฟล์มาวาง (Drag & Drop) หรือคลิก 'อัปโหลดสื่อ'",
        en: "Drag & drop files or click 'Upload Media'.",
        de: "Dateien per Drag & Drop ablegen oder auf 'Medien hochladen' klicken.",
      },
      {
        th: "คลิกที่รูปเพื่อดูรายละเอียด คัดลอก URL หรือกดแก้ไขเพื่อตัดครอบ",
        en: "Click asset to view details, copy public URL, or crop.",
        de: "Auf das Bild klicken für Details, URL kopieren oder zuschneiden.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "success",
        label: { th: "Active Assets", en: "Active Assets", de: "Aktive Dateien" },
        meaning: {
          th: "ไฟล์ที่พร้อมใช้งานและแสดงผลบนเว็บไซต์",
          en: "Assets actively published and accessible.",
          de: "Aktiv veröffentlichte und verfügbare Dateien.",
        },
      },
      {
        badgeVariant: "warning",
        label: { th: "Recycle Bin", en: "Recycle Bin", de: "Papierkorb" },
        meaning: {
          th: "ไฟล์ที่ถูกลบชั่วคราว สามารถกู้คืนได้ภายใน 30 วัน",
          en: "Soft-deleted files that can be restored within 30 days.",
          de: "Gelöschte Dateien, die innerhalb von 30 Tagen wiederhergestellt werden können.",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "อัปโหลดรูปภาพและสื่อใหม่",
          en: "Upload new media",
          de: "Neue Medien hochladen",
        },
        description: {
          th: "กดปุ่ม 'อัปโหลดสื่อ' เลือกไฟล์รูปภาพ (JPG, PNG, WebP) หรือไฟล์ PDF ขนาดไม่เกินที่ระบบกำหนด",
          en: "Click 'Upload Media' and choose JPG, PNG, WebP, or PDF files within size limits.",
          de: "Klicken Sie auf 'Medien hochladen' und wählen Sie Bilddateien (JPG, PNG, WebP) oder PDFs aus.",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "การตัดครอบรูปภาพ (Crop Tool)",
          en: "Image Cropping",
          de: "Bilder zuschneiden",
        },
        description: {
          th: "คลิกที่ไอคอนดินสอ/แก้ไขบนรูปภาพ เลือกสัดส่วนที่ต้องการ (16:9 สำหรับแบนเนอร์, 1:1 สำหรับโปรไฟล์) แล้วกดยืนยัน",
          en: "Click the edit icon on an image, select aspect ratio (16:9 for banners, 1:1 for avatars), and confirm.",
          de: "Klicken Sie auf das Bearbeiten-Symbol, wählen Sie das Seitenverhältnis (16:9 Banner, 1:1 Avatar).",
        },
        images: [
          {
            src: "/images/guide/media-crop.svg",
            caption: {
              th: "เครื่องมือตัดครอบรูปภาพและการเลือกสัดส่วน 16:9, 1:1, 4:3",
              en: "Image cropping tool and aspect ratio presets (16:9, 1:1, 4:3)",
              de: "Bildzuschnitt-Werkzeug und Voreinstellungen (16:9, 1:1, 4:3)",
            },
          },
          {
            src: "/images/event-asanha.png",
            caption: {
              th: "ตัวอย่างการเลือกสัดส่วน 16:9 สำหรับแบนเนอร์กิจกรรมและข่าวประชาสัมพันธ์",
              en: "Selecting 16:9 aspect ratio for event banners and announcements",
              de: "Auswahl des 16:9-Formats für Veranstaltungsbanner und Ankündigungen",
            },
          },
        ],
      },
      {
        stepNumber: 3,
        title: {
          th: "การคัดลอก URL เพื่อนำไปใช้งาน",
          en: "Copy asset URL",
          de: "Bild-URL kopieren",
        },
        description: {
          th: "คลิกปุ่ม 'คัดลอก URL' เพื่อนำลิงก์รูปภาพไปใส่ในเนื้อหาข่าว กิจกรรม หรือโพสต์ต่างๆ ได้ทันที",
          en: "Click 'Copy URL' to use the CDN link inside articles, events, or web pages.",
          de: "Kopieren Sie die URL, um das Bild in Artikeln oder Veranstaltungen einzubinden.",
        },
      },
    ],
    faqs: [
      {
        question: {
          th: "หากเผลอลบรูปภาพสำคัญ สามารถกู้คืนได้หรือไม่?",
          en: "Can I recover accidentally deleted images?",
          de: "Kann ich versehentlich gelöschte Bilder wiederherstellen?",
        },
        answer: {
          th: "ได้ โดยสลับไปที่แท็บ 'ถังขยะ' (Recycle Bin) เลือกรูปที่ต้องการแล้วกด 'กู้คืน' (Restore)",
          en: "Yes, switch to the 'Recycle Bin' tab, select your asset, and click 'Restore'.",
          de: "Ja, wechseln Sie zum Reiter 'Papierkorb' und klicken Sie auf 'Wiederherstellen'.",
        },
      },
    ],
    relatedSlugs: ["events", "gallery", "monks"],
    updatedAt: "2026-08-19",
  },
  {
    id: "guide-chatbot",
    slug: "chatbot",
    category: "website",
    title: {
      th: "ระบบแชทบอทและฐานความรู้ (AI Chatbot & Knowledge Base)",
      en: "AI Visitor Chatbot & Knowledge Base",
      de: "KI-Besucher-Chatbot & Wissensdatenbank",
    },
    summary: {
      th: "การจัดการฐานความรู้ ถาม-ตอบ (Q&A) อัจฉริยะ 3 ภาษา (TH, EN, DE) และการควบคุมการทำงานของแชทบอทประจำวัด",
      en: "Managing curated Q&A knowledge base across 3 languages (TH, EN, DE) and configuring the AI temple assistant.",
      de: "Verwaltung der dreisprachigen Wissensdatenbank (TH, EN, DE) und Konfiguration des KI-Tempelassistenten.",
    },
    iconName: "MessageSquare",
    resource: "chatbot",
    routePath: "/admin/chatbot",
    quickSteps: [
      {
        th: "เข้าเมนู /admin/chatbot เพื่อดูรายการคำถาม-คำตอบ (Knowledge Base)",
        en: "Open /admin/chatbot to view curated Q&A knowledge base entries.",
        de: "Zu /admin/chatbot gehen, um die Q&A-Wissensdatenbank einzusehen.",
      },
      {
        th: "กด '+ เพิ่มคำถาม-คำตอบ' และระบุเนื้อหาทั้ง 3 ภาษา (ไทย, อังกฤษ, เยอรมัน)",
        en: "Click '+ Add Q&A' and fill in content for all 3 languages (TH, EN, DE).",
        de: "Auf '+ Frage & Antwort hinzufügen' klicken und Inhalte in allen 3 Sprachen ausfüllen.",
      },
      {
        th: "เปิดสถานะ 'Active' เพื่อให้ AI นำข้อมูลไปใช้ตอบคำถามญาติโยมบนหน้าเว็บ",
        en: "Set status to 'Active' so the AI assistant can reference it for public inquiries.",
        de: "Status auf 'Aktiv' setzen, damit der KI-Assistent die Antworten für Besucher nutzt.",
      },
    ],
    statusLegends: [
      {
        badgeVariant: "success",
        label: { th: "Active (ใช้งาน)", en: "Active", de: "Aktiv" },
        meaning: {
          th: "ข้อมูล Q&A ถูกเปิดใช้งานและพร้อมให้ AI นำไปประมวลผลตอบคำถามสด",
          en: "Q&A is active and currently indexed by the AI response aggregator.",
          de: "Q&A ist aktiv und wird vom KI-Assistenten für Antworten verwendet.",
        },
      },
      {
        badgeVariant: "default",
        label: { th: "Draft (แบบร่าง)", en: "Draft", de: "Entwurf" },
        meaning: {
          th: "แบบร่างที่ยังไม่เปิดให้ AI นำไปตอบคำถามสาธารณะ",
          en: "Draft entry hidden from the public AI assistant.",
          de: "Entwurf, der für den öffentlichen KI-Assistenten noch nicht sichtbar ist.",
        },
      },
      {
        badgeVariant: "info",
        label: { th: "Hybrid Context", en: "Hybrid Context", de: "Hybrid-Kontext" },
        meaning: {
          th: "AI จะดึงข้อมูล Q&A ร่วมกับตารางกิจกรรม ปฏิทินวันพระ และทำเนียบพระสงฆ์แบบ Real-time",
          en: "AI combines curated Q&A with live database data (events, monks, schedules).",
          de: "KI kombiniert Q&A mit Live-Datenbankdaten (Events, Mönche, Kalender).",
        },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: {
          th: "การเพิ่มและจัดการรายการคำถาม-คำตอบ (Curated Q&A)",
          en: "Add and Manage Curated Q&A",
          de: "Q&A-Einträge hinzufügen und verwalten",
        },
        description: {
          th: "คลิกปุ่ม '+ เพิ่มคำถาม-คำตอบ' กรอกหัวข้อ คำถามที่พบบ่อย และคำตอบที่ถูกต้องตามหลักพระพุทธศาสนาและธรรมเนียมปฏิบัติของวัด ระบุให้ครบทั้ง 3 ภาษา (TH, EN, DE) เพื่อรองรับญาติโยมทั้งชาวไทยและชาวต่างชาติ",
          en: "Click '+ Add Q&A', provide frequently asked questions and accurate responses aligned with temple customs in all 3 languages (TH, EN, DE).",
          de: "Klicken Sie auf '+ Frage & Antwort hinzufügen' und tragen Sie Antworten zu Tempelregeln in allen 3 Sprachen (TH, EN, DE) ein.",
        },
        image: "/images/guide/chatbot-kb.svg",
        imageCaption: {
          th: "หน้าต่างจัดการฐานความรู้แชทบอทและสถาปัตยกรรม Hybrid AI Context",
          en: "Chatbot knowledge base manager and Hybrid AI Context architecture",
          de: "Chatbot-Wissensdatenbank und Hybrid-KI-Kontext-Architektur",
        },
      },
      {
        stepNumber: 2,
        title: {
          th: "หลักการทำงานของ Hybrid Context Aggregator & Guardrails",
          en: "Hybrid Context Aggregator & Safety Guardrails",
          de: "Hybrid-Kontext-Aggregator & Sicherheitsrichtlinien",
        },
        description: {
          th: "เมื่อญาติโยมพิมพ์สอบถาม แชทบอทจะค้นหา Q&A ที่ตรงที่สุด ผสานกับข้อมูลสดในระบบ (เช่น กิจกรรมที่กำลังจะมาถึง, ตารางวัตรปฏิบัติ, วันพระ) และใช้กรอบจริยธรรม (Persona Guardrails) เพื่อตอบด้วยภาษาที่สุภาพ สำรวม และถูกต้องตามพระธรรมวินัย",
          en: "When visitors inquire, the chatbot retrieves matching Q&A combined with live database records (upcoming events, monk roster) with strict Theravada Forest Tradition etiquette.",
          de: "Bei Besucheranfragen kombiniert der Chatbot passende Q&A-Einträge mit Live-Daten (Veranstaltungen, Tagespläne) unter Wahrung buddhistischer Höflichkeitsregeln.",
        },
        tip: {
          th: "หากข้อมูลเกี่ยวกับกิจกรรมเปลี่ยนแปลง เช่น เลื่อนเวลา ระบบจะอัปเดตข้อมูลให้แชทบอทอัตโนมัติโดยไม่ต้องแก้ Q&A ซ้ำซ้อน",
          en: "If event dates change in the database, the chatbot automatically reflects the new schedule without needing manual Q&A edits.",
          de: "Bei Terminänderungen übernimmt der Chatbot die neuen Daten automatisch aus der Datenbank.",
        },
      },
      {
        stepNumber: 3,
        title: {
          th: "การเปิด/ปิด Widget แชทบอทบนหน้าเว็บไซต์",
          en: "Enable/Disable Public Floating Widget",
          de: "Öffentliches Chat-Widget aktivieren/deaktivieren",
        },
        description: {
          th: "สามารถควบคุมการแสดงผล Floating Widget บนหน้าเว็บไซต์สาธารณะได้ผ่านตัวแปรสภาพแวดล้อม NEXT_PUBLIC_CHATBOT_ENABLED ในฝั่ง Frontend",
          en: "Control the visibility of the floating chat bubble on public pages via NEXT_PUBLIC_CHATBOT_ENABLED.",
          de: "Die Sichtbarkeit des Chat-Widgets kann über NEXT_PUBLIC_CHATBOT_ENABLED gesteuert werden.",
        },
      },
    ],
    faqs: [
      {
        question: {
          th: "หากไม่มีข้อมูลในฐานความรู้ แชทบอทจะตอบอย่างไร?",
          en: "How does the chatbot respond if no matching Q&A is found?",
          de: "Wie antwortet der Chatbot, wenn keine passende Antwort gefunden wird?",
        },
        answer: {
          th: "แชทบอทจะใช้โมเดล Google Gemini ประมวลผลจากข้อมูลทั่วไปของวัดที่มีอยู่ในระบบอย่างสุภาพ หากเป็นเรื่องเฉพาะทางที่ไม่มีข้อมูล จะแนะนำให้ญาติโยมติดต่อวัดโดยตรงผ่านหน้า 'ติดต่อเรา'",
          en: "The AI provides a polite summary based on general temple information or gently advises the visitor to contact the temple directly via the Contact page.",
          de: "Der KI-Assistent antwortet höflich anhand allgemeiner Tempeldaten oder empfiehlt die Kontaktaufnahme über die Kontaktseite.",
        },
      },
      {
        question: {
          th: "แชทบอทสามารถตอบภาษาอื่นนอกจาก ไทย อังกฤษ เยอรมัน ได้หรือไม่?",
          en: "Can the chatbot answer in languages other than Thai, English, and German?",
          de: "Kann der Chatbot auch in anderen Sprachen als TH, EN, DE antworten?",
        },
        answer: {
          th: "ระบบหลักรองรับภาษาไทย อังกฤษ และเยอรมันอย่างสมบูรณ์แบบ หากมีผู้สอบถามด้วยภาษาอื่น โมเดล Gemini สามารถทำความเข้าใจและตอบกลับด้วยภาษานั้นๆ ได้อย่างเป็นธรรมชาติ",
          en: "While primarily optimized for Thai, English, and German, Gemini can understand and respond politely in other visitor languages as well.",
          de: "Obwohl für TH, EN und DE optimiert, kann Gemini auch Anfragen in anderen Sprachen höflich beantworten.",
        },
      },
    ],
    relatedSlugs: ["about", "contact", "events", "environment-config"],
    updatedAt: "2026-08-26",
  },
];
