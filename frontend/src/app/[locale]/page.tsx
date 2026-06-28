import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { publicService } from "@/services/publicService";
import { websiteCmsPublicService } from "@/services/websiteCmsService";
import { PublicHomePageLayout } from "@/components/public/website/PublicHomePageLayout";
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
  const locale = await getLocale();
  const t = await getTranslations("Public.home");
  const cmsPage = await websiteCmsPublicService.getPage("home").catch(() => null);

  const [eventsRes, monksRes] = await Promise.all([
    publicService.getLatestEvents(3),
    publicService.getMonks(),
  ]);

  const latestEvents = eventsRes?.data || [];
  const monks = monksRes?.data?.slice(0, 4) || [];

  return (
    <PublicHomePageLayout
      page={cmsPage}
      locale={locale}
      latestEvents={latestEvents}
      monks={monks}
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
