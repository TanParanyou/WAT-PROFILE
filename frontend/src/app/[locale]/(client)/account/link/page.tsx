import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site.config";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";
import { LinkAccountContent } from "@/features/public/account/components/LinkAccount";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  const metadata = buildPublicMetadata({
    locale,
    pathname: `/${locale}/account/link`,
    seo: normalizeSeo({}),
    content: { title: t("link.title"), description: t("link.approvalSentBody") },
    messages: { title: t("link.title"), description: t("link.approvalSentBody") },
    site: { name: siteConfig.siteName.th, description: siteConfig.seo.defaultDescription, image: siteConfig.seo.defaultOgImage },
  });
  return { ...metadata, openGraph: { ...metadata.openGraph, title: `${metadata.title} | ${siteConfig.siteName.th}` } };
}

export default async function LinkAccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  void locale;
  return (
    <Suspense fallback={null}>
      <LinkAccountContent />
    </Suspense>
  );
}
