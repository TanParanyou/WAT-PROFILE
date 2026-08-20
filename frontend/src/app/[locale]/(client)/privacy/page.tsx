import type { Metadata } from "next";
import PrivacyContent from "./PrivacyContent";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site.config";
import { publicContentService } from "@/services/publicContentService";
import { getLocalizedText } from "@/utils/localizedText";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPage" });
  const page = await publicContentService.getPublicPrivacy().catch(() => null);
  return buildPublicMetadata({
    locale,
    pathname: `/${locale}/privacy`,
    seo: normalizeSeo(page?.seo),
    content: { title: page ? getLocalizedText(page.title, locale) : "", description: "", image: page?.seo.og_image },
    messages: { title: t("title"), description: t("title") },
  });
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
