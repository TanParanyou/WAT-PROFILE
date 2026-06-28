"use client";

import type { ContentPage } from "@/types/website-cms";
import { DevicePreviewFrame } from "@/components/admin/website/DevicePreviewFrame";
import { PublicAboutPageLayout } from "@/components/public/website/PublicAboutPageLayout";
import { PublicContactPageLayout } from "@/components/public/website/PublicContactPageLayout";
import { PublicHomePageLayout } from "@/components/public/website/PublicHomePageLayout";
import { PublicPageRenderer } from "@/components/public/website/PublicPageRenderer";
import { getDefaultContactSettings } from "@/services/siteSettingsService";
import type { WebsiteCmsPreviewDevice, WebsiteCmsPreviewMode } from "@/stores/website-cms-editor-store";
import { contentPageToPublicPreview, contentPageToPublishedPreview } from "@/utils/websiteCms";

const previewContactSettings = getDefaultContactSettings();

export function WebsitePreviewPanel({
  page,
  locale,
  device,
  mode,
}: {
  page: ContentPage;
  locale: string;
  device: WebsiteCmsPreviewDevice;
  mode: WebsiteCmsPreviewMode;
}) {
  const previewPage = mode === "published" ? contentPageToPublishedPreview(page) : contentPageToPublicPreview(page);
  const isContactPage = previewPage.slug === "contact" || previewPage.page_key === "PAGE-CONTACT";

  return (
    <DevicePreviewFrame device={device}>
      {previewPage.slug === "home" || previewPage.page_key === "PAGE-HOME" ? (
        <PublicHomePageLayout
          page={previewPage}
          locale={locale}
          latestEvents={[]}
          monks={[]}
          labels={getPreviewHomeLabels(locale)}
        />
      ) : previewPage.slug === "about" || previewPage.page_key === "PAGE-ABOUT" ? (
        <PublicAboutPageLayout page={previewPage} />
      ) : isContactPage ? (
        <PublicContactPageLayout
          page={previewPage}
          locale={locale}
          labels={getPreviewContactLabels(locale)}
          contactSettings={previewContactSettings}
          formSlot={<PreviewContactForm locale={locale} />}
        />
      ) : (
        <PublicPageRenderer page={previewPage} locale={locale} contactSettings={previewContactSettings} />
      )}
    </DevicePreviewFrame>
  );
}

function PreviewContactForm({ locale }: { locale: string }) {
  const labels = getPreviewFormLabels(locale);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <PreviewField label={labels.name} />
        <PreviewField label={labels.email} />
      </div>
      <PreviewField label={labels.subject} />
      <PreviewField label={labels.message} textarea />
      <div className="inline-flex h-11 items-center border border-zinc-950 bg-zinc-950 px-4 text-sm font-medium text-white">
        {labels.submit}
      </div>
    </div>
  );
}

function PreviewField({ label, textarea = false }: { label: string; textarea?: boolean }) {
  return (
    <div>
      <div className="text-sm font-medium text-zinc-700">{label}</div>
      <div
        className={
          textarea
            ? "mt-2 min-h-32 border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-400"
            : "mt-2 h-11 border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-400"
        }
      />
    </div>
  );
}

function getPreviewHomeLabels(locale: string) {
  switch (locale) {
    case "th":
      return {
        exploreEvents: "ดูรายการกิจกรรม",
        latestEvents: "กิจกรรมสำคัญ",
        eventsSubtitle: "อัปเดตกิจกรรมและวันสำคัญของวัด",
        monks: "พระสงฆ์",
        monksSubtitle: "รายชื่อพระสงฆ์ที่เกี่ยวข้องกับวัด",
        viewAll: "ดูทั้งหมด",
      };
    case "de":
      return {
        exploreEvents: "Veranstaltungen ansehen",
        latestEvents: "Ausgewaehlte Veranstaltungen",
        eventsSubtitle: "Aktuelles zu Tempelveranstaltungen und wichtigen Terminen.",
        monks: "Mönche",
        monksSubtitle: "Profile der mit dem Tempel verbundenen Mönche",
        viewAll: "Alle ansehen",
      };
    default:
      return {
        exploreEvents: "Explore events",
        latestEvents: "Latest Events",
        eventsSubtitle: "Temple event updates and important dates.",
        monks: "Monks",
        monksSubtitle: "Profiles of the monks connected to the temple",
        viewAll: "View all",
      };
  }
}

function getPreviewContactLabels(locale: string) {
  switch (locale) {
    case "th":
      return {
        infoEyebrow: "ติดต่อ",
        infoTitle: "ข้อมูลติดต่อ",
        messageEyebrow: "ข้อความ",
        formTitle: "ส่งข้อความถึงเรา",
        address: "ที่อยู่",
        phone: "โทรศัพท์",
        email: "อีเมล",
        social: "โซเชียล",
        bank: "บัญชีธนาคาร",
      };
    case "de":
      return {
        infoEyebrow: "Kontakt",
        infoTitle: "Kontaktdaten",
        messageEyebrow: "Nachricht",
        formTitle: "Schreiben Sie uns",
        address: "Adresse",
        phone: "Telefon",
        email: "E-Mail",
        social: "Soziale Medien",
        bank: "Bank",
      };
    default:
      return {
        infoEyebrow: "Contact",
        infoTitle: "Contact details",
        messageEyebrow: "Message",
        formTitle: "Send us a message",
        address: "Address",
        phone: "Phone",
        email: "Email",
        social: "Social",
        bank: "Bank",
      };
  }
}

function getPreviewFormLabels(locale: string) {
  switch (locale) {
    case "th":
      return {
        name: "ชื่อ",
        email: "อีเมล",
        subject: "หัวข้อ",
        message: "ข้อความ",
        submit: "ส่งข้อความ",
      };
    case "de":
      return {
        name: "Name",
        email: "E-Mail",
        subject: "Betreff",
        message: "Nachricht",
        submit: "Nachricht senden",
      };
    default:
      return {
        name: "Name",
        email: "Email",
        subject: "Subject",
        message: "Message",
        submit: "Send message",
      };
  }
}
