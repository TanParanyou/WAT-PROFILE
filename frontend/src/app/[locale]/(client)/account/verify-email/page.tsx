import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site.config";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";
import { VerifyEmailContent } from "@/features/public/account/components/RecoveryForms";
import { AuthShell } from "@/features/public/account/components/AuthShell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  const metadata = buildPublicMetadata({
    locale,
    pathname: `/${locale}/account/verify-email`,
    seo: normalizeSeo({}),
    content: { title: t("verifyEmail.title"), description: t("verifyEmail.subtitle") },
    messages: { title: t("verifyEmail.title"), description: t("verifyEmail.subtitle") },
    site: { name: siteConfig.siteName.th, description: siteConfig.seo.defaultDescription, image: siteConfig.seo.defaultOgImage },
  });
  return { ...metadata, openGraph: { ...metadata.openGraph, title: `${metadata.title} | ${siteConfig.siteName.th}` } };
}

export default async function VerifyEmailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return (
    <AuthShell
      context={{
        title: t("verifyEmail.title"),
        subtitle: t("verifyEmail.subtitle"),
        backHref: "/account/login",
        backLabel: t("back"),
      }}
    >
      <Suspense fallback={null}>
        <VerifyEmailContent />
      </Suspense>
    </AuthShell>
  );
}
