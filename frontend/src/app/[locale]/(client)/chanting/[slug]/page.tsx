import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";
import ChantingDetailContent from "./ChantingDetailContent";
import { publicService } from "@/services/publicService";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Chanting" });

  let chantTitle = "";
  let chantDesc = t("pageDescription");
  try {
    const res = await publicService.getChantingBySlug(slug);
    if (res.data) {
      const loc = locale as "th" | "en" | "de";
      chantTitle = res.data.title?.[loc] || res.data.title?.th || slug;
      if (res.data.subtitle?.[loc] || res.data.subtitle?.th) {
        chantDesc = res.data.subtitle?.[loc] || res.data.subtitle?.th || chantDesc;
      }
    }
  } catch {
    // fallback
  }

  const fullTitle = chantTitle ? `${chantTitle} | ${t("pageTitle")}` : t("pageTitle");

  return buildPublicMetadata({
    locale,
    pathname: `/${locale}/chanting/${slug}`,
    seo: normalizeSeo(undefined),
    content: {
      title: fullTitle,
      description: chantDesc,
    },
    messages: {
      title: fullTitle,
      description: chantDesc,
    },
  });
}

export default async function ChantingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ChantingDetailContent slug={slug} />;
}
