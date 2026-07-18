import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { websiteCmsPublicService } from "@/services/websiteCmsService";
import HomeContent from "./(client)/HomeContent";
import { siteConfig } from "@/config/site.config";
import { getLocalizedText } from "@/utils/localizedText";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.home" });
  const cmsPage = await websiteCmsPublicService.getPage("home").catch(() => null);
  const title = cmsPage ? getLocalizedText(cmsPage.title, locale) || t("heroTitle") : t("heroTitle");
  const description = cmsPage ? getLocalizedText(cmsPage.description, locale) || t("heroSubtitle") : t("heroSubtitle");

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${siteConfig.siteName.th}`,
      description,
      images: [{ url: siteConfig.seo.defaultOgImage, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        th: "/th",
        en: "/en",
        de: "/de",
      },
    },
  };
}

export default async function PublicHomePage() {
  const t = await getTranslations("Public.home");
  const cmsPage = await websiteCmsPublicService.getPage("home").catch(() => null);

  return (
    <HomeContent
      page={cmsPage}
      labels={{
        exploreEvents: t("exploreEvents"),
        latestEvents: t("latestEvents"),
        eventsSubtitle: t("eventsSubtitle"),
        monks: t("monks"),
        monksSubtitle: t("monksSubtitle"),
        viewAll: t("viewAll"),
      }}
    />
  );
}
