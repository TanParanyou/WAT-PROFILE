import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site.config";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";
import { RegisterForm } from "@/features/public/account/components/RegisterForm";
import { AuthShell } from "@/features/public/account/components/AuthShell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  const metadata = buildPublicMetadata({
    locale,
    pathname: `/${locale}/account/register`,
    seo: normalizeSeo({}),
    content: { title: t("register.title"), description: t("register.subtitle") },
    messages: { title: t("register.title"), description: t("register.subtitle") },
    site: { name: siteConfig.siteName.th, description: siteConfig.seo.defaultDescription, image: siteConfig.seo.defaultOgImage },
  });
  return { ...metadata, openGraph: { ...metadata.openGraph, title: `${metadata.title} | ${siteConfig.siteName.th}` } };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return (
    <AuthShell
      context={{
        title: t("register.title"),
        subtitle: t("register.subtitle"),
        backHref: "/account/login",
        backLabel: t("navigation.backToLogin"),
      }}
    >
      <RegisterForm />
    </AuthShell>
  );
}
