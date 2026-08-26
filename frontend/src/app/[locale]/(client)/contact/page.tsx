import ContactContent from "./ContactContent";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site.config";
import { publicContentService } from "@/services/publicContentService";
import { getLocalizedText } from "@/utils/localizedText";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";
import { serializeJsonLd } from "@/utils/jsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });
  const page = await publicContentService.getPublicContact().catch(() => null);
  return buildPublicMetadata({
    locale,
    pathname: `/${locale}/contact`,
    seo: normalizeSeo(page?.seo),
    content: {
      title: page ? getLocalizedText(page.title, locale) : "",
      description: page ? getLocalizedText(page.description, locale) : "",
      image: page?.seo?.og_image,
    },
    messages: { title: t("title"), description: t("subtitle") },
  });
}

const faqsByLocale: Record<string, Array<{ question: string; answer: string }>> = {
  th: [
    {
      question: "วัดเปิดให้เข้าทำบุญและปฏิบัติธรรมช่วงเวลาใด?",
      answer: "วัดเปิดทุกวันตั้งแต่เวลา 08:00 น. ถึง 18:00 น. สามารถร่วมทำบุญ ถวายภัตตาหาร และปฏิบัติธรรมได้ตามเวลาดังกล่าว",
    },
    {
      question: "การแต่งกายในการมาวัดควรเป็นอย่างไร?",
      answer: "ขอความร่วมมือแต่งกายสุภาพ เรียบร้อย หลีกเลี่ยงเสื้อผ้าเปิดไหล่หรือกระโปรง/กางเกงขาสั้น",
    },
    {
      question: "มีที่จอดรถและวิธีเดินทางอย่างไร?",
      answer: `วัดตั้งอยู่ที่ ${siteConfig.contact.addressDetails?.streetAddress || "Am Pflaster 11"}, ${siteConfig.contact.addressDetails?.postalCode || "63599"} ${siteConfig.contact.addressDetails?.addressLocality || "Biebergemünd"} มีพื้นที่จอดรถสำหรับผู้มาติดต่อ`,
    },
  ],
  en: [
    {
      question: "What are the opening hours for meditation and visits?",
      answer: "The temple is open daily from 08:00 to 18:00 for prayer, meditation, and merit making.",
    },
    {
      question: "What is the dress code when visiting the temple?",
      answer: "Please dress respectfully in modest clothing covering shoulders and knees.",
    },
    {
      question: "Is parking available at the temple?",
      answer: `The temple is located at ${siteConfig.contact.addressDetails?.streetAddress || "Am Pflaster 11"}, ${siteConfig.contact.addressDetails?.postalCode || "63599"} ${siteConfig.contact.addressDetails?.addressLocality || "Biebergemünd"} with on-site visitor parking.`,
    },
  ],
  de: [
    {
      question: "Wie sind die Öffnungszeiten des Tempels?",
      answer: "Der Tempel ist täglich von 08:00 bis 18:00 Uhr für Meditation, Besuche und Gebete geöffnet.",
    },
    {
      question: "Gibt es eine Kleiderordnung für Besucher?",
      answer: "Bitte tragen Sie respektvolle, dezente Kleidung, die Schultern und Knie bedeckt.",
    },
    {
      question: "Gibt es Parkmöglichkeiten vor Ort?",
      answer: `Der Tempel befindet sich in der ${siteConfig.contact.addressDetails?.streetAddress || "Am Pflaster 11"}, ${siteConfig.contact.addressDetails?.postalCode || "63599"} ${siteConfig.contact.addressDetails?.addressLocality || "Biebergemünd"} mit Parkplätzen vor Ort.`,
    },
  ],
};

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const faqs = faqsByLocale[locale] || faqsByLocale.th;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />
      <ContactContent locale={locale} />
    </>
  );
}
