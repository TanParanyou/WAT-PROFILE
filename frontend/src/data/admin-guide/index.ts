import type {
  GuideArticle,
  GuideCategory,
  GuideCategoryMeta,
} from "@/types/adminGuide";
import { gettingStartedGuides } from "./getting-started";
import { websiteCmsGuides } from "./website-cms";
import { operationsGuides } from "./operations";
import { financeGuides } from "./finance";
import { systemGuides } from "./system";

export const guideCategories: GuideCategoryMeta[] = [
  {
    id: "getting-started",
    title: {
      th: "เริ่มต้นใช้งาน",
      en: "Getting Started",
      de: "Erste Schritte",
    },
    description: {
      th: "ภาพรวมแดชบอร์ด การจัดการโปรไฟล์ และการตั้งค่าพื้นฐาน",
      en: "Dashboard overview, user profile, and basic admin navigation.",
      de: "Dashboard-Übersicht, Profilverwaltung und grundlegende Bedienung.",
    },
    iconName: "Compass",
  },
  {
    id: "website",
    title: {
      th: "ข้อมูลเว็บไซต์ (CMS)",
      en: "Website Content & CMS",
      de: "Website-Inhalte & CMS",
    },
    description: {
      th: "จัดการเนื้อหาเกี่ยวกับวัด ข้อมูลติดต่อ ทางกฎหมาย และคลังสื่อ",
      en: "Manage About page, contact info, legal notices, and media library.",
      de: "Über-uns-Seite, Kontaktdaten, Impressum und Mediathek verwalten.",
    },
    iconName: "Globe",
  },
  {
    id: "operations",
    title: {
      th: "งานปฏิบัติการและกิจกรรม",
      en: "Operations & Events",
      de: "Betrieb & Veranstaltungen",
    },
    description: {
      th: "กิจกรรม ปฏิทิน ผู้ลงทะเบียน ชุมชน ตารางวัตร อัลบั้ม และทำเนียบพระสงฆ์",
      en: "Events, calendar, registrations, community, schedules, and monk roster.",
      de: "Veranstaltungen, Kalender, Anmeldungen, Forum, Tagesplan und Mönche.",
    },
    iconName: "CalendarDays",
  },
  {
    id: "finance",
    title: {
      th: "การเงินและบริการสมาชิก",
      en: "Finance & Member Services",
      de: "Finanzen & Mitglieder",
    },
    description: {
      th: "เงินบริจาค ตรวจสอบสลิป สมาชิก ข้อความติดต่อ และคำขอ PDPA/GDPR",
      en: "Donations, slip verification, members, inquiries, and PDPA/GDPR requests.",
      de: "Spenden, Belegprüfung, Mitglieder, Anfragen und Datenschutzanträge.",
    },
    iconName: "HandCoins",
  },
  {
    id: "system",
    title: {
      th: "ระบบและความปลอดภัย",
      en: "System & Security",
      de: "System & Sicherheit",
    },
    description: {
      th: "ผู้ดูแลระบบ การควบคุมบัญชี บทบาทและสิทธิ์ RBAC ประวัติการใช้งาน และตั้งค่า",
      en: "Admin users, account operations, RBAC roles, audit logs, and system settings.",
      de: "Benutzerverwaltung, Sitzungen, Rollen & Rechte, Audit-Logs und Einstellungen.",
    },
    iconName: "Shield",
  },
];

export const allGuideArticles: GuideArticle[] = [
  ...gettingStartedGuides,
  ...websiteCmsGuides,
  ...operationsGuides,
  ...financeGuides,
  ...systemGuides,
];

export function getAllGuideArticles(): GuideArticle[] {
  return allGuideArticles;
}

export function getGuideArticleBySlug(slug: string): GuideArticle | undefined {
  return allGuideArticles.find((article) => article.slug === slug);
}

export function getGuideArticlesByCategory(
  category: GuideCategory,
): GuideArticle[] {
  return allGuideArticles.filter((article) => article.category === category);
}

export function getGuideCategoryMeta(
  category: GuideCategory,
): GuideCategoryMeta | undefined {
  return guideCategories.find((cat) => cat.id === category);
}

export function getGuideByRoutePath(pathname: string): GuideArticle | undefined {
  // Normalize locale prefix e.g. "/th/admin/donations" -> "/admin/donations"
  const normalized = pathname.replace(/^\/(th|en|de)/, "");
  
  // Exact match first
  const exact = allGuideArticles.find((a) => a.routePath && a.routePath === normalized);
  if (exact) return exact;

  // Prefix match (e.g. "/admin/donations/123" -> matches "/admin/donations")
  return allGuideArticles.find(
    (a) => a.routePath && a.routePath !== "/admin" && normalized.startsWith(a.routePath),
  );
}

export function searchGuideArticles(
  query: string,
  locale: "th" | "en" | "de",
): GuideArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return allGuideArticles.filter((article) => {
    const titleMatch = article.title[locale]?.toLowerCase().includes(q) || false;
    const summaryMatch = article.summary[locale]?.toLowerCase().includes(q) || false;
    const quickStepsMatch = article.quickSteps.some((step) =>
      step[locale]?.toLowerCase().includes(q),
    );
    const stepsMatch = article.steps.some(
      (s) =>
        s.title[locale]?.toLowerCase().includes(q) ||
        s.description[locale]?.toLowerCase().includes(q),
    );
    const faqMatch =
      article.faqs?.some(
        (f) =>
          f.question[locale]?.toLowerCase().includes(q) ||
          f.answer[locale]?.toLowerCase().includes(q),
      ) || false;

    return (
      titleMatch ||
      summaryMatch ||
      quickStepsMatch ||
      stepsMatch ||
      faqMatch
    );
  });
}
