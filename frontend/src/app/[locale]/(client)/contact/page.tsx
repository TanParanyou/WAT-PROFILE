import ContactContent from "./ContactContent";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site.config";
import { publicContentService } from "@/services/publicContentService";
import { getLocalizedText } from "@/utils/localizedText";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });
  const page = await publicContentService.getPublicContact().catch(() => null);
  const metadata = buildPublicMetadata({
    locale,
    pathname: `/${locale}/contact`,
    seo: normalizeSeo(page?.seo),
    content: {
      title: page ? getLocalizedText(page.title, locale) : "",
      description: page ? getLocalizedText(page.description, locale) : "",
      image: page?.seo.og_image,
    },
    messages: { title: t("title"), description: t("subtitle") },
    site: { name: siteConfig.siteName.th, description: siteConfig.seo.defaultDescription, image: siteConfig.seo.defaultOgImage },
  });
  return { ...metadata, openGraph: { ...metadata.openGraph, title: `${metadata.title} | ${siteConfig.siteName.th}` } };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ContactContent locale={locale} />;
}
