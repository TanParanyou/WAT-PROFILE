import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";
import ChantingPageContent from "./ChantingPageContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Chanting" });

  const title = t("pageTitle");
  const description = t("pageDescription");

  return buildPublicMetadata({
    locale,
    pathname: `/${locale}/chanting`,
    seo: normalizeSeo(undefined),
    content: {
      title,
      description,
    },
    messages: {
      title,
      description,
    },
  });
}

export default function ChantingPage() {
  return <ChantingPageContent />;
}
