import type { Metadata } from "next";
import ImpressumContent from "./ImpressumContent";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site.config";
import { publicContentService } from "@/services/publicContentService";
import { getLocalizedText } from "@/utils/localizedText";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ImpressumPage" });
  const page = await publicContentService.getPublicImpressum().catch(() => null);
  return buildPublicMetadata({
    locale,
    pathname: `/${locale}/impressum`,
    seo: normalizeSeo(page?.seo),
    content: {
      title: page ? getLocalizedText(page.title, locale) : "",
      description: page ? getLocalizedText(page.description, locale) : "",
      image: page?.seo.og_image,
    },
    messages: { title: t("title"), description: t("title") },
  });
}

export default function ImpressumPage() {
  return <ImpressumContent />;
}
