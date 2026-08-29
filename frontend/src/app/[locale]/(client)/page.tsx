import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { websiteCmsPublicService } from "@/services/websiteCmsService";
import HeroSection from "@/components/home/HeroSection";
import WelcomeSection from "@/components/home/WelcomeSection";
import EventsSection from "@/components/home/EventsSection";
import DonationSection from "@/components/home/DonationSection";
import HomeNewsSection from "@/components/home/HomeNewsSection";
import EventAlertModal from "@/components/home/EventAlertModal";
import { siteConfig } from "@/config/site.config";
import { getLocalizedText } from "@/utils/localizedText";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "PublicHome" });
  const cmsPage = await websiteCmsPublicService.getPage("home").catch(() => null);
  const title = cmsPage ? getLocalizedText(cmsPage.title, locale) || t("heroFallbackTitle") : t("heroFallbackTitle");
  const description = cmsPage ? getLocalizedText(cmsPage.description, locale) || t("heroFallbackDescription") : t("heroFallbackDescription");

  const siteName = getLocalizedText(siteConfig.siteName, locale) || siteConfig.siteName.th;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale,
      title: `${title} | ${siteName}`,
      description,
      images: [{ url: siteConfig.seo.defaultOgImage, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        th: "/th",
        en: "/en",
        de: "/de",
        "x-default": "/th",
      },
    },
  };
}

export default async function PublicHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="flex min-h-screen flex-col">
      <HeroSection />
      <WelcomeSection />
      <EventsSection locale={locale} />
      <HomeNewsSection />
      <DonationSection />
      <EventAlertModal />
    </div>
  );
}
